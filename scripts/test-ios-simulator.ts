import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { captureDeviceScreenshot, listAllDevices } from '../lib/devices.js';
import { compositeFrame } from '../lib/sharp.js';
import { parsePngMetadata } from '../utils/png.js';

const execFileAsync = promisify(execFile);

interface Simulator {
  udid?: string;
  name?: string;
  state?: string;
  isAvailable?: boolean;
  deviceTypeIdentifier?: string;
}

interface SimulatorList {
  devices?: Record<string, Simulator[]>;
}

function isIPhone(simulator: Simulator): boolean {
  return simulator.deviceTypeIdentifier?.includes('.iPhone-') ?? simulator.name?.includes('iPhone') ?? false;
}

async function main(): Promise<void> {
  if (process.platform !== 'darwin') {
    throw new Error('The iOS simulator smoke test requires macOS and Xcode Command Line Tools.');
  }

  await execFileAsync('xcrun', ['simctl', 'help']);
  const { stdout } = await execFileAsync('xcrun', ['simctl', 'list', 'devices', 'available', '--json']);
  const parsed = JSON.parse(stdout) as SimulatorList;
  const simulators = Object.values(parsed.devices ?? {})
    .flat()
    .filter((simulator) => simulator.udid && simulator.isAvailable !== false);
  const simulator =
    simulators.find((candidate) => candidate.state === 'Booted' && isIPhone(candidate)) ??
    simulators.find(isIPhone) ??
    simulators.find((candidate) => candidate.state === 'Booted') ??
    simulators[0];

  if (!simulator?.udid) {
    throw new Error('No available iOS simulator was found on this Mac.');
  }

  let bootedByTest = false;
  try {
    if (simulator.state !== 'Booted') {
      await execFileAsync('xcrun', ['simctl', 'boot', simulator.udid]);
      bootedByTest = true;
      await execFileAsync('xcrun', ['simctl', 'bootstatus', simulator.udid, '-b'], {
        timeout: 240_000,
        maxBuffer: 10 * 1024 * 1024,
      });
    }

    const device = (await listAllDevices()).find(
      (candidate) => candidate.platform === 'ios' && candidate.id === simulator.udid
    );
    if (!device) {
      throw new Error(`The project did not discover booted simulator ${simulator.name ?? simulator.udid}.`);
    }

    const screenshot = await captureDeviceScreenshot(device.id);
    const screenshotMetadata = parsePngMetadata(screenshot);
    if (!screenshotMetadata.isValid || screenshotMetadata.width === 0 || screenshotMetadata.height === 0) {
      throw new Error('The iOS simulator screenshot was not a valid PNG.');
    }

    const framedImage = await compositeFrame({
      screenshotBuffer: screenshot,
      bezelId: 'iphone-16-pro',
      gradientPreset: 'aurora',
      title: 'iOS Simulator CI',
      subtitle: 'Screenshot capture and framing',
    });
    const framedMetadata = parsePngMetadata(framedImage.buffer);
    if (!framedMetadata.isValid || framedImage.width !== 1290 || framedImage.height !== 2796) {
      throw new Error('The iOS screenshot could not be rendered as a valid framed store image.');
    }

    console.log(
      `iOS simulator smoke test passed: ${simulator.name ?? simulator.udid}, ` +
        `${screenshotMetadata.width}x${screenshotMetadata.height} screenshot, ` +
        `${framedImage.width}x${framedImage.height} framed PNG.`
    );
  } finally {
    if (bootedByTest) {
      await execFileAsync('xcrun', ['simctl', 'shutdown', simulator.udid]);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
