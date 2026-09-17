import * as vscode from 'vscode';
import { androidDriver } from '../../../lib/adb';
import type { ConnectedDevice } from '../../../lib/driver';
import type { AdbStatusBarManager } from '../statusBar';

export class DeviceTreeItem extends vscode.TreeItem {
  constructor(
    public readonly device: ConnectedDevice,
    public readonly isActive: boolean
  ) {
    super(device.model, vscode.TreeItemCollapsibleState.None);

    const typeLabel = device.type === 'wifi' ? 'Wi-Fi' : device.type === 'emulator' ? 'Emulator' : 'USB';
    this.description = `${device.id} • ${typeLabel}${isActive ? ' (Active)' : ''}`;

    if (!device.isAuthorized) {
      this.tooltip = `Device: ${device.model} (${device.id})\nStatus: Unauthorized (Confirm USB debugging on phone)`;
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

export class DevicesTreeDataProvider implements vscode.TreeDataProvider<DeviceTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<DeviceTreeItem | undefined | null | void> =
    new vscode.EventEmitter<DeviceTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<DeviceTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private devices: ConnectedDevice[] = [];

  constructor(private statusBarManager: AdbStatusBarManager) {}

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: DeviceTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<DeviceTreeItem[]> {
    try {
      this.devices = await androidDriver.listDevices();
      const activeDevice = this.statusBarManager.getActiveDevice();

      if (this.devices.length === 0) {
        return [];
      }

      return this.devices.map(
        (dev) => new DeviceTreeItem(dev, activeDevice?.id === dev.id)
      );
    } catch {
      return [];
    }
  }

  public getDevices(): ConnectedDevice[] {
    return this.devices;
  }
}
