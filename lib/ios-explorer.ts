import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { isIosDeviceId, listAllDevices } from './devices';

const DEFAULT_DEMO_BUNDLE_ID = 'com.adbsnap.AutoExplorerDemo';
const execFileAsync = promisify(execFile);

interface Simulator {
  udid: string;
  name?: string;
  state?: string;
  isAvailable?: boolean;
  deviceTypeIdentifier?: string;
}

interface SimulatorList {
  devices?: Record<string, Simulator[]>;
}

interface ExportedAttachment {
  exportedFileName?: string;
  suggestedHumanReadableName?: string;
}

interface AttachmentManifestEntry {
  attachments?: ExportedAttachment[];
}

export interface IOSExplorerOptions {
  bundleIdentifier: string;
  deviceId?: string;
  developmentTeam?: string;
  outputDirectory?: string;
}

export interface IOSExplorerScreenshot {
  title: string;
  buffer: Buffer;
}

export interface IOSSimulatorApp {
  bundleIdentifier: string;
  name: string;
  isDemo: boolean;
}

export type IOSApp = IOSSimulatorApp;

export function getIosExplorerSigningArguments(
  isPhysicalDevice: boolean,
  teamId?: string
): string[] {
  if (!isPhysicalDevice) return ['CODE_SIGNING_ALLOWED=NO'];
  const developmentTeam = teamId?.trim().toUpperCase();
  if (!developmentTeam || !/^[A-Z0-9]{10}$/.test(developmentTeam)) {
    throw new Error('Physical-device Auto Explorer requires a valid 10-character Apple Developer Team ID.');
  }
  return [
    'CODE_SIGNING_ALLOWED=YES',
    'CODE_SIGN_STYLE=Automatic',
    `ADBSNAP_BUNDLE_PREFIX=com.${developmentTeam.toLowerCase()}.adbsnap`,
    `DEVELOPMENT_TEAM=${developmentTeam}`,
  ];
}

function run(command: string, args: string[], timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000).unref();
      reject(new Error(`${command} timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
    }, timeoutMs);

    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('close', (code, signal) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with ${signal ? `signal ${signal}` : `code ${code}`}.`));
      }
    });
  });
}

function safeFileName(value: string): string {
  const fileName = path.basename(value).replace(/[^A-Za-z0-9._-]+/g, '-');
  return fileName.toLowerCase().endsWith('.png') ? fileName : `${fileName || 'tab'}.png`;
}

async function getAvailableSimulators(): Promise<Simulator[]> {
  const { stdout } = await execFileAsync('xcrun', ['simctl', 'list', 'devices', 'available', '--json']);
  const parsed = JSON.parse(stdout) as SimulatorList;
  return Object.values(parsed.devices ?? {})
    .flat()
    .filter((simulator) => simulator.udid && simulator.isAvailable !== false);
}

function chooseSimulator(simulators: Simulator[], deviceId?: string): Simulator {
  if (deviceId) {
    const simulator = simulators.find((candidate) => candidate.udid === deviceId);
    if (!simulator) {
      throw new Error(`Available iOS simulator "${deviceId}" was not found.`);
    }
    return simulator;
  }

  const simulator =
    simulators.find((candidate) => candidate.state === 'Booted' && candidate.deviceTypeIdentifier?.includes('.iPhone-')) ??
    simulators.find((candidate) => candidate.state === 'Booted') ??
    simulators.find((candidate) => candidate.deviceTypeIdentifier?.includes('.iPhone-')) ??
    simulators[0];
  if (!simulator) {
    throw new Error('No available iOS simulator found. Install an iOS Simulator runtime in Xcode.');
  }
  return simulator;
}

function parseAttachmentNames(manifest: unknown): Map<string, string> {
  if (!Array.isArray(manifest)) return new Map();
  const names = new Map<string, string>();
  for (const entry of manifest as AttachmentManifestEntry[]) {
    for (const attachment of entry.attachments ?? []) {
      if (attachment.exportedFileName && attachment.suggestedHumanReadableName) {
        names.set(attachment.exportedFileName, safeFileName(attachment.suggestedHumanReadableName));
      }
    }
  }
  return names;
}

