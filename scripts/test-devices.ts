import { androidDriver } from '../lib/adb.js';
import { logger } from '../utils/logger.js';
import { MESSAGES } from '../constants/messages.js';
import { ERROR_CODES } from '../constants/errors.js';
import { MOCK_DEVICES } from '../mocks/mock-devices.js';

async function main() {
  logger.banner('ADBSnap — Device Discovery Test', 'Verifying AndroidDriver & ADB Bridge');
  logger.info(MESSAGES.SCANNING_DEVICES);

  try {
    const devices = await androidDriver.listDevices();

    if (devices.length === 0) {
      logger.warn('No physical Android devices or running emulators detected right now.');
      logger.error('DEVICE_NOT_FOUND');
      
      console.log('\n--- Simulation Mode (MOCK FIXTURES) ---');
      logger.info('Here is how ADBSnap parses and displays devices when attached:');
      for (const dev of MOCK_DEVICES) {
        logger.device(dev.id, dev.model, dev.type);
        if (!dev.isAuthorized) {
          logger.warn(`   └─ Status: ${dev.rawStatus.toUpperCase()} (Needs screen unlock & permission)`);
        }
      }
      console.log('----------------------------------------\n');
    } else {
      logger.success(`Found ${devices.length} connected device(s):`);
      for (const dev of devices) {
        logger.device(dev.id, dev.model, dev.type);
        if (!dev.isAuthorized) {
          logger.warn(`   └─ Status: ${dev.rawStatus.toUpperCase()}`);
          logger.error('DEVICE_UNAUTHORIZED');
        } else {
          logger.info(`   └─ Status: READY (Product: ${dev.product})`);
        }
      }
    }
  } catch (err) {
    logger.error('ADB_NOT_FOUND', err instanceof Error ? err.message : String(err));
  }
}

main();
