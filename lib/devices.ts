import { androidDriver } from './adb';
import { iosDriver } from './ios';
import type { ConnectedDevice } from './driver';

const IOS_DEVICE_ID_PATTERN =
  /^(?:[0-9A-F]{8}-[0-9A-F]{16}|[0-9A-F]{8}-(?:[0-9A-F]{4}-){3}[0-9A-F]{12})$/i;

export function isIosDeviceId(deviceId: string): boolean {
  return IOS_DEVICE_ID_PATTERN.test(deviceId);
}

/**
 * Discovers all active mobile devices and emulators across both Android and iOS platforms.
 */
export async function listAllDevices(): Promise<ConnectedDevice[]> {
  const [androidDevices, iosDevices] = await Promise.all([
    androidDriver.listDevices().catch(() => []),
    iosDriver.listDevices().catch(() => []),
  ]);
  return [...androidDevices, ...iosDevices];
}

/**
 * Captures screenshot from targeted device, automatically routing to the correct platform driver.
 */
export async function captureDeviceScreenshot(deviceId?: string): Promise<Buffer> {
  if (deviceId && isIosDeviceId(deviceId)) {
    return iosDriver.captureScreenshot(deviceId);
  }
  return androidDriver.captureScreenshot(deviceId);
}
