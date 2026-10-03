import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { isIosDeviceId } from '../lib/devices.js';
import { IOSDriver, type IOSCommandRunner } from '../lib/ios.js';
import {
  getIosExplorerSigningArguments,
  parseIosDeviceApps,
} from '../lib/ios-explorer.js';
import { getMockScreenshotBuffer } from '../mocks/mock-screens.js';

async function main(): Promise<void> {
  if (process.platform !== 'darwin') {
    throw new Error('The iOS driver test requires macOS.');
  }

  const physicalId = '00008110-001234567890001E';
  assert.equal(isIosDeviceId(physicalId), true);
  assert.deepEqual(
    parseIosDeviceApps({
      result: {
        apps: [
          { bundleIdentifier: 'com.example.Sample', name: 'Sample App' },
          { bundleId: 'com.example.Legacy', displayName: 'Legacy App' },
          { bundleIdentifier: 'com.example.Runner.xctrunner', name: 'Runner' },
          { bundleIdentifier: 'com.apple.Settings', name: 'Settings', isSystemApp: true },
        ],
      },
    }),
    [
      { bundleIdentifier: 'com.example.Legacy', name: 'Legacy App', isDemo: false },
      { bundleIdentifier: 'com.example.Sample', name: 'Sample App', isDemo: false },
    ]
  );
  assert.throws(
    () => parseIosDeviceApps({ result: { unexpected: [] } }),
    /unrecognized app inventory/
  );
  assert.deepEqual(getIosExplorerSigningArguments(false), ['CODE_SIGNING_ALLOWED=NO']);
  assert.deepEqual(
    getIosExplorerSigningArguments(true, 'abc123def4'),
    [
      'CODE_SIGNING_ALLOWED=YES',
      'CODE_SIGN_STYLE=Automatic',
      'ADBSNAP_BUNDLE_PREFIX=com.abc123def4.adbsnap',
      'DEVELOPMENT_TEAM=ABC123DEF4',
    ]
  );
  assert.throws(
    () => getIosExplorerSigningArguments(true, 'invalid'),
    /valid 10-character Apple Developer Team ID/
  );
  const screenshot = getMockScreenshotBuffer();
  const commands: string[][] = [];
  const execute: IOSCommandRunner = async (_command, args) => {
    commands.push(args);
    if (args[0] === 'simctl') {
      return { stdout: JSON.stringify({ devices: {} }), stderr: '' };
    }
    if (args[0] === 'devicectl' && args.includes('screenshot') && args.includes('--destination')) {
      const destination = args[args.indexOf('--destination') + 1];
      await fs.writeFile(destination, screenshot);
      return { stdout: '', stderr: '' };
    }
    if (args[0] === 'devicectl') {
      return {
        stdout: JSON.stringify({
          result: {
            devices: [
              {
                identifier: physicalId,
                properties: {
                  connection: { pairingState: 'paired', state: 'connected', transportType: 'wired' },
                  hardware: {
                    marketingName: 'iPhone Test Device',
                    platform: 'iOS',
                    productType: 'iPhone99,1',
                    reality: 'physical',
                    udid: physicalId,
                  },
                  state: { name: 'iPhone Test Device' },
                },
              },
              {
                identifier: 'simulator-not-physical',
                properties: {
                  connection: { pairingState: 'paired', state: 'connected', transportType: 'sameMachine' },
                  hardware: { marketingName: 'Simulator', reality: 'simulated' },
                },
              },
            ],
          },
        }),
        stderr: '',
      };
    }
    throw new Error(`Unexpected command: ${args.join(' ')}`);
  };

  const driver = new IOSDriver(execute);
  const devices = await driver.listDevices();
  assert.equal(devices.length, 1);
  assert.equal(devices[0].id, physicalId);
  assert.equal(devices[0].platform, 'ios');
  assert.equal(devices[0].type, 'usb');
  assert.equal(devices[0].model, 'iPhone Test Device');
  assert.equal(devices[0].isAuthorized, true);

  const captured = await driver.captureScreenshot(physicalId);
  assert.deepEqual(captured, screenshot);
  assert.ok(
    commands.some(
      (args) =>
        args[0] === 'devicectl' &&
        args.includes('--device') &&
        args.includes(physicalId) &&
        args.includes('--destination')
    )
  );

  console.log('iOS physical-device driver test passed: paired-device discovery and screenshot routing.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
