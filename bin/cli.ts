#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { parseArgs } from 'node:util';
import { androidDriver } from '../lib/adb';
import { compositeFrame, exportMultiStore } from '../lib/sharp';
import { saveStoreZip, type ZipFileInput } from '../lib/zip';
import { uiCrawler } from '../lib/crawler';
import { flowRunner, type FlowConfig } from '../lib/runner';
import { logger } from '../utils/logger';
import { STYLES } from '../constants/styles';
import { MESSAGES } from '../constants/messages';
import { APP_INFO, CLI_HELP } from '../constants/strings';
import { CONFIG } from '../constants/config';
import { BEZEL_PRESETS, GRADIENT_PRESETS, LAYOUT_PRESETS, type LayoutMode } from '../constants/themes';

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      frame: { type: 'string', default: 'iphone-16-pro' },
      theme: { type: 'string', default: 'aurora' },
      layout: { type: 'string', default: 'appstore' },
      font: { type: 'string', default: 'modern' },
      fit: { type: 'string', default: 'cover' },
      store: { type: 'string', default: 'all' },
      title: { type: 'string' },
      subtitle: { type: 'string' },
      stars: { type: 'boolean', default: false },
      zip: { type: 'boolean', default: false },
      auto: { type: 'boolean', default: false },
      config: { type: 'string' },
      device: { type: 'string' },
      out: { type: 'string' },
      port: { type: 'string', default: '3000' },
      browser: { type: 'boolean', default: false },
      'no-open': { type: 'boolean', default: false },
      raw: { type: 'boolean', default: false },
      off: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', short: 'v', default: false },
    },
  });

  if (values.version) {
    console.log(`${APP_INFO.NAME} v${APP_INFO.VERSION}`);
    return;
  }

  if (values.help || positionals[0] === 'help') {
    console.log(CLI_HELP);
    return;
  }

  const command = positionals[0] || 'snap';

  switch (command) {
    case 'devices':
      await handleDevices();
      break;
    case 'doctor':
      await handleDoctor();
      break;
    case 'wifi':
      await handleWifi(positionals[1], values);
      break;
    case 'usb':
      await handleWifi('off', values);
      break;
    case 'snap':
      await handleSnap(values);
      break;
    case 'export':
      await handleExport(values);
      break;
    case 'journey':
      await handleJourney(values);
      break;
    case 'explore':
      await handleExplore(positionals[1], values);
      break;
    case 'crawl':
      await handleCrawl(positionals[1], values);
      break;
    case 'run':
      await handleRun(positionals[1], values);
      break;
    case 'studio':
      await handleStudio(values);
      break;
    default:
      logger.error('INVALID_COMMAND', `Unknown command "${command}". Run "adbsnap help" for guide.`);
      console.log(CLI_HELP);
      process.exit(1);
  }
}

async function handleDevices() {
  logger.banner(APP_INFO.NAME, 'Connected Device Discovery');
  logger.info(MESSAGES.SCANNING_DEVICES);

  const devices = await androidDriver.listDevices();
  if (devices.length === 0) {
    logger.warn(MESSAGES.NO_DEVICES_FOUND);
    return;
  }

  logger.success(`Found ${devices.length} connected device(s):\n`);

  for (const d of devices) {
    let badge = STYLES.badgeUsb();
    if (d.type === 'wifi') badge = STYLES.badgeWifi();
    if (d.type === 'emulator') badge = STYLES.badgeEmulator();

    const authStatus = d.isAuthorized
      ? STYLES.success('READY')
      : STYLES.error('UNAUTHORIZED');

    console.log(`  ${badge} ${STYLES.bold(d.model)} (${STYLES.dim(d.id)})`);
    console.log(`     └─ Status: ${authStatus} | Product: ${d.product || 'generic'}\n`);
  }
}

