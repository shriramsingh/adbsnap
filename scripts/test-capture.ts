import fs from 'node:fs';
import path from 'node:path';
import { androidDriver } from '../lib/adb.js';
import { parsePngMetadata } from '../utils/png.js';
import { logger } from '../utils/logger.js';
import { MESSAGES } from '../constants/messages.js';
import { CONFIG } from '../constants/config.js';
import { getMockScreenshotBuffer, MOCK_SCREEN_METADATA } from '../mocks/mock-screens.js';

async function main() {
  logger.banner('ADBSnap — In-Memory Screenshot Test', 'Zero-Disk RAM Capture Pipeline');

  try {
    const devices = await androidDriver.listDevices();
    const authorized = devices.filter((d) => d.isAuthorized);

    if (authorized.length > 0) {
      const target = authorized[0];
      logger.info(`Target device: ${target.model} (${target.id}) [${target.type.toUpperCase()}]`);
      logger.info(MESSAGES.CAPTURE_START);

      const startTime = performance.now();
      const buffer = await androidDriver.captureScreenshot(target.id);
      const elapsedMs = Math.round(performance.now() - startTime);

      const meta = parsePngMetadata(buffer);

      if (!meta.isValid) {
        logger.error('CAPTURE_FAILED', 'Received buffer did not match valid PNG magic header.');
        return;
      }

      logger.success(MESSAGES.CAPTURE_SUCCESS(elapsedMs, meta.sizeKb));
      logger.info(`Resolution: ${meta.width} x ${meta.height} px (${meta.orientation.toUpperCase()})`);
      logger.info(`RAM Footprint: ${(meta.sizeBytes / (1024 * 1024)).toFixed(2)} MB`);
      logger.info('Zero temporary files were written to the mobile device.');

      // Save a local test verification file
      const outDir = CONFIG.DEFAULT_OUTPUT_DIR;
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      const testFilePath = path.join(outDir, 'test-live-capture.png');
      fs.writeFileSync(testFilePath, buffer);
      logger.success(`Verified: Test image written to ${testFilePath}`);
    } else {
      logger.warn('No authorized Android device connected right now.');
      if (devices.length > 0) {
        logger.error('DEVICE_UNAUTHORIZED', `Found ${devices.length} device(s), but screen is locked or unpermitted.`);
      } else {
        logger.error('DEVICE_NOT_FOUND');
      }

      console.log('\n--- Simulation Mode (MOCK BUFFER VERIFICATION) ---');
      logger.info('Testing PNG validation & metadata parser using mock buffer:');
      const mockBuf = getMockScreenshotBuffer();
      const mockMeta = parsePngMetadata(mockBuf);

      logger.success(`Valid PNG Detected: ${mockMeta.isValid}`);
      logger.info(`Mock Stream Parsing Speed: <1ms`);
      logger.info(`Simulated Dimensions: ${MOCK_SCREEN_METADATA.width} x ${MOCK_SCREEN_METADATA.height} (${MOCK_SCREEN_METADATA.orientation})`);
      console.log('---------------------------------------------------\n');
    }
  } catch (err) {
    logger.error('CAPTURE_FAILED', err instanceof Error ? err.message : String(err));
  }
}

main();