async function convertPropertyListToJson(propertyList: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const child = spawn('plutil', ['-convert', 'json', '-o', '-', '-'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (code !== 0) {
        reject(
          new Error(
            `plutil could not parse simulator app metadata: ${
              Buffer.concat(stderr).toString('utf8').trim() || signal || `exit code ${code}`
            }`
          )
        );
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(stdout).toString('utf8')) as Record<string, unknown>);
      } catch (error) {
        reject(new Error('Simulator app metadata was not valid JSON after plist conversion.', { cause: error }));
      }
    });
    child.stdin.end(propertyList);
  });
}

/**
 * Lists user-installed apps on a booted simulator, plus the auto-installable demo fixture.
 */
export async function listIosSimulatorApps(deviceId: string): Promise<IOSSimulatorApp[]> {
  if (process.platform !== 'darwin') {
    throw new Error('Listing iOS simulator apps requires macOS with Xcode installed.');
  }

  const { stdout: propertyList } = await execFileAsync(
    'xcrun',
    ['simctl', 'listapps', deviceId],
    { timeout: 60_000, maxBuffer: 20 * 1024 * 1024 }
  );
  const installedApps = await convertPropertyListToJson(propertyList);
  const apps: IOSSimulatorApp[] = Object.entries(installedApps).flatMap(([bundleIdentifier, value]) => {
    if (!value || typeof value !== 'object') return [];
    if (bundleIdentifier.toLowerCase().endsWith('.xctrunner')) return [];
    const record = value as Record<string, unknown>;
    if (record.ApplicationType !== 'User') return [];
    const name =
      (typeof record.CFBundleDisplayName === 'string' && record.CFBundleDisplayName) ||
      (typeof record.CFBundleName === 'string' && record.CFBundleName) ||
      bundleIdentifier;
    const isDemo = bundleIdentifier === DEFAULT_DEMO_BUNDLE_ID;
    return [{
      bundleIdentifier,
      name: isDemo ? 'ADBSnap Auto Explorer Demo' : name,
      isDemo,
    }];
  });

  if (!apps.some((app) => app.bundleIdentifier === DEFAULT_DEMO_BUNDLE_ID)) {
    apps.push({
      bundleIdentifier: DEFAULT_DEMO_BUNDLE_ID,
      name: 'ADBSnap Auto Explorer Demo',
      isDemo: true,
    });
  }

  return apps.sort((left, right) => {
    if (left.isDemo !== right.isDemo) return left.isDemo ? -1 : 1;
    return left.name.localeCompare(right.name) || left.bundleIdentifier.localeCompare(right.bundleIdentifier);
  });
}

function readAppCollection(value: unknown): unknown[] | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const apps = record.apps;
  if (Array.isArray(apps)) return apps;
  if (apps && typeof apps === 'object') return Object.entries(apps).map(([bundleIdentifier, app]) => ({
    bundleIdentifier,
    ...(app && typeof app === 'object' ? app : {}),
  }));
  return readAppCollection(record.result) ?? readAppCollection(record.device);
}

export function parseIosDeviceApps(payload: unknown): IOSApp[] {
  const records = readAppCollection(payload);
  if (!records) {
    throw new Error('The connected device returned an unrecognized app inventory from devicectl.');
  }

  return records.flatMap((value) => {
    if (!value || typeof value !== 'object') return [];
    const record = value as Record<string, unknown>;
    const bundleIdentifier =
      (typeof record.bundleIdentifier === 'string' && record.bundleIdentifier) ||
      (typeof record.bundleId === 'string' && record.bundleId) ||
      (typeof record.CFBundleIdentifier === 'string' && record.CFBundleIdentifier);
    if (!bundleIdentifier || bundleIdentifier.toLowerCase().endsWith('.xctrunner')) return [];
    if (record.isSystemApp === true || record.applicationType === 'System') return [];
    const name =
      (typeof record.name === 'string' && record.name) ||
      (typeof record.displayName === 'string' && record.displayName) ||
      (typeof record.CFBundleDisplayName === 'string' && record.CFBundleDisplayName) ||
      bundleIdentifier;
    return [{ bundleIdentifier, name, isDemo: false }];
  }).sort((left, right) =>
    left.name.localeCompare(right.name) || left.bundleIdentifier.localeCompare(right.bundleIdentifier)
  );
}