async function handleDoctor() {
  logger.banner(APP_INFO.NAME, 'Environment Diagnostics & Device Health');
  const { resolveAdbPath } = await import('../lib/adb');
  const adbBin = resolveAdbPath();

  console.log(`  • Node.js Version : ${STYLES.bold(process.version)} (Target: v18+)`);
  console.log(`  • Operating System: ${STYLES.bold(process.platform)} (${process.arch})`);
  console.log(`  • ADB Executable  : ${STYLES.bold(adbBin)}`);

  try {
    const devices = await androidDriver.listDevices();
    if (devices.length === 0) {
      console.log('');
      logger.warn('No Android devices or emulators connected right now.');
      logger.info('💡 Connect your phone via USB with USB Debugging enabled, or run: adbsnap wifi <ip>');
    } else {
      console.log('');
      logger.success(`Detected ${devices.length} connected device(s):`);
      for (const d of devices) {
        let badge = STYLES.badgeUsb();
        if (d.type === 'wifi') badge = STYLES.badgeWifi();
        if (d.type === 'emulator') badge = STYLES.badgeEmulator();

        const status = d.isAuthorized
          ? STYLES.success('READY')
          : STYLES.error('UNAUTHORIZED (Check screen unlock prompt)');

        console.log(`     ${badge} ${STYLES.bold(d.model)} (${STYLES.dim(d.id)}) -> ${status}`);
      }
    }
  } catch (err) {
    logger.error('ADB_NOT_FOUND', err instanceof Error ? err.message : String(err));
  }
  console.log('');
}

async function handleWifi(actionOrIp?: string, values?: { off?: boolean }) {
  const isOff = actionOrIp === 'off' || actionOrIp === 'stop' || actionOrIp === 'disable' || values?.off;

  if (isOff) {
    logger.banner(APP_INFO.NAME, 'Wireless ADB — Revert to USB');
    logger.info('Disconnecting wireless sessions and resetting to USB mode...');
    try {
      if (androidDriver.disableWireless) {
        await androidDriver.disableWireless();
      }
      logger.success('Wireless mode disabled. Device connection reset to USB mode.');
    } catch (err) {
      logger.error('WIFI_CONNECT_FAILED', err instanceof Error ? err.message : String(err));
    }
    return;
  }

  logger.banner(APP_INFO.NAME, 'Wireless ADB Setup');

  const devices = await androidDriver.listDevices();
  const ready = devices.filter((d) => d.isAuthorized);

  if (ready.length === 0) {
    logger.error('DEVICE_NOT_FOUND', 'Connect your Android device via USB first to enable wireless mode.');
    return;
  }

  const target = ready[0];
  logger.info(MESSAGES.WIFI_SWITCHING);

  try {
    const ip = await androidDriver.enableWireless(target.id, CONFIG.DEFAULT_PORT);
    logger.success(MESSAGES.WIFI_SUCCESS(actionOrIp || ip));
  } catch (err) {
    logger.error('WIFI_CONNECT_FAILED', err instanceof Error ? err.message : String(err));
  }
}

