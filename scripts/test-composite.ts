import fs from 'node:fs';
import path from 'node:path';
import { androidDriver } from '../lib/adb.js';
import { compositeFrame } from '../lib/sharp.js';
import { parsePngMetadata } from '../utils/png.js';
import { logger } from '../utils/logger.js';
import { MESSAGES } from '../constants/messages.js';
import { CONFIG } from '../constants/config.js';
import { getMockScreenshotBuffer } from '../mocks/mock-screens.js';

async function main() {
  logger.banner('ADBSnap — Sharp Compositing Test', 'Vector Chassis, Gradient & Typography Assembly');

  let screenshotBuffer: Buffer | null = null;
  let sourceDescription = '';

  try {
    const devices = await androidDriver.listDevices();
    const authorized = devices.filter((d) => d.isAuthorized);

    if (authorized.length > 0) {
      const target = authorized[0];
      logger.info(`Capturing live screen directly from ${target.model} (${target.id})...`);
      screenshotBuffer = await androidDriver.captureScreenshot(target.id);
      sourceDescription = `Live Hardware Capture (${target.model})`;
    } else {
      const cachedLivePath = path.join(CONFIG.DEFAULT_OUTPUT_DIR, 'test-live-capture.png');
      if (fs.existsSync(cachedLivePath)) {
        logger.info(`Using existing capture from ${cachedLivePath}`);
        screenshotBuffer = fs.readFileSync(cachedLivePath);
        sourceDescription = 'Disk Cache (test-live-capture.png)';
      } else {
        logger.warn('No device or cached file found. Using mock buffer.');
        screenshotBuffer = getMockScreenshotBuffer();
        sourceDescription = 'Synthetic Mock Buffer';
      }
    }

    const inputMeta = parsePngMetadata(screenshotBuffer);
    logger.info(`Input Source: ${sourceDescription}`);
    logger.info(`Input Resolution: ${inputMeta.width} x ${inputMeta.height} px`);

    logger.info(MESSAGES.COMPOSITE_START);
    const result = await compositeFrame({
      screenshotBuffer,
      bezelId: 'iphone-16-pro',
      gradientPreset: 'aurora',
      title: 'Everything You Need',
      subtitle: 'Automated App Store graphics directly from ADB',
      showStarBadge: true,
      typographyPosition: 'top',
    });

    logger.success(MESSAGES.COMPOSITE_SUCCESS(result.elapsedMs, result.width, result.height));

    const outDir = CONFIG.DEFAULT_OUTPUT_DIR;
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outputPath = path.join(outDir, 'test-framed-showcase.png');
    fs.writeFileSync(outputPath, result.buffer);

    const outputMeta = parsePngMetadata(result.buffer);
    logger.success(`Verified: Framed showcase saved to ${outputPath}`);
    logger.info(`Output Canvas: ${outputMeta.width} x ${outputMeta.height} px (${outputMeta.sizeKb} KB)`);
    logger.info(`Render Speed: ${result.elapsedMs}ms in RAM (Zero-Disk pipeline)`);
  } catch (err) {
    logger.error('COMPOSITE_FAILED', err instanceof Error ? err.message : String(err));
  }
}

main();
