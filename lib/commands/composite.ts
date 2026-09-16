import type { DeviceDriver } from '../driver';

export interface CapturedAppScreen {
  packageName: string | null;
  buffer: Buffer;
}

/**
 * Composite Action: Fully kills, wipes cache/auth, and cold-launches an app.
 * Returns the app to a pristine first-install welcome state in <500ms.
 */
export async function freshRestartApp(
  driver: DeviceDriver,
  packageName: string,
  deviceId?: string
): Promise<void> {
  if (driver.killApp) await driver.killApp(packageName, deviceId);
  if (driver.resetAppData) await driver.resetAppData(packageName, deviceId);
  if (driver.launchApp) await driver.launchApp(packageName, deviceId);
}

/**
 * Composite Action: Identifies the currently open app on screen and takes its screenshot.
 */
export async function captureForegroundApp(
  driver: DeviceDriver,
  deviceId?: string
): Promise<CapturedAppScreen> {
  const packageName = driver.getForegroundApp ? await driver.getForegroundApp(deviceId) : null;
  const buffer = await driver.captureScreenshot(deviceId);
  return { packageName, buffer };
}