async function handleSnap(options: {
  frame?: string;
  theme?: string;
  layout?: string;
  font?: string;
  fit?: string;
  title?: string;
  subtitle?: string;
  stars?: boolean;
  device?: string;
  out?: string;
  raw?: boolean;
}) {
  logger.banner(APP_INFO.NAME, 'Automated Mobile Capture & Showcase');

  const devices = await androidDriver.listDevices();
  const ready = devices.filter((d) => d.isAuthorized);

  if (ready.length === 0) {
    logger.error('DEVICE_NOT_FOUND', MESSAGES.NO_DEVICES_FOUND);
    return;
  }

  const targetDevice = options.device
    ? ready.find((d) => d.id === options.device) || ready[0]
    : ready[0];

  logger.info(`Target: ${STYLES.bold(targetDevice.model)} (${targetDevice.id}) [${targetDevice.type.toUpperCase()}]`);
  logger.info(MESSAGES.CAPTURE_START);

  const captureStart = performance.now();
  const rawBuffer = await androidDriver.captureScreenshot(targetDevice.id);
  const captureMs = Math.round(performance.now() - captureStart);
  logger.success(`Screen captured in ${captureMs}ms (RAM stream)`);

  const outDir = CONFIG.DEFAULT_OUTPUT_DIR;
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // If --raw flag passed, output clean screenshot only
  if (options.raw) {
    const rawPath = options.out || path.join(outDir, `raw-${timestamp}.png`);
    fs.writeFileSync(rawPath, rawBuffer);
    logger.success(MESSAGES.RAW_SAVED(rawPath));
    return;
  }

  // Otherwise, run through 4K framing pipeline
  const frame = options.frame || 'iphone-16-pro';
  const theme = options.theme || 'aurora';
  const layout = (options.layout as LayoutMode) || 'appstore';
  const font = options.font || 'modern';
  const fit = (options.fit as 'cover' | 'contain' | 'fill') || 'cover';

  if (!BEZEL_PRESETS[frame]) {
    logger.warn(`Unknown frame "${frame}", falling back to "iphone-16-pro". Available: ${Object.keys(BEZEL_PRESETS).join(', ')}`);
  }
  if (!GRADIENT_PRESETS[theme]) {
    logger.warn(`Unknown theme "${theme}", falling back to "aurora". Available: ${Object.keys(GRADIENT_PRESETS).join(', ')}`);
  }
  if (!LAYOUT_PRESETS[layout]) {
    logger.warn(`Unknown layout "${layout}", falling back to "appstore". Available: ${Object.keys(LAYOUT_PRESETS).join(', ')}`);
  }

  logger.info(MESSAGES.COMPOSITE_START);
  const result = await compositeFrame({
    screenshotBuffer: rawBuffer,
    bezelId: frame,
    gradientPreset: theme,
    layout,
    font,
    fit,
    title: options.title,
    subtitle: options.subtitle,
    showStarBadge: options.stars,
    typographyPosition: 'top',
  });

  logger.success(MESSAGES.COMPOSITE_SUCCESS(result.elapsedMs, result.width, result.height));

  const finalPath = options.out || path.join(outDir, `snap-${theme}-${timestamp}.png`);
  fs.writeFileSync(finalPath, result.buffer);

  console.log('\n' + '─'.repeat(50));
  logger.success(`Showcase Asset Ready: ${STYLES.bold(finalPath)}`);
  logger.info(`Specs: ${result.width}x${result.height} px | Frame: ${frame} | Theme: ${theme} | Layout: ${layout} | Fit: ${fit} | Font: ${font}`);
  console.log('─'.repeat(50) + '\n');
}

