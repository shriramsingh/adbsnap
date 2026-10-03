export const MESSAGES = {
  STARTUP_BANNER: 'ADBSnap — Automated Mobile Showcase Studio',
  SCANNING_DEVICES: 'Scanning for connected Android and iOS devices...',
  DEVICE_CONNECTED: (name: string, type: string) => `Connected to ${name} (${type.toUpperCase()})`,
  CAPTURE_START: 'Capturing in-memory screenshot stream...',
  CAPTURE_SUCCESS: (ms: number, sizeKb: number) => `Captured in ${ms}ms (${sizeKb} KB in RAM)`,
  WIFI_SWITCHING: 'Switching device to wireless mode on port 5555...',
  WIFI_SUCCESS: (ip: string) => `Wireless mode ready at ${ip}:5555. You can now disconnect the USB cable!`,
  COMPOSITE_START: 'Compositing screenshot into device frame and backdrop...',
  COMPOSITE_SUCCESS: (ms: number, w: number, h: number) => `Composited in ${ms}ms (${w}x${h} px)`,
  SAVED_TO: (filePath: string) => `Showcase asset saved to ${filePath}`,
  RAW_SAVED: (filePath: string) => `Raw mobile capture saved to ${filePath}`,
  NO_DEVICES_FOUND: 'No authorized mobile devices detected. Connect an Android device, boot an iOS simulator, or pair an iPhone/iPad with this Mac.',
  EXPORT_START: (count: number) => `Generating ${count} App Store & Google Play assets...`,
  EXPORT_COMPLETE: (count: number, ms: number) => `Multi-store export complete: ${count} assets generated in ${ms}ms`,
} as const;

