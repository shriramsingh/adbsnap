import * as vscode from 'vscode';
import { listAllDevices } from '../../../lib/devices';
import type { ConnectedDevice } from '../../../lib/driver';
import type { AdbStatusBarManager } from '../statusBar';

export class DeviceTreeItem extends vscode.TreeItem {
  constructor(
    public readonly device: ConnectedDevice,
    public readonly isActive: boolean
  ) {
    super(device.model, vscode.TreeItemCollapsibleState.None);

    const typeLabel = device.platform === 'ios'
      ? device.type === 'emulator' ? 'iOS Simulator' : `iOS ${device.type === 'wifi' ? 'Wi-Fi' : 'Device'}`
      : device.type === 'wifi' ? 'Wi-Fi' : device.type === 'emulator' ? 'Emulator' : 'USB';
    this.description = `${device.id} • ${typeLabel}${isActive ? ' (Active)' : ''}`;

    if (!device.isAuthorized) {
      const authorizationHelp = device.platform === 'ios'
        ? 'Pair and trust this Mac on the device'
        : 'Confirm USB debugging on the phone';
      this.tooltip = `Device: ${device.model} (${device.id})\nStatus: Unauthorized (${authorizationHelp})`;
      this.iconPath = new vscode.ThemeIcon('alert', new vscode.ThemeColor('errorForeground'));
      this.contextValue = 'device-unauthorized';
    } else {
      this.tooltip = `Device: ${device.model} (${device.id})\nProduct: ${device.product}\nType: ${typeLabel}\nStatus: Ready`;
      this.iconPath = new vscode.ThemeIcon(
        device.type === 'wifi' ? 'radio-tower' : 'device-mobile',
        isActive ? new vscode.ThemeColor('charts.green') : undefined
      );
      if (device.type === 'wifi') {
        this.contextValue = isActive ? 'device-wifi-active' : 'device-wifi-ready';
      } else {
        this.contextValue = isActive ? 'device-active' : 'device-ready';
      }
    }

    this.command = {
      command: 'adbsnap.setActiveDeviceFromTree',
      title: 'Select Active Device',
      arguments: [device],
    };
  }
}

export class DisconnectedDeviceTreeItem extends vscode.TreeItem {
  constructor(public readonly endpoint: string) {
    super(`Android Device (${endpoint})`, vscode.TreeItemCollapsibleState.None);
    this.description = `${endpoint} • Wi-Fi (Offline - Click to Reconnect)`;
    this.tooltip = `Known wireless device at ${endpoint}.\nClick to reconnect over Wi-Fi.`;
    this.iconPath = new vscode.ThemeIcon('radio-tower', new vscode.ThemeColor('disabledForeground'));
    this.contextValue = 'device-wifi-offline';
    this.command = {
      command: 'adbsnap.reconnectDevice',
      title: 'Reconnect Wireless Device',
      arguments: [endpoint],
    };
  }
}

export class DevicesTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> =
    new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private devices: ConnectedDevice[] = [];

  constructor(private statusBarManager: AdbStatusBarManager) {
    // Automatically re-render tree when status bar detects connection or device switch
    statusBarManager.onDidDeviceChange.event(() => {
      this.refresh();
    });
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    try {
      this.devices = await listAllDevices();
      const activeDevice = this.statusBarManager.getActiveDevice();
      const items: vscode.TreeItem[] = [];

      for (const dev of this.devices) {
        items.push(new DeviceTreeItem(dev, activeDevice?.id === dev.id));
      }

      // If a known wireless device is disconnected, surface it with 1-click reconnect
      const lastEndpoint = this.statusBarManager.getLastWirelessEndpoint();
      if (lastEndpoint && !this.devices.some((d) => d.id === lastEndpoint)) {
        items.push(new DisconnectedDeviceTreeItem(lastEndpoint));
      }

      return items;
    } catch {
      return [];
    }
  }

  public getDevices(): ConnectedDevice[] {
    return this.devices;
  }
}