async function handleExport(options: {
  frame?: string;
  theme?: string;
  layout?: string;
  font?: string;
  store?: string;
  title?: string;
  subtitle?: string;
  stars?: boolean;
  zip?: boolean;
  config?: string;
  device?: string;
  out?: string;
}) {
  logger.banner(APP_INFO.NAME, 'Multi-Store Auto-Export (App Store & Google Play)');

  // Load config if provided
  let frame = options.frame || 'iphone-16-pro';
  let theme = options.theme || 'aurora';
  let layout = (options.layout as LayoutMode) || 'appstore';
  let font = options.font || 'modern';
  let title = options.title;
  let subtitle = options.subtitle;
  let stars = options.stars ?? false;

  if (options.config && fs.existsSync(options.config)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(options.config, 'utf8'));
      if (cfg.theme) theme = cfg.theme;
      if (cfg.frame) frame = cfg.frame;
      if (cfg.layout) layout = cfg.layout;
      if (cfg.font) font = cfg.font;
      if (cfg.stars !== undefined) stars = cfg.stars;
      if (cfg.screens && cfg.screens[0]) {
        if (!title) title = cfg.screens[0].title;
        if (!subtitle) subtitle = cfg.screens[0].subtitle;
      }
      logger.info(`Loaded configuration from: ${options.config}`);
    } catch (err) {
      logger.warn(`Failed to parse config file: ${options.config}`);
    }
  }

  const devices = await androidDriver.listDevices();
  const ready = devices.filter((d) => d.isAuthorized);

  if (ready.length === 0) {
    logger.error('DEVICE_NOT_FOUND', MESSAGES.NO_DEVICES_FOUND);
    return;
  }

  const targetDevice = options.device
    ? ready.find((d) => d.id === options.device) || ready[0]
    : ready[0];

  logger.info(`Target: ${STYLES.bold(targetDevice.model)} (${targetDevice.id})`);
  logger.info(MESSAGES.CAPTURE_START);

  const captureStart = performance.now();
  const rawBuffer = await androidDriver.captureScreenshot(targetDevice.id);
  const captureMs = Math.round(performance.now() - captureStart);
  logger.success(`Screen captured in ${captureMs}ms (RAM stream)`);

  const storeFilter = (options.store as 'apple' | 'google' | 'all') || 'all';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const baseOutDir = options.out || path.join(CONFIG.DEFAULT_OUTPUT_DIR, `export-${theme}-${timestamp}`);

  logger.info(MESSAGES.EXPORT_START(storeFilter === 'all' ? 4 : storeFilter === 'apple' ? 3 : 1));

  const exportStart = performance.now();
  const results = await exportMultiStore({
    screenshotBuffer: rawBuffer,
    bezelId: frame,
    gradientPreset: theme,
    layout,
    font,
    title,
    subtitle,
    showStarBadge: stars,
    typographyPosition: 'top',
    storeFilter,
  });
  const totalExportMs = Math.round(performance.now() - exportStart);

  const zipFiles: ZipFileInput[] = [];

  console.log('\n' + '─'.repeat(60));
  for (const item of results) {
    const relFile = path.join(item.target.folder, 'showcase.png');
    const targetFile = path.join(baseOutDir, relFile);
    const folderDir = path.dirname(targetFile);
    if (!fs.existsSync(folderDir)) {
      fs.mkdirSync(folderDir, { recursive: true });
    }
    fs.writeFileSync(targetFile, item.buffer);
    zipFiles.push({ path: relFile, buffer: item.buffer });

    logger.success(`${item.target.name}`);
    console.log(`   └─ Size: ${item.width}x${item.height} px | Saved: ${STYLES.dim(targetFile)} (${item.elapsedMs}ms)`);
  }
  console.log('─'.repeat(60));

  if (options.zip) {
    const zipPath = path.join(baseOutDir, 'adbsnap-store-assets.zip');
    const zipBytes = await saveStoreZip(zipFiles, zipPath);
    logger.success(`ZIP Archive Created: ${STYLES.bold(zipPath)} (${(zipBytes / 1024).toFixed(1)} KB)`);
  }

  logger.success(MESSAGES.EXPORT_COMPLETE(results.length, totalExportMs));
  logger.info(`Output Folder: ${STYLES.bold(baseOutDir)}\n`);
}

