import { STYLES } from '../constants/styles.js';
import { ERROR_MESSAGES, type ErrorCode } from '../constants/errors.js';

export const logger = {
  banner: (title: string, subtitle?: string) => {
    console.log('\n' + STYLES.banner(`  === ${title} ===`));
    if (subtitle) console.log(STYLES.dim(`  ${subtitle}`));
    console.log('');
  },
  info: (msg: string) => {
    console.log(STYLES.info(`ℹ  ${msg}`));
  },
  success: (msg: string) => {
    console.log(STYLES.success(`✔  ${msg}`));
  },
  warn: (msg: string) => {
    console.log(STYLES.warning(`⚠  ${msg}`));
  },
  error: (code: ErrorCode, detail?: string) => {
    const err = ERROR_MESSAGES[code];
    console.log('\n' + STYLES.error(`✖  Error [${code}]: ${err?.message || code}`));
    if (detail) console.log(STYLES.dim(`   Details: ${detail}`));
    if (err?.tip) console.log(STYLES.warning(`   💡 Tip: ${err.tip}\n`));
  },
  device: (id: string, model: string, type: 'usb' | 'wifi' | 'emulator') => {
    const badge = type === 'wifi' ? STYLES.badgeWifi() : type === 'emulator' ? STYLES.badgeEmulator() : STYLES.badgeUsb();
    console.log(`  ${badge} ${STYLES.bold(model)} ${STYLES.dim(`(${id})`)}`);
  },
};
