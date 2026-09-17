import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { ConnectedDevice, DeviceDriver, DeviceConnectionType } from './driver';
import { ADB_COMMANDS } from '../constants/commands';
import { CONFIG } from '../constants/config';

let cachedAdbPath: string | null = null;

export function resolveAdbPath(): string {
  if (cachedAdbPath) return cachedAdbPath;

  if (process.env.ADB_PATH && fs.existsSync(process.env.ADB_PATH)) {
    cachedAdbPath = process.env.ADB_PATH;
    return cachedAdbPath;
  }

  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (androidHome) {
    const adbExt = process.platform === 'win32' ? 'adb.exe' : 'adb';
    const candidate = path.join(androidHome, 'platform-tools', adbExt);
    if (fs.existsSync(candidate)) {
      cachedAdbPath = candidate;
      return cachedAdbPath;
    }
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const winCandidate = path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
    if (fs.existsSync(winCandidate)) {
      cachedAdbPath = winCandidate;
      return cachedAdbPath;
    }
  } else if (process.platform === 'darwin') {
    const macCandidate = path.join(os.homedir(), 'Library', 'Android', 'sdk', 'platform-tools', 'adb');
    if (fs.existsSync(macCandidate)) {
      cachedAdbPath = macCandidate;
      return cachedAdbPath;
    }
  } else {
    const linuxCandidate = path.join(os.homedir(), 'Android', 'Sdk', 'platform-tools', 'adb');
    if (fs.existsSync(linuxCandidate)) {
      cachedAdbPath = linuxCandidate;
      return cachedAdbPath;
    }
  }

  cachedAdbPath = 'adb';
  return cachedAdbPath;
}

export class AndroidDriver implements DeviceDriver {
  readonly platform = 'android' as const;