async function handleJourney(options: {
  frame?: string;
  theme?: string;
  layout?: string;
  font?: string;
  stars?: boolean;
  zip?: boolean;
  auto?: boolean;
  config?: string;
  device?: string;
  out?: string;
}) {
  logger.banner(APP_INFO.NAME, 'Interactive Multi-Screen Journey Wizard');

  const devices = await androidDriver.listDevices();
  const ready = devices.filter((d) => d.isAuthorized);

  if (ready.length === 0) {
    logger.error('DEVICE_NOT_FOUND', MESSAGES.NO_DEVICES_FOUND);
    return;
  }

  const targetDevice = options.device
    ? ready.find((d) => d.id === options.device) || ready[0]
    : ready[0];

  logger.info(`Device Connected: ${STYLES.bold(targetDevice.model)} (${targetDevice.id})`);

  let screensToCapture: Array<{ name: string; title: string; subtitle?: string }> = [];
  const configPath = options.config || (fs.existsSync('adbsnap.config.json') ? 'adbsnap.config.json' : undefined);

  if (configPath && fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.screens && Array.isArray(cfg.screens)) {
        screensToCapture = cfg.screens;
        logger.info(`Loaded ${screensToCapture.length} screens from config: ${configPath}`);
      }
    } catch (e) {
      logger.warn(`Could not parse config file ${configPath}, using manual mode.`);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const theme = options.theme || 'studioLight';
  const frame = options.frame || 'iphone-16-pro';
  const layout = (options.layout as LayoutMode) || 'appstore';
  const font = options.font || 'modern';
  const journeyDir = options.out || path.join(CONFIG.DEFAULT_OUTPUT_DIR, `journey-${theme}-${timestamp}`);

  if (!fs.existsSync(journeyDir)) {
    fs.mkdirSync(journeyDir, { recursive: true });
  }

  const zipFiles: ZipFileInput[] = [];
  const rl = readline.createInterface({ input, output });

  try {
    if (screensToCapture.length > 0) {
      for (let i = 0; i < screensToCapture.length; i++) {
        const item = screensToCapture[i];
        console.log(`\n${STYLES.bold(`[Step ${i + 1}/${screensToCapture.length}]`)} Target Screen: ${STYLES.info(item.title)}`);

        if (options.auto) {
          logger.info(`Auto mode: capturing in 1s...`);
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          try {
            await rl.question(`Press ${STYLES.bold('[ENTER]')} when ready to capture... `);
          } catch {
            // Proceed gracefully on EOF
          }
        }

        logger.info(`Capturing screen...`);
        const rawBuffer = await androidDriver.captureScreenshot(targetDevice.id);


        const result = await compositeFrame({
          screenshotBuffer: rawBuffer,
          bezelId: frame,
          gradientPreset: theme,
          layout,
          font,
          title: item.title,
          subtitle: item.subtitle,
          showStarBadge: options.stars ?? true,
          typographyPosition: 'top',
        });

        const fileName = `${String(i + 1).padStart(2, '0')}-${item.name || 'screen'}.png`;
        const filePath = path.join(journeyDir, fileName);
        fs.writeFileSync(filePath, result.buffer);
        zipFiles.push({ path: fileName, buffer: result.buffer });

        logger.success(`Saved: ${fileName} (${result.elapsedMs}ms)`);
      }
    } else {
      let step = 1;
      let continuing = true;

      while (continuing) {
        console.log(`\n${STYLES.bold(`[Screen ${step}]`)} Open screen #${step} on your phone.`);
        await rl.question(`Press ${STYLES.bold('[ENTER]')} to capture screen... `);

        logger.info(`Capturing screen...`);
        const rawBuffer = await androidDriver.captureScreenshot(targetDevice.id);

        const title = (await rl.question(`Enter headline for this screen (or press [Enter] to skip): `)).trim();
        const subtitle = title
          ? (await rl.question(`Enter subtitle (or press [Enter] to skip): `)).trim()
          : '';

        const result = await compositeFrame({
          screenshotBuffer: rawBuffer,
          bezelId: frame,
          gradientPreset: theme,
          layout,
          font,
          title: title || undefined,
          subtitle: subtitle || undefined,
          showStarBadge: options.stars ?? true,
          typographyPosition: 'top',
        });

        const fileName = `${String(step).padStart(2, '0')}-showcase.png`;
        const filePath = path.join(journeyDir, fileName);
        fs.writeFileSync(filePath, result.buffer);
        zipFiles.push({ path: fileName, buffer: result.buffer });

        logger.success(`Saved screen #${step}: ${fileName}`);

        const more = (await rl.question(`\nCapture another screen? (y/n, default: y): `)).trim().toLowerCase();
        if (more === 'n' || more === 'no') {
          continuing = false;
        } else {
          step++;
        }
      }
    }

    if (options.zip !== false && zipFiles.length > 0) {
      const zipPath = path.join(journeyDir, `journey-assets.zip`);
      const zipBytes = await saveStoreZip(zipFiles, zipPath);
      logger.success(`\nZIP Bundle Created: ${STYLES.bold(zipPath)} (${(zipBytes / 1024).toFixed(1)} KB)`);
    }

    console.log('\n' + '═'.repeat(60));
    logger.success(`Journey Complete! All marketing assets saved to:`);
    logger.info(`${STYLES.bold(journeyDir)}`);
    console.log('═'.repeat(60) + '\n');
  } finally {
    rl.close();
  }
}

async function handleExplore(targetPackage?: string, options: Record<string, unknown> = {}) {
  return handleCrawl(targetPackage, options);
}

