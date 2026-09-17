import * as vscode from 'vscode';
import { androidDriver } from '../../lib/adb';
import type { ConnectedDevice } from '../../lib/driver';

export class AdbStatusBarManager implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private activeDevice: ConnectedDevice | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = 'adbsnap.devices';
    this.statusBarItem.text = '$(device-mobile) ADB: Initializing...';
    this.statusBarItem.tooltip = 'ADBSnap: Click to select device or refresh';
    this.statusBarItem.show();

    this.refresh();
    // Poll devices every 10 seconds in the background
    this.pollInterval = setInterval(() => this.refresh(), 10000);
  }

  public async refresh(): Promise<ConnectedDevice[]> {
    if (this.isRefreshing) return [];
    this.isRefreshing = true;

    try {
      const devices = await androidDriver.listDevices();
      
      if (devices.length === 0) {
        this.activeDevice = null;
        this.statusBarItem.text = '$(device-mobile) ADB: No Device';
        this.statusBarItem.tooltip = 'No ADB devices found. Click to refresh or pair wireless device.';
        this.statusBarItem.backgroundColor = undefined;
      } else {
        // Keep active device if still attached, otherwise pick first authorized
        const currentStillAttached = devices.find((d) => d.id === this.activeDevice?.id);
        if (currentStillAttached) {
          this.activeDevice = currentStillAttached;
        } else {
          const firstReady = devices.find((d) => d.isAuthorized);
          this.activeDevice = firstReady || devices[0];
        }

        if (!this.activeDevice.isAuthorized) {
          this.statusBarItem.text = `$(alert) ${this.activeDevice.model} (Unauthorized)`;
          this.statusBarItem.tooltip = `Device ${this.activeDevice.id} requires USB debugging authorization on device screen.`;
          this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
          const typeBadge = this.activeDevice.type === 'wifi' ? 'Wi-Fi' : this.activeDevice.type === 'emulator' ? 'Emu' : 'USB';
          this.statusBarItem.text = `$(device-mobile) ${this.activeDevice.model} (${typeBadge})`;
          this.statusBarItem.tooltip = `Active Target: ${this.activeDevice.model} [${this.activeDevice.id}]\nClick to switch devices.`;
          this.statusBarItem.backgroundColor = undefined;
        }
      }
      return devices;
    } catch {
      this.statusBarItem.text = '$(alert) ADB: Not Detected';
      this.statusBarItem.tooltip = 'ADB command failed or not found. Check Android SDK or PATH settings.';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      return [];
    } finally {
      this.isRefreshing = false;
    }
  }

  public getActiveDevice(): ConnectedDevice | null {
    return this.activeDevice;
  }

  public setActiveDevice(device: ConnectedDevice): void {
    this.activeDevice = device;
    const typeBadge = device.type === 'wifi' ? 'Wi-Fi' : device.type === 'emulator' ? 'Emu' : 'USB';
    this.statusBarItem.text = `$(device-mobile) ${device.model} (${typeBadge})`;
    this.statusBarItem.tooltip = `Active Target: ${device.model} [${device.id}]\nClick to switch devices.`;
    this.statusBarItem.backgroundColor = undefined;
  }

  public dispose() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.statusBarItem.dispose();
  }
}
