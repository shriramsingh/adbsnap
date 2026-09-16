import chalk from 'chalk';

export const STYLES = {
  banner: (text: string) => chalk.bold.cyan(text),
  success: (text: string) => chalk.bold.green(text),
  warning: (text: string) => chalk.bold.yellow(text),
  error: (text: string) => chalk.bold.red(text),
  info: (text: string) => chalk.cyan(text),
  dim: (text: string) => chalk.dim(text),
  bold: (text: string) => chalk.bold(text),
  badgeUsb: () => chalk.bgBlue.white.bold(' USB 🔌 '),
  badgeWifi: () => chalk.bgGreen.black.bold(' WI-FI 📶 '),
  badgeEmulator: () => chalk.bgMagenta.white.bold(' EMULATOR 💻 '),
};
