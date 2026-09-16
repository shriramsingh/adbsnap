import { androidDriver } from '../lib/adb.js';
import { logger } from '../utils/logger.js';
import { MESSAGES } from '../constants/messages.js';

async function main() {
  logger.banner('ADBSnap — Wireless / OTA Bridge Test', 'Untethering from USB cables');

  try {
    const devices = await androidDriver.listDevices();
    const usbDevices = devices.filter((d) => d.type === 'usb' && d.isAuthorized);

    if (usbDevices.length > 0) {
      const target = usbDevices[0];
      logger.info(`Found USB device: ${target.model} (${target.id})`);
      logger.info(MESSAGES.WIFI_SWITCHING);

      const endpoint = await androidDriver.enableWireless(target.id);
      logger.success(MESSAGES.WIFI_SUCCESS(endpoint));

      // Refresh device list to verify wireless entry
      const updated = await androidDriver.listDevices();
      logger.info('Updated Connected Devices:');
      for (const dev of updated) {
        logger.device(dev.id, dev.model, dev.type);
      }
      logger.success('You can now safely unplug the USB cable and capture over Wi-Fi!');
    } else {
      logger.warn('No authorized USB Android device connected right now.');
      console.log('\n--- Wireless Bridge Instructions ---');
      logger.info('To switch an Android phone to Wireless Mode:');
      console.log('   1. Plug your phone into PC via USB cable once.');
      console.log('   2. Ensure phone is connected to the same Wi-Fi as this PC.');
      console.log('   3. Run: npx tsx scripts/test-wifi.ts (or: adbsnap wifi)');
      console.log('   4. Unplug the cable! Your phone will remain connected over Wi-Fi.\n');
      logger.info('For Android 11+ Native Wireless Pairing (Zero Cables Ever):');
      console.log('   Run: adbsnap pair <ip>:<pair_port> <6_digit_code>');
      console.log('-------------------------------------\n');
    }
  } catch (err) {
    logger.error('WIFI_CONNECT_FAILED', err instanceof Error ? err.message : String(err));
  }
}

main();