  /**
   * Helper to execute adb commands with timeout and error handling.
   */
  async exec(args: string[], timeoutMs: number = CONFIG.DEFAULT_TIMEOUT_MS): Promise<string> {
    const adbBinary = resolveAdbPath();
    return new Promise((resolve, reject) => {
      execFile(adbBinary, args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`ADB command "${adbBinary} ${args.join(' ')}" failed: ${stderr || err.message}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  /**
   * Discovers and parses all currently attached Android devices (USB, Wi-Fi, Emulator).
   */
  async listDevices(): Promise<ConnectedDevice[]> {
    const output = await this.exec(ADB_COMMANDS.DEVICES as unknown as string[]);
    const lines = output.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const devices: ConnectedDevice[] = [];

    for (const line of lines) {
      if (line.startsWith('List of devices attached') || line.startsWith('* daemon')) {
        continue;
      }

      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;

      const id = parts[0];
      const rawStatus = parts[1];
      const isAuthorized = rawStatus === 'device';

      let model = id;
      let product = 'generic';

      for (let i = 2; i < parts.length; i++) {
        const part = parts[i];
        if (part.startsWith('model:')) {
          model = part.replace('model:', '').replace(/_/g, ' ');
        } else if (part.startsWith('product:')) {
          product = part.replace('product:', '');
        }
      }

      let type: DeviceConnectionType = 'usb';
      if (id.includes(':')) {
        type = 'wifi';
      } else if (id.startsWith('emulator-')) {
        type = 'emulator';
      }

      devices.push({
        id,
        platform: 'android',
        type,
        model,
        product,
        isAuthorized,
        rawStatus,
      });
    }

    return devices;
  }

  /**
   * Captures raw screenshot directly into a memory Buffer via `adb exec-out screencap -p`.
   * Zero temporary files are written to the mobile device or host disk.
   */
  async captureScreenshot(deviceId?: string): Promise<Buffer> {
    let targetId = deviceId;
    if (!targetId) {
      try {
        const devices = await this.listDevices();
        const ready = devices.find((d) => d.isAuthorized);
        if (ready) targetId = ready.id;
      } catch {
        // Fallback to default
      }
    }

    const args = targetId
      ? ['-s', targetId, ...(ADB_COMMANDS.SCREENCAP as unknown as string[])]
      : (ADB_COMMANDS.SCREENCAP as unknown as string[]);

    const adbBinary = resolveAdbPath();
    return new Promise((resolve, reject) => {
      execFile(
        adbBinary,
        args,
        {
          encoding: 'buffer',
          maxBuffer: 50 * 1024 * 1024,
          timeout: CONFIG.DEFAULT_TIMEOUT_MS,
        },
        (err, stdout, stderr) => {
          if (err) {
            reject(new Error(`Screenshot capture failed: ${stderr ? stderr.toString() : err.message}`));
          } else {
            if (!stdout || stdout.length === 0) {
              reject(new Error('Received empty screenshot buffer from ADB.'));
              return;
            }
            resolve(stdout as unknown as Buffer);
          }
        }
      );
    });
  }

  /**
   * Extracts the internal local Wi-Fi IP address of an attached device with multi-layer fallbacks.
   */
  async getDeviceIp(deviceId: string): Promise<string> {
    // Strategy 1: Standard wlan0 interface
    try {
      const output = await this.exec(['-s', deviceId, ...(ADB_COMMANDS.WLAN_IP as unknown as string[])]);
      const match = output.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
      if (match && match[1] && !match[1].startsWith('127.')) {
        return match[1];
      }
    } catch {
      // Continue to next strategy
    }

    // Strategy 2: ip route (preferred source IP)
    try {
      const routeOutput = await this.exec(['-s', deviceId, 'shell', 'ip', 'route']);
      const routeMatch = routeOutput.match(/src\s+(\d+\.\d+\.\d+\.\d+)/);
      if (routeMatch && routeMatch[1] && !routeMatch[1].startsWith('127.')) {
        return routeMatch[1];
      }
    } catch {
      // Continue to next strategy
    }

    // Strategy 3: ip -f inet addr (inspect all non-loopback network interfaces)
    try {
      const addrOutput = await this.exec(['-s', deviceId, 'shell', 'ip', '-f', 'inet', 'addr']);
      const lines = addrOutput.split('\n');
      for (const line of lines) {
        const m = line.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
        if (m && m[1] && !m[1].startsWith('127.')) {
          return m[1];
        }
      }
    } catch {
      // Continue to next strategy
    }

    // Strategy 4: Android system getprop fallback
    try {
      const propOutput = await this.exec(['-s', deviceId, 'shell', 'getprop', 'dhcp.wlan0.ipaddress']);
      const trimmed = propOutput.trim();
      if (/^\d+\.\d+\.\d+\.\d+$/.test(trimmed)) {
        return trimmed;
      }
    } catch {
      // Exhausted all strategies
    }

    throw new Error(`Unable to determine Wi-Fi IP address for device ${deviceId}. Please verify that your phone is connected to your Wi-Fi network.`);
  }

  /**
   * 1-Click Switch: Puts USB-connected device in TCP mode, finds its IP, and connects over Wi-Fi.
   */
  async enableWireless(deviceId: string, port: number = CONFIG.DEFAULT_PORT): Promise<string> {
    const ip = await this.getDeviceIp(deviceId);
    
    await this.exec(['-s', deviceId, ...ADB_COMMANDS.TCP_IP(port)]);
    await new Promise((r) => setTimeout(r, 800));

    const connectOutput = await this.exec(ADB_COMMANDS.CONNECT(ip, port));
    if (!connectOutput.includes('connected to') && !connectOutput.includes('already connected')) {
      throw new Error(`Failed to connect over Wi-Fi to ${ip}:${port}: ${connectOutput}`);
    }

    return `${ip}:${port}`;
  }

  /**
   * Disconnects a wireless ADB session and resets device connection back to USB mode.
   */
  async disableWireless(deviceId?: string): Promise<string> {
    if (deviceId && deviceId.includes(':')) {
      try {
        await this.exec(['disconnect', deviceId]);
      } catch {
        // Ignored if connection was already closed
      }
    }
    const prefix = deviceId && !deviceId.includes(':') ? ['-s', deviceId] : [];
    return await this.exec([...prefix, 'usb']);
  }

  /**
   * Connects directly to an existing wireless device endpoint (IP:Port).
   */
  async connectWifi(ip: string, port: number = CONFIG.DEFAULT_PORT): Promise<{ success: boolean; message: string }> {
    try {
      const output = await this.exec(ADB_COMMANDS.CONNECT(ip, port));
      if (output.includes('connected to') || output.includes('already connected')) {
        return { success: true, message: output };
      }
      return { success: false, message: output || 'Failed to connect' };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  /**
   * Pairs an Android 11+ device using pairing code and pairing port.
   */
  async pairWifi(ip: string, port: number, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const output = await this.exec(ADB_COMMANDS.PAIR(ip, port, code));
      if (output.includes('Successfully paired') || output.includes('already paired')) {
        return { success: true, message: output };
      }
      return { success: false, message: output || 'Pairing failed' };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  /**
   * Detects the currently open/focused application package on the phone screen.
   */
  async getForegroundApp(deviceId?: string): Promise<string | null> {
    const prefix = deviceId ? ['-s', deviceId] : [];
    const output = await this.exec([...prefix, ...(ADB_COMMANDS.FOREGROUND_APP as unknown as string[])]);
    
    // Looks for patterns like: mCurrentFocus=Window{... u0 com.package.name/com.package.name.MainActivity}
    // or mFocusedApp=AppWindowToken{... u0 com.package.name/.MainActivity}
    const match = output.match(/mCurrentFocus[^\n]*\s([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\//) ||
                  output.match(/mFocusedApp[^\n]*\s([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\//) ||
                  output.match(/topResumedActivity[^\n]*\s([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\//);

    return match ? match[1] : null;
  }

  /**
   * Instantly wipes app data, tokens, and cache in <100ms, returning app to pristine logged-out state.
   */
  async resetAppData(packageName: string, deviceId?: string): Promise<void> {
    const prefix = deviceId ? ['-s', deviceId] : [];
    await this.exec([...prefix, ...ADB_COMMANDS.CLEAR_APP(packageName)]);
  }

  /**
   * Launches an app from cold start using Android Monkey launcher trigger.
   */
  async launchApp(packageName: string, deviceId?: string): Promise<void> {
    const prefix = deviceId ? ['-s', deviceId] : [];
    await this.exec([...prefix, ...ADB_COMMANDS.LAUNCH_APP(packageName)]);
  }

  /**
   * Terminates the app process completely.
   */
  async killApp(packageName: string, deviceId?: string): Promise<void> {
    const prefix = deviceId ? ['-s', deviceId] : [];
    await this.exec([...prefix, ...ADB_COMMANDS.FORCE_STOP(packageName)]);
  }

  /**
   * Toggles Android SystemUI Demo Mode (pristine 9:41 AM, 100% battery, full wifi, no notifications).
   */
  async setDemoMode(enable: boolean, deviceId?: string): Promise<void> {
    const prefix = deviceId ? ['-s', deviceId] : [];
    if (enable) {
      await this.exec([...prefix, 'shell', 'settings', 'put', 'global', 'sysui_demo_allowed', '1']);
      await this.exec([...prefix, 'shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', 'enter']);
      await this.exec([...prefix, 'shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', 'clock', '-e', 'hhmm', '0941']);
      await this.exec([...prefix, 'shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', 'battery', '-e', 'level', '100', '-e', 'plugged', 'false']);
      await this.exec([...prefix, 'shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', 'network', '-e', 'wifi', 'show', '-e', 'level', '4', '-e', 'fully', 'true']);
      await this.exec([...prefix, 'shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', 'network', '-e', 'mobile', 'show', '-e', 'datatype', 'false', '-e', 'level', '4']);
      await this.exec([...prefix, 'shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', 'notifications', '-e', 'visible', 'false']);
    } else {
      await this.exec([...prefix, 'shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', 'exit']);
    }
  }

  /**
   * Records a high-definition MP4 clip directly from the mobile screen using adb screenrecord.
   */
  async recordVideo(seconds: number = 5, deviceId?: string): Promise<Buffer> {
    const prefix = deviceId ? ['-s', deviceId] : [];
    const remotePath = '/sdcard/adbsnap_temp_rec.mp4';
    const localTmp = path.join(os.tmpdir(), `adbsnap-rec-${Date.now()}.mp4`);

    try {
      await this.exec([...prefix, 'shell', 'rm', '-f', remotePath]);
    } catch {
      // ignore
    }

    const duration = Math.min(Math.max(seconds, 1), 30);
    await this.exec(
      [...prefix, 'shell', 'screenrecord', '--time-limit', String(duration), remotePath],
      (duration + 10) * 1000
    );

    await this.exec([...prefix, 'pull', remotePath, localTmp], 30000);

    const buffer = fs.readFileSync(localTmp);

    try {
      fs.unlinkSync(localTmp);
    } catch {
      // ignore
    }

    try {
      await this.exec([...prefix, 'shell', 'rm', '-f', remotePath]);
    } catch {
      // ignore
    }

    return buffer;
  }
}

export const androidDriver = new AndroidDriver();
