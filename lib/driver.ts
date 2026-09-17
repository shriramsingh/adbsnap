export type Platform = 'android' | 'ios';
export type DeviceConnectionType = 'usb' | 'wifi' | 'emulator';

export interface ConnectedDevice {
  id: string;
  platform: Platform;
  type: DeviceConnectionType;
  model: string;
  product: string;
  isAuthorized: boolean;
  rawStatus: string;
}

export interface DeviceDriver {
  readonly platform: Platform;
  listDevices(): Promise<ConnectedDevice[]>;
  captureScreenshot(deviceId?: string): Promise<Buffer>;
  enableWireless?(deviceId: string): Promise<string>;
  disableWireless?(deviceId?: string): Promise<string>;
  connectWifi?(ip: string, port?: number): Promise<{ success: boolean; message: string }>;
  pairWifi?(ip: string, port: number, code: string): Promise<{ success: boolean; message: string }>;
  resetAppData?(packageName: string, deviceId?: string): Promise<void>;
  launchApp?(packageName: string, deviceId?: string): Promise<void>;
  killApp?(packageName: string, deviceId?: string): Promise<void>;
  getForegroundApp?(deviceId?: string): Promise<string | null>;
}
