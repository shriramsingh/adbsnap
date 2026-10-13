import * as vscode from 'vscode';
import { listAllDevices } from '../../lib/devices';
import { androidDriver } from '../../lib/adb';
import type { ConnectedDevice } from '../../lib/driver';

export class AdbStatusBarManager implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private activeDevice: ConnectedDevice | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  // Auto-reconnect state
  private lastWirelessEndpoint: string | null = null;
  private isAutoReconnecting = false;
  private reconnectAttempts = 0;
  private maxAutoReconnectAttempts = 4;

  public readonly onDidDeviceChange = new vscode.EventEmitter<ConnectedDevice | null>();

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = 'adbsnap.openMenu';
    this.statusBarItem.text = '$(device-mobile) ADBSnap: Initializing...';
    this.statusBarItem.tooltip = 'ADBSnap: Click to open Mobile Command Center';
    this.statusBarItem.show();

    this.refresh();
    // Poll devices every 8 seconds in the background
    this.pollInterval = setInterval(() => this.refresh(), 8000);
  }

  public setLastWirelessEndpoint(endpoint: string | null): void {
    this.lastWirelessEndpoint = endpoint;
    if (endpoint) {
      this.reconnectAttempts = 0;
    }
  }

  public getLastWirelessEndpoint(): string | null {
    return this.lastWirelessEndpoint;
  }

  public async refresh(): Promise<ConnectedDevice[]> {
    if (this.isRefreshing) return [];
    this.isRefreshing = true;

    try {
      const devices = await listAllDevices();

      // Check if we lost a wireless device and should auto-reconnect
      if (
        devices.length === 0 &&
        this.lastWirelessEndpoint &&
        !this.isAutoReconnecting &&
        this.reconnectAttempts < this.maxAutoReconnectAttempts
      ) {
        this.attemptAutoReconnect(false);
      }

      if (devices.length === 0) {
        if (!this.isAutoReconnecting) {
          this.activeDevice = null;
          if (this.lastWirelessEndpoint) {
            this.statusBarItem.text = `$(radio-tower) ${this.lastWirelessEndpoint} (Offline)`;
            this.statusBarItem.tooltip = `Wi-Fi device ${this.lastWirelessEndpoint} is disconnected. Click to reconnect.`;
          } else {
            this.statusBarItem.text = '$(device-mobile) No Device';
            this.statusBarItem.tooltip = 'No mobile devices found. Click to refresh connected devices or connect over Wi-Fi.';
          }
          this.statusBarItem.backgroundColor = undefined;
          this.onDidDeviceChange.fire(null);
        }
      } else {
        // Keep active device if still attached, otherwise pick first authorized
        const currentStillAttached = devices.find((d) => d.id === this.activeDevice?.id);
        if (currentStillAttached) {
          this.activeDevice = currentStillAttached;
        } else {
          const firstReady = devices.find((d) => d.isAuthorized);
          this.activeDevice = firstReady || devices[0];
        }

        // Track wireless endpoint if active device is Wi-Fi
        if (this.activeDevice?.type === 'wifi' && this.activeDevice.id.includes(':')) {
          this.lastWirelessEndpoint = this.activeDevice.id;
          this.reconnectAttempts = 0;
        }

        if (!this.activeDevice.isAuthorized) {
          this.statusBarItem.text = `$(alert) ${this.activeDevice.model} (Unauthorized)`;
          this.statusBarItem.tooltip = this.activeDevice.platform === 'ios'
            ? `Device ${this.activeDevice.id} must be paired and trusted with this Mac.`
            : `Device ${this.activeDevice.id} requires USB debugging authorization on the device screen.`;
          this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
          const typeBadge = this.activeDevice.platform === 'ios'
            ? this.activeDevice.type === 'emulator' ? 'iOS Sim' : 'iOS'
            : this.activeDevice.type === 'wifi' ? 'Wi-Fi' : this.activeDevice.type === 'emulator' ? 'Emu' : 'USB';
          this.statusBarItem.text = `$(device-mobile) ${this.activeDevice.model} (${typeBadge})`;
          this.statusBarItem.tooltip = `Active Target: ${this.activeDevice.model} [${this.activeDevice.id}]\nClick to switch devices.`;
          this.statusBarItem.backgroundColor = undefined;
        }
        this.onDidDeviceChange.fire(this.activeDevice);
      }
      return devices;
    } catch {
      this.statusBarItem.text = '$(alert) Device Scan Failed';
      this.statusBarItem.tooltip = 'Device discovery failed. Check ADB and Xcode command-line tool configuration.';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      return [];
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Attempts automatic background reconnection to the last known Wi-Fi device.
   */
  public async attemptAutoReconnect(manual = false): Promise<boolean> {
    if (!this.lastWirelessEndpoint || this.isAutoReconnecting) return false;
    this.isAutoReconnecting = true;

    const endpoint = this.lastWirelessEndpoint;
    const [ip, portStr] = endpoint.split(':');
    const port = portStr ? Number(portStr) : 5555;

    this.statusBarItem.text = `$(sync~spin) Reconnecting ${endpoint}...`;
    this.statusBarItem.tooltip = `Attempting wireless reconnect to ${endpoint} (Attempt ${this.reconnectAttempts + 1}/${this.maxAutoReconnectAttempts})`;
    this.statusBarItem.backgroundColor = undefined;

    try {
      const res = await androidDriver.connectWifi(ip, port);
      if (res.success) {
        this.reconnectAttempts = 0;
        this.isAutoReconnecting = false;
        await this.refresh();
        vscode.window.showInformationMessage(`📶 ADBSnap: Reconnected to wireless device (${endpoint})!`);
        return true;
      } else {
        this.reconnectAttempts++;
        if (manual) {
          vscode.window.showWarningMessage(`❌ Wireless reconnect failed for ${endpoint}: ${res.message}`);
        }
      }
    } catch (err) {
      this.reconnectAttempts++;
      if (manual) {
        vscode.window.showErrorMessage(`❌ Wireless reconnect error: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      this.isAutoReconnecting = false;
    }

    return false;
  }

  public getActiveDevice(): ConnectedDevice | null {
    return this.activeDevice;
  }

  public setActiveDevice(device: ConnectedDevice): void {
    this.activeDevice = device;
    if (device.type === 'wifi' && device.id.includes(':')) {
      this.lastWirelessEndpoint = device.id;
      this.reconnectAttempts = 0;
    }
    const typeBadge = device.platform === 'ios'
      ? device.type === 'emulator' ? 'iOS Sim' : 'iOS'
      : device.type === 'wifi' ? 'Wi-Fi' : device.type === 'emulator' ? 'Emu' : 'USB';
    this.statusBarItem.text = `$(device-mobile) ${device.model} (${typeBadge})`;
    this.statusBarItem.tooltip = `Active Target: ${device.model} [${device.id}]\nClick to switch devices.`;
    this.statusBarItem.backgroundColor = undefined;
    this.onDidDeviceChange.fire(device);
  }

  public dispose() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.statusBarItem.dispose();
    this.onDidDeviceChange.dispose();
  }
}
