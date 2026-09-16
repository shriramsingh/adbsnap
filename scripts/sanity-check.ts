import { APP_INFO } from '../constants/strings.js';
import { CONFIG } from '../constants/config.js';
import { MESSAGES } from '../constants/messages.js';
import { logger } from '../utils/logger.js';

logger.banner(APP_INFO.NAME, APP_INFO.TAGLINE);
logger.info(`Version: ${APP_INFO.VERSION}`);
logger.info(`Default Output: ${CONFIG.DEFAULT_OUTPUT_DIR}`);
logger.info(`Default Wireless Port: ${CONFIG.DEFAULT_PORT}`);

logger.info(MESSAGES.SCANNING_DEVICES);
logger.device('RFCW12345678', 'Google Pixel 9 Pro', 'usb');
logger.device('192.168.1.55:5555', 'Samsung Galaxy S24', 'wifi');
logger.device('emulator-5554', 'Medium Phone API 35', 'emulator');

logger.success('Architecture sanity check passed! All constants and logger operational.');
