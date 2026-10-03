import { execFile } from 'node:child_process';
import type { ConnectedDevice, DeviceDriver } from './driver';

/**
 * Driver implementation for Apple iOS Simulators via Xcode `simctl`.
 * Fully adheres to the pluggable `DeviceDriver` interface.
 */
export class IOSDriver implements DeviceDriver {
  readonly platform = 'ios' as const;

  /**
   * Verifies if Xcode simctl is available on the host machine.
   */
  async isAvailable(): Promise<boolean> {
    if (process.platform !== 'darwin') return false;
    return new Promise((resolve) => {
      execFile('xcrun', ['simctl', 'help'], (err) => {
        resolve(!err);
      });
    });
  }

  /**
   * Lists all currently booted iOS simulators.
   * Returns empty array gracefully on non-macOS platforms.
   */
  async listDevices(): Promise<ConnectedDevice[]> {
    if (process.platform !== 'darwin') return [];

    return new Promise((resolve) => {
      execFile('xcrun', ['simctl', 'list', 'devices', 'booted', '--json'], (err, stdout) => {
        if (err || !stdout) return resolve([]);
        try {
          const parsed = JSON.parse(stdout);
          const devices: ConnectedDevice[] = [];
          const deviceList = parsed.devices || {};

          for (const runtime of Object.keys(deviceList)) {
            for (const dev of deviceList[runtime]) {
              if (dev.state === 'Booted') {
                devices.push({
                  id: dev.udid,
                  platform: 'ios',
                  type: 'emulator',
                  model: dev.name || 'iOS Simulator',
                  product: dev.deviceTypeIdentifier || 'iPhone',
                  isAuthorized: true,
                  rawStatus: 'Booted',
                });
              }
            }
          }
          resolve(devices);
        } catch {
          resolve([]);
        }
      });
    });
  }

  /**
   * Captures in-memory PNG screenshot stream directly from booted simulator.
   * Streams uncompressed binary stdout directly into RAM buffer.
   */
  async captureScreenshot(deviceId?: string): Promise<Buffer> {
    if (process.platform !== 'darwin') {
      throw new Error('iOS Simulator screenshot capture requires macOS with Xcode Command Line Tools installed.');
    }

    const target = deviceId || 'booted';
    return new Promise((resolve, reject) => {
      execFile(
        'xcrun',
        ['simctl', 'io', target, 'screenshot', '-'],
        { encoding: 'buffer', maxBuffer: 50 * 1024 * 1024 },
        (err, stdout, stderr) => {
          if (err) {
            reject(new Error(`iOS Simulator screenshot failed: ${stderr ? stderr.toString() : err.message}`));
          } else {
            if (!stdout || stdout.length === 0) {
              reject(new Error('Received empty screenshot from iOS Simulator.'));
              return;
            }
            resolve(stdout as unknown as Buffer);
          }
        }
      );
    });
  }
}

export const iosDriver = new IOSDriver();
