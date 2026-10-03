import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { ConnectedDevice, DeviceConnectionType, DeviceDriver } from './driver';

interface Simulator {
  udid: string;
  name?: string;
  state: string;
  deviceTypeIdentifier?: string;
}

interface SimulatorList {
  devices?: Record<string, Simulator[]>;
}

interface DeviceCtlDevice {
  identifier?: string;
  properties?: {
    connection?: {
      pairingState?: string;
      state?: string;
      transportType?: string;
    };
    hardware?: {
      deviceType?: string;
      marketingName?: string;
      platform?: string;
      productType?: string;
      reality?: string;
      udid?: string;
    };
    state?: {
      name?: string;
    };
  };
}

interface DeviceCtlList {
  result?: {
    devices?: DeviceCtlDevice[];
  };
}

interface CommandResult {
  stdout: string;
  stderr: string;
}

export type IOSCommandRunner = (
  command: string,
  args: string[],
  options?: { timeout?: number; maxBuffer?: number }
) => Promise<CommandResult>;

const runCommand: IOSCommandRunner = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }
      resolve({ stdout, stderr });
    });
  });

/**
 * Discovers iOS simulators with `simctl` and paired physical devices with `devicectl`.
 */
export class IOSDriver implements DeviceDriver {
  readonly platform = 'ios' as const;

  constructor(private readonly execute: IOSCommandRunner = runCommand) {}

  /**
   * Verifies whether Xcode's simulator tooling is available on this host.
   */
  async isAvailable(): Promise<boolean> {
    if (process.platform !== 'darwin') return false;
    try {
      await this.execute('xcrun', ['simctl', 'help']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lists booted simulators and connected physical iOS devices on macOS.
   */
  async listDevices(): Promise<ConnectedDevice[]> {
    if (process.platform !== 'darwin') return [];

    const [simulators, physicalDevices] = await Promise.all([
      this.listSimulators(),
      this.listPhysicalDevices(),
    ]);
    return [...simulators, ...physicalDevices];
  }

  private async listSimulators(): Promise<ConnectedDevice[]> {
    let stdout: string;
    try {
      ({ stdout } = await this.execute('xcrun', ['simctl', 'list', 'devices', 'booted', '--json']));
    } catch {
      return [];
    }

    const parsed = JSON.parse(stdout) as SimulatorList;
    return Object.values(parsed.devices ?? {})
      .flat()
      .filter((device) => device.state === 'Booted')
      .map((device) => ({
        id: device.udid,
        platform: 'ios' as const,
        type: 'emulator' as const,
        model: device.name || 'iOS Simulator',
        product: device.deviceTypeIdentifier || 'iPhone',
        isAuthorized: true,
        rawStatus: device.state,
      }));
  }

  private async listPhysicalDevices(): Promise<ConnectedDevice[]> {
    const { stdout } = await this.execute('xcrun', [
      'devicectl',
      '--quiet',
      'list',
      'devices',
      '--json-output',
      '-',
    ]);
    const parsed = JSON.parse(stdout) as DeviceCtlList;

    return (parsed.result?.devices ?? [])
      .filter((device) => device.properties?.hardware?.reality?.toLowerCase() === 'physical')
      .filter((device) => device.properties?.connection?.state?.toLowerCase() === 'connected')
      .map((device) => {
        const hardware = device.properties?.hardware;
        const connection = device.properties?.connection;
        const pairingState = connection?.pairingState?.toLowerCase() ?? 'unknown';
        const state = connection?.state ?? 'unknown';

        return {
          id: device.identifier || hardware?.udid || '',
          platform: 'ios' as const,
          type: this.connectionType(connection?.transportType),
          model: hardware?.marketingName || device.properties?.state?.name || 'iOS Device',
          product: hardware?.productType || hardware?.deviceType || 'iPhone',
          isAuthorized: pairingState === 'paired',
          rawStatus: `${state}; pairing ${pairingState}`,
        };
      })
      .filter((device) => device.id.length > 0);
  }

  private connectionType(transportType?: string): DeviceConnectionType {
    const transport = transportType?.toLowerCase();
    return transport && ['wifi', 'wireless', 'network', 'remote'].includes(transport) ? 'wifi' : 'usb';
  }

  /**
   * Captures a screenshot from a booted simulator or connected physical iOS device.
   */
  async captureScreenshot(deviceId?: string): Promise<Buffer> {
    if (process.platform !== 'darwin') {
      throw new Error('iOS screenshot capture requires macOS with Xcode installed and configured.');
    }

    const devices = await this.listDevices();
    const device = deviceId
      ? devices.find((candidate) => candidate.id === deviceId)
      : devices.find((candidate) => candidate.isAuthorized);

    if (!device) {
      throw new Error(
        deviceId
          ? `No available iOS simulator or paired device found with identifier "${deviceId}".`
          : 'No booted iOS simulator or connected, paired iOS device found.'
      );
    }
    if (!device.isAuthorized) {
      throw new Error(`iOS device "${device.model}" is not paired with this Mac.`);
    }

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'adbsnap-ios-'));
    const tmpFile = path.join(tmpDir, 'capture.png');
    try {
      if (device.type === 'emulator') {
        await this.execute(
          'xcrun',
          ['simctl', 'io', device.id, 'screenshot', tmpFile],
          { timeout: 120_000, maxBuffer: 50 * 1024 * 1024 }
        );
      } else {
        await this.execute(
          'xcrun',
          [
            'devicectl',
            'device',
            'capture',
            'screenshot',
            '--device',
            device.id,
            '--destination',
            tmpFile,
            '--quiet',
          ],
          { timeout: 120_000, maxBuffer: 50 * 1024 * 1024 }
        );
      }

      const screenshot = await fs.readFile(tmpFile);
      if (screenshot.length === 0) {
        throw new Error(`Received empty screenshot from iOS device "${device.model}".`);
      }
      return screenshot;
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }
}

export const iosDriver = new IOSDriver();