export async function listIosDeviceApps(deviceId: string): Promise<IOSApp[]> {
  if (process.platform !== 'darwin') {
    throw new Error('Listing iOS device apps requires macOS with Xcode installed.');
  }
  if (!isIosDeviceId(deviceId)) {
    throw new Error(`Invalid iOS device identifier: "${deviceId}".`);
  }
  const { stdout } = await execFileAsync(
    'xcrun',
    ['devicectl', 'device', 'info', 'apps', '--device', deviceId, '--json-output', '-'],
    { timeout: 60_000, maxBuffer: 20 * 1024 * 1024 }
  );
  let payload: unknown;
  try {
    payload = JSON.parse(stdout);
  } catch (error) {
    throw new Error('devicectl returned invalid JSON for the installed app inventory.', { cause: error });
  }
  return parseIosDeviceApps(payload);
}

/**
 * Uses Apple's XCTest UI automation to explore accessible simulator or paired-device screens.
 */
export async function exploreIosTabs(options: IOSExplorerOptions): Promise<IOSExplorerScreenshot[]> {
  if (process.platform !== 'darwin') {
    throw new Error('iOS Auto Explorer requires macOS with Xcode installed.');
  }
  if (!/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(options.bundleIdentifier)) {
    throw new Error(`Invalid iOS app bundle identifier: "${options.bundleIdentifier}".`);
  }

  const connectedDevice = options.deviceId
    ? (await listAllDevices()).find(
      (device) => device.platform === 'ios' && device.id === options.deviceId && device.isAuthorized
    )
    : undefined;
  if (options.deviceId && !connectedDevice) {
    throw new Error(`Authorized iOS device "${options.deviceId}" is not connected. Pair and trust it with this Mac first.`);
  }
  const isPhysicalDevice = Boolean(connectedDevice && connectedDevice.type !== 'emulator');
  const developmentTeam = options.developmentTeam?.trim().toUpperCase();

  const simulator = isPhysicalDevice
    ? undefined
    : chooseSimulator(await getAvailableSimulators(), options.deviceId);
  const destinationId = connectedDevice?.id ?? simulator!.udid;
  let bootedByExplorer = false;
  let temporaryDirectory: string | undefined;
  let resultBundle: string | undefined;
  let attachmentDirectory: string | undefined;
  const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
  const projectPath = path.resolve(
    moduleDirectory,
    '../ios/AutoExplorer/ADBSnapAutoExplorer.xcodeproj'
  );
  const derivedData = path.join(os.homedir(), '.adbsnap', 'ios-explorer', 'DerivedData');
  const commonArgs = [
    '-quiet',
    '-project',
    projectPath,
    '-scheme',
    'ADBSnapAutoExplorer',
    '-destination',
    `id=${destinationId}`,
    '-derivedDataPath',
    derivedData,
    '-parallel-testing-enabled',
    'NO',
    `ADBSNAP_TARGET_BUNDLE_ID=${options.bundleIdentifier}`,
  ];
  commonArgs.push(...getIosExplorerSigningArguments(isPhysicalDevice, developmentTeam));
  let succeeded = false;

  try {
    if (simulator) {
      if (simulator.state !== 'Booted') {
        await execFileAsync('xcrun', ['simctl', 'boot', simulator.udid]);
        bootedByExplorer = true;
      }
      if (bootedByExplorer) {
        await execFileAsync('xcrun', ['simctl', 'bootstatus', simulator.udid, '-b'], {
          timeout: 240_000,
          maxBuffer: 10 * 1024 * 1024,
        });
      }
    }

    temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'adbsnap-ios-explore-'));
    resultBundle = path.join(temporaryDirectory, 'AutoExplorer.xcresult');
    attachmentDirectory = path.join(temporaryDirectory, 'attachments');

    const projectExists = await fs.stat(projectPath).then(() => true, () => false);
    if (!projectExists) {
      throw new Error(
        `The bundled iOS Auto Explorer Xcode project is missing at ${projectPath}. Rebuild or reinstall ADBSnap.`
      );
    }

    if (simulator) {
      const simulatorDevice = (await listAllDevices()).find(
        (device) => device.id === simulator.udid && device.type === 'emulator'
      );
      if (!simulatorDevice) {
        throw new Error(`ADBSnap could not discover booted simulator ${simulator.name || simulator.udid}.`);
      }
    }

    if (isPhysicalDevice) {
      const installedApps = await listIosDeviceApps(destinationId);
      if (!installedApps.some((app) => app.bundleIdentifier === options.bundleIdentifier)) {
        throw new Error(
          `App "${options.bundleIdentifier}" is not installed on physical device ${connectedDevice?.model || destinationId}. Install it on the device, then retry.`
        );
      }
    } else if (options.bundleIdentifier !== DEFAULT_DEMO_BUNDLE_ID) {
      try {
        await execFileAsync('xcrun', [
          'simctl',
          'get_app_container',
          destinationId,
          options.bundleIdentifier,
          'app',
        ]);
      } catch (error) {
        throw new Error(
          `App "${options.bundleIdentifier}" is not installed on simulator ${destinationId}. Install it in the simulator, then retry. ${error instanceof Error ? error.message : String(error)}`,
          { cause: error }
        );
      }
    }

    await run(
      'xcodebuild',
      [
        'build-for-testing',
        ...(isPhysicalDevice ? ['-allowProvisioningUpdates', '-allowProvisioningDeviceRegistration'] : []),
        ...commonArgs,
      ],
      600_000
    );

    if (!isPhysicalDevice && options.bundleIdentifier === DEFAULT_DEMO_BUNDLE_ID) {
      const demoApp = path.join(
        derivedData,
        'Build/Products/Debug-iphonesimulator/ADBSnapExplorerDemo.app'
      );
      await run('xcrun', ['simctl', 'install', destinationId, demoApp], 60_000);
    }

    await run(
      'xcodebuild',
      ['test-without-building', ...commonArgs, '-resultBundlePath', resultBundle],
      300_000
    );

    await fs.mkdir(attachmentDirectory, { recursive: true });
    await run(
      'xcrun',
      [
        'xcresulttool',
        'export',
        'attachments',
        '--path',
        resultBundle,
        '--output-path',
        attachmentDirectory,
        '--filter',
        '*.png',
      ],
      60_000
    );

    const manifestPath = path.join(attachmentDirectory, 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as unknown;
    const attachmentNames = parseAttachmentNames(manifest);
    const entries = await fs.readdir(attachmentDirectory, { withFileTypes: true });
    const screenshots: IOSExplorerScreenshot[] = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.png')) continue;
      const title = attachmentNames.get(entry.name) ?? safeFileName(entry.name);
      screenshots.push({
        title,
        buffer: await fs.readFile(path.join(attachmentDirectory, entry.name)),
      });
    }
    screenshots.sort((left, right) => {
      const leftIndex = left.title.match(/ADBSnap-screen-(\d+)/i);
      const rightIndex = right.title.match(/ADBSnap-screen-(\d+)/i);
      const leftOrder = leftIndex ? Number(leftIndex[1]) : Number.MAX_SAFE_INTEGER;
      const rightOrder = rightIndex ? Number(rightIndex[1]) : Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder || left.title.localeCompare(right.title);
    });

    if (screenshots.length === 0) {
      throw new Error('XCTest completed without exporting any tab screenshots.');
    }

    if (options.outputDirectory) {
      await fs.mkdir(options.outputDirectory, { recursive: true });
      for (const screenshot of screenshots) {
        await fs.writeFile(
          path.join(options.outputDirectory, safeFileName(screenshot.title)),
          screenshot.buffer
        );
      }
    }

    succeeded = true;
    return screenshots;
  } catch (error) {
    if (resultBundle && error instanceof Error && error.message.includes('xcodebuild exited')) {
      try {
        const { stdout } = await execFileAsync('xcrun', [
          'xcresulttool',
          'get',
          'test-results',
          'tests',
          '--path',
          resultBundle,
          '--compact',
        ]);
        const result = JSON.parse(stdout) as { testNodes?: unknown[] };
        const failureMessages: string[] = [];
        const visit = (value: unknown) => {
          if (Array.isArray(value)) {
            value.forEach(visit);
          } else if (value && typeof value === 'object') {
            const record = value as Record<string, unknown>;
            if (record.nodeType === 'Failure Message' && typeof record.name === 'string') {
              failureMessages.push(record.name);
            }
            Object.values(record).forEach(visit);
          }
        };
        visit(result.testNodes);
        if (failureMessages.length > 0) {
          throw new Error(failureMessages.join('\n'));
        }
      } catch (details) {
        if (details instanceof Error && details.message !== error.message) {
          throw new Error(`${error.message}\n${details.message}`, { cause: error });
        }
      }
    }
    throw error;
  } finally {
    if (temporaryDirectory) {
      await fs.rm(temporaryDirectory, { recursive: true, force: true });
    }
    if (bootedByExplorer) {
      await execFileAsync('xcrun', ['simctl', 'shutdown', simulator!.udid]);
    }
    if (!succeeded) {
      console.error('iOS Auto Explorer did not complete; see the error above.');
    }
  }
}