async function handleCrawl(targetPackage?: string, options: Record<string, unknown> = {}) {
  logger.banner(APP_INFO.NAME, 'Autonomous Bottom-Tab Crawler');

  const devices = await androidDriver.listDevices();
  const ready = devices.filter((d) => d.isAuthorized);
  if (ready.length === 0) {
    logger.error('DEVICE_NOT_FOUND', MESSAGES.NO_DEVICES_FOUND);
    return;
  }
  const targetDevice = options.device
    ? ready.find((d) => d.id === options.device) || ready[0]
    : ready[0];

  logger.info(`Target Device: ${STYLES.bold(targetDevice.model)} (${targetDevice.id})`);

  if (targetPackage) {
    logger.info(`Launching target application: ${STYLES.bold(targetPackage)}...`);
    await androidDriver.launchApp(targetPackage, targetDevice.id);
    await new Promise((r) => setTimeout(r, 1500));
  } else {
    const active = await androidDriver.getForegroundApp(targetDevice.id);
    logger.info(`Active App on Screen: ${STYLES.bold(active || 'unknown')}`);
  }

  logger.info('Scanning active screen for bottom navigation tab bar...');
  const start = performance.now();

  const theme = (options.theme as string) || 'studioLight';
  const frame = (options.frame as string) || 'iphone-16-pro';
  const layout = ((options.layout as string) as LayoutMode) || 'appstore';
  const font = (options.font as string) || 'modern';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const crawlDir = (options.out as string) || path.join(CONFIG.DEFAULT_OUTPUT_DIR, `crawl-${theme}-${timestamp}`);

  if (!fs.existsSync(crawlDir)) {
    fs.mkdirSync(crawlDir, { recursive: true });
  }

  const zipFiles: ZipFileInput[] = [];

  try {
    const crawledTabs = await uiCrawler.crawlTabs(targetDevice.id, (tab, index, total) => {
      console.log(`\n${STYLES.bold(`[Tab ${index + 1}/${total}]`)} Navigating to: ${STYLES.info(tab.title)} (Center: ${tab.bounds.centerX}, ${tab.bounds.centerY})`);
    });

    logger.success(`\nDiscovered and captured ${crawledTabs.length} tabs hands-free in ${Math.round(performance.now() - start)}ms!\n`);

    for (let i = 0; i < crawledTabs.length; i++) {
      const tab = crawledTabs[i];
      logger.info(`Compositing Tab [${i + 1}/${crawledTabs.length}]: "${tab.title}"...`);

      const result = await compositeFrame({
        screenshotBuffer: tab.screenshotBuffer,
        bezelId: frame,
        gradientPreset: theme,
        layout,
        font,
        title: tab.title,
        subtitle: `Automated view captured from ${targetPackage || 'active app'}`,
        showStarBadge: options.stars !== false,
      });

      const fileName = `${String(i + 1).padStart(2, '0')}-${tab.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      const filePath = path.join(crawlDir, fileName);
      fs.writeFileSync(filePath, result.buffer);
      zipFiles.push({ path: fileName, buffer: result.buffer });

      logger.success(`Saved: ${fileName} (${result.elapsedMs}ms)`);
    }

    if (options.zip !== false && zipFiles.length > 0) {
      const zipPath = path.join(crawlDir, `crawled-assets.zip`);
      const zipBytes = await saveStoreZip(zipFiles, zipPath);
      logger.success(`\nZIP Bundle Created: ${STYLES.bold(zipPath)} (${(zipBytes / 1024).toFixed(1)} KB)`);
    }

    console.log('\n' + '═'.repeat(60));
    logger.success(`Autonomous Crawl Complete! All assets saved to:`);
    logger.info(`${STYLES.bold(crawlDir)}`);
    console.log('═'.repeat(60) + '\n');
  } catch (err) {
    logger.error('CRITICAL_ERROR', `Autonomous crawl failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function handleRun(customConfig?: string, options: Record<string, unknown> = {}) {
  logger.banner(APP_INFO.NAME, 'Declarative Automation Flow Runner');

  const configPath = customConfig || (options.config as string) || 'adbsnap.config.json';
  if (!fs.existsSync(configPath)) {
    logger.error('CRITICAL_ERROR', `Configuration file not found: ${configPath}`);
    return;
  }

  let config: FlowConfig;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    logger.error('CRITICAL_ERROR', `Failed to parse config ${configPath}: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  if (!config.flow || !Array.isArray(config.flow) || config.flow.length === 0) {
    logger.error('CRITICAL_ERROR', `Config file does not contain a "flow" action array.`);
    return;
  }

  const devices = await androidDriver.listDevices();
  const ready = devices.filter((d) => d.isAuthorized);
  if (ready.length === 0) {
    logger.error('DEVICE_NOT_FOUND', MESSAGES.NO_DEVICES_FOUND);
    return;
  }
  const targetDevice = options.device
    ? ready.find((d) => d.id === options.device) || ready[0]
    : ready[0];

  logger.info(`Target Device: ${STYLES.bold(targetDevice.model)} (${targetDevice.id})`);
  logger.info(`Loaded flow with ${config.flow.length} actions from: ${configPath}\n`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const theme = config.theme || (options.theme as string) || 'studioLight';
  const flowDir = (options.out as string) || path.join(CONFIG.DEFAULT_OUTPUT_DIR, `run-${theme}-${timestamp}`);

  if (!fs.existsSync(flowDir)) {
    fs.mkdirSync(flowDir, { recursive: true });
  }

  const zipFiles: ZipFileInput[] = [];
  const start = performance.now();

  try {
    const screens = await flowRunner.runFlow(config, {
      deviceId: targetDevice.id,
      onProgress: (step, total, action, msg) => {
        console.log(`${STYLES.bold(`[Step ${step}/${total}]`)} ${STYLES.dim(action.type.toUpperCase().padEnd(7))} ${msg}`);
      },
    });

    for (let i = 0; i < screens.length; i++) {
      const screen = screens[i];
      const fileName = `${String(i + 1).padStart(2, '0')}-${screen.name}.png`;
      const filePath = path.join(flowDir, fileName);
      fs.writeFileSync(filePath, screen.compositedBuffer);
      zipFiles.push({ path: fileName, buffer: screen.compositedBuffer });
    }

    if (options.zip !== false && zipFiles.length > 0) {
      const zipPath = path.join(flowDir, `run-assets.zip`);
      const zipBytes = await saveStoreZip(zipFiles, zipPath);
      logger.success(`\nZIP Bundle Created: ${STYLES.bold(zipPath)} (${(zipBytes / 1024).toFixed(1)} KB)`);
    }

    const elapsed = Math.round(performance.now() - start);
    console.log('\n' + '═'.repeat(60));
    logger.success(`Flow Execution Complete! ${screens.length} screens captured in ${elapsed}ms.`);
    logger.info(`Assets Directory: ${STYLES.bold(flowDir)}`);
    console.log('═'.repeat(60) + '\n');
  } catch (err) {
    logger.error('CRITICAL_ERROR', `Flow execution failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function getAppBrowserPath(): string | null {
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Edge\\Application\\msedge.exe'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
  } else if (process.platform === 'darwin') {
    const candidates = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Arc.app/Contents/MacOS/Arc',
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
  }
  return null;
}

async function launchStudioWindow(url: string, preferBrowser: boolean = false) {
  const { spawn, exec } = await import('node:child_process');

  if (preferBrowser) {
    if (process.platform === 'win32') {
      exec(`start "" "${url}"`);
    } else if (process.platform === 'darwin') {
      exec(`open "${url}"`);
    } else {
      exec(`xdg-open "${url}"`);
    }
    return;
  }

  const browserPath = getAppBrowserPath();
  if (browserPath) {
    // Launch directly in dedicated app window mode (frameless, no URL/address bar)
    spawn(browserPath, [
      `--app=${url}`,
      '--window-size=1440,920',
    ], {
      detached: true,
      stdio: 'ignore',
    }).unref();
  } else {
    // Fallback on platform shells
    if (process.platform === 'win32') {
      exec(`start msedge --app="${url}" || start chrome --app="${url}" || start "" "${url}"`);
    } else if (process.platform === 'darwin') {
      exec(`open -na "Google Chrome" --args --app="${url}" || open "${url}"`);
    } else {
      exec(`google-chrome --app="${url}" || chromium-browser --app="${url}" || xdg-open "${url}"`);
    }
  }
}

async function handleStudio(options: Record<string, unknown>) {
  const port = typeof options.port === 'string' ? options.port : '3000';
  const preferBrowser = Boolean(options.browser);
  const noOpen = Boolean(options['no-open']);

  // ── npx detection ────────────────────────────────────────────────────
  // When run via `npx adbsnap` (no local/global install), the binary lives
  // inside the npm _npx cache. Next.js dev compilation fails there because
  // the loader chain has path assumptions that break in the cache layout.
  // Require a real install instead and show a helpful message.
  const cliPath = process.argv[1] ?? '';
  const isRunningViaNpx =
    cliPath.includes(`${path.sep}_npx${path.sep}`) ||  // Windows / Linux
    cliPath.includes('/.npm/_npx/');                    // macOS

  if (isRunningViaNpx) {
    logger.warn(
      'ADBSnap Studio requires a persistent install.\n\n' +
      '  Install globally:\n' +
      '    npm install -g adbsnap\n' +
      '    adbsnap studio\n\n' +
      '  Or as a project dev-dependency:\n' +
      '    npm install -D adbsnap\n' +
      '    npx adbsnap studio'
    );
    process.exit(0);
  }
  // ─────────────────────────────────────────────────────────────────────

  logger.banner(APP_INFO.NAME, 'Visual Web Studio');
  logger.info(`Starting ADBSnap Studio on port ${port}...`);

  const { spawn } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');

  // Resolve root package directory whether executed from dist/ or bin/
  let packageRoot = process.cwd();
  try {
    const cliDir = path.dirname(fileURLToPath(import.meta.url));
    const candidate1 = path.resolve(cliDir, '..');
    const candidate2 = path.resolve(cliDir, '../..');
    if (fs.existsSync(path.join(candidate1, 'next.config.ts'))) {
      packageRoot = candidate1;
    } else if (fs.existsSync(path.join(candidate2, 'next.config.ts'))) {
      packageRoot = candidate2;
    }
  } catch {
    // Fallback to process.cwd()
  }

  const nextBinName = process.platform === 'win32' ? 'next.cmd' : 'next';
  const localNextBin1 = path.join(packageRoot, 'node_modules', '.bin', nextBinName);
  const localNextBin2 = path.resolve(packageRoot, '..', '.bin', nextBinName);

  let cmdExecutable: string;
  let cmdArgs: string[];

  if (fs.existsSync(localNextBin1)) {
    cmdExecutable = localNextBin1;
    cmdArgs = ['dev', '--webpack', '-p', port];
  } else if (fs.existsSync(localNextBin2)) {
    cmdExecutable = localNextBin2;
    cmdArgs = ['dev', '--webpack', '-p', port];
  } else {
    cmdExecutable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    cmdArgs = ['next', 'dev', '--webpack', '-p', port];
  }

  const child = spawn(cmdExecutable, cmdArgs, {
    stdio: 'inherit',
    cwd: packageRoot,
    shell: process.platform === 'win32',
    env: process.env,
  });

  child.on('error', (err) => {
    logger.error('CRITICAL_ERROR', `Failed to start Next.js studio: ${err.message}`);
  });

async function waitForServerReady(url: string, maxWaitMs = 45000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) {
        return true;
      }
    } catch {
      // Server still booting up, retry in 250ms
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

  if (!noOpen) {
    const url = `http://localhost:${port}`;
    logger.info(`✨ Waiting for server to become ready before launching ${preferBrowser ? 'browser' : 'App Window Mode'}...`);
    waitForServerReady(url).then((isReady) => {
      if (isReady) {
        logger.success(`🚀 Server active! Opening ${STYLES.info(url)}`);
        launchStudioWindow(url, preferBrowser);
      } else {
        logger.warn(`Server startup timed out. Open manually at ${url}`);
      }
    });
  }
}

main().catch((err) => {
  logger.error('CRITICAL_ERROR', err instanceof Error ? err.message : String(err));
  process.exit(1);
});


