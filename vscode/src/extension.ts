import * as vscode from 'vscode';
import path from 'node:path';
import fs from 'node:fs/promises';
import { androidDriver, resolveAdbPath } from '../../lib/adb';
import { listAllDevices } from '../../lib/devices';
import { copyImageBufferToClipboard } from './clipboard';
import { AdbStatusBarManager } from './statusBar';
import { runAdbSnapCli, getCliRunnerLabel } from './cli';
import { DevicesTreeDataProvider, DeviceTreeItem } from './views/devicesProvider';
import { CapturesTreeDataProvider, CaptureTreeItem } from './views/capturesProvider';
import { StudioWebviewManager } from './studio/studioWebview';
import type { ConnectedDevice } from '../../lib/driver';

let statusBarManager: AdbStatusBarManager;
let outputChannel: vscode.OutputChannel;
let devicesProvider: DevicesTreeDataProvider;
let capturesProvider: CapturesTreeDataProvider;

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('ADBSnap');
  statusBarManager = new AdbStatusBarManager();
  context.subscriptions.push(statusBarManager, outputChannel);

  // Apply custom ADB path configuration if specified
  const config = vscode.workspace.getConfiguration('adbsnap');
  const customAdb = config.get<string>('customAdbPath');
  if (customAdb && customAdb.trim().length > 0) {
    process.env.ADB_PATH = customAdb.trim();
  }

  // 1. Command: Framed Capture & Save
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.snap', async () => {
      await handleSnapCommand(context, { copyToClipboard: false });
    })
  );

  // 2. Command: Capture & Copy to Clipboard
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.snapClipboard', async () => {
      await handleSnapCommand(context, { copyToClipboard: true });
    })
  );

  // 3. Command: Capture Raw Screenshot
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.snapRaw', async () => {
      await handleSnapRawCommand(context);
    })
  );

  // 4. Command: Select Active Device
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.devices', async () => {
      await handleSelectDeviceCommand();
    })
  );

  // 5. Command: Switch to Wireless ADB (WiFi)
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.wifi', async () => {
      await handleWifiCommand();
    })
  );

  // 5b. Command: Turn Off Wi-Fi Mode (Revert to USB)
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.disconnectWifi', async (item?: any) => {
      await handleDisconnectWifiCommand(context, item);
    })
  );

  // 5c. Command: Connect via Wi-Fi IP
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.connectIp', async () => {
      await handleConnectIpCommand(context);
    })
  );

  // 5d. Command: Pair Android 11+ via Wireless Pairing Code
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.pairWifi', async () => {
      await handlePairWifiCommand(context);
    })
  );

  // 5e. Command: Reconnect Wireless Device
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.reconnectDevice', async (item?: any) => {
      await handleReconnectCommand(context, item);
    })
  );

  // 6. Command: Run ADB Doctor Diagnostics
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.doctor', async () => {
      await handleDoctorCommand(context);
    })
  );

  // 7. Command: Export Store Asset Pack (ZIP)
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.export', async () => {
      await handleExportCommand(context);
    })
  );

  // Tree View Data Providers (Phase 2)
  devicesProvider = new DevicesTreeDataProvider(statusBarManager);
  capturesProvider = new CapturesTreeDataProvider(() => resolveOutputDir());

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('adbsnap.devicesView', devicesProvider),
    vscode.window.registerTreeDataProvider('adbsnap.recentCapturesView', capturesProvider)
  );

  // 8. Command: Open Asset Studio Webview (Phase 2)
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.openStudio', () => {
      StudioWebviewManager.createOrShow(
        context,
        statusBarManager,
        resolveOutputDir,
        () => capturesProvider.refresh()
      );
    })
  );

  // 9. Command: Refresh Devices Tree
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.refreshDevices', async () => {
      await statusBarManager.refresh();
      devicesProvider.refresh();
    })
  );

  // 10. Command: Refresh Captures Tree
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.refreshCaptures', () => {
      capturesProvider.refresh();
    })
  );

  // 11. Command: Set Active Device from Tree Item
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.setActiveDeviceFromTree', (device: ConnectedDevice) => {
      if (device) {
        statusBarManager.setActiveDevice(device);
        devicesProvider.refresh();
      }
    })
  );

  // 12. Command: Snap specific device from Tree Item
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.snapDeviceFromTree', async (item: DeviceTreeItem) => {
      if (item && item.device) {
        statusBarManager.setActiveDevice(item.device);
        devicesProvider.refresh();
        await handleSnapCommand(context, { copyToClipboard: false });
      }
    })
  );

  // 13. Command: Reveal Capture file in OS Explorer
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.revealCapture', (item: CaptureTreeItem) => {
      if (item && item.filePath) {
        vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(item.filePath));
      }
    })
  );

  // 14. Command: Copy Capture to Clipboard
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.copyCapture', async (item: CaptureTreeItem) => {
      if (item && item.filePath) {
        try {
          const buf = await fs.readFile(item.filePath);
          await copyImageBufferToClipboard(buf);
          vscode.window.showInformationMessage(`📸 Copied ${item.fileName} to clipboard!`);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Failed to copy: ${err.message || err}`);
        }
      }
    })
  );

  // 15. Command: Delete Capture
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.deleteCapture', async (item: CaptureTreeItem) => {
      if (item && item.filePath) {
        const confirm = await vscode.window.showWarningMessage(
          `Delete "${item.fileName}"?`,
          { modal: true },
          'Delete'
        );
        if (confirm === 'Delete') {
          try {
            await fs.rm(item.filePath, { recursive: true, force: true });
            capturesProvider.refresh();
            vscode.window.showInformationMessage(`Deleted ${item.fileName}`);
          } catch (err: any) {
            vscode.window.showErrorMessage(`Failed to delete: ${err.message || err}`);
          }
        }
      }
    })
  );

  // 16. Command: Open Capture directly in Asset Studio
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.openCaptureInStudio', (_item?: CaptureTreeItem) => {
      StudioWebviewManager.createOrShow(
        context,
        statusBarManager,
        resolveOutputDir,
        () => capturesProvider.refresh()
      );
    })
  );

  // 17. Command: Capture and Insert into Markdown/Document
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.insertMarkdown', async () => {
      await handleInsertMarkdownCommand(context);
    })
  );

  // 18. Command: Select Default Bezel Frame
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.selectFrame', async () => {
      await handleSelectFrameCommand();
    })
  );

  // 19. Command: Select Default Theme
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.selectTheme', async () => {
      await handleSelectThemeCommand();
    })
  );

  // 20. Command: Select Default Format
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.selectFormat', async () => {
      await handleSelectFormatCommand();
    })
  );

  // 20b. Command: Select Default Aspect Ratio
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.selectAspectRatio', async () => {
      await handleSelectAspectRatioCommand();
    })
  );

  // 20c. Command: Toggle Android SystemUI Demo Mode
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.toggleDemoMode', async () => {
      await handleToggleDemoModeCommand(context);
    })
  );

  // 21. Command: Autonomous Android Tab Crawler
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.explore', async () => {
      await handleExploreCommand(context);
    })
  );

  // 22. Command: Autonomous iOS UI Explorer (XCTest)
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.exploreIos', async () => {
      await handleExploreIosCommand(context);
    })
  );

  // 23. Command: Reset App Data (Logout / Clear Cache)
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.resetAppData', async () => {
      await handleResetAppDataCommand(context);
    })
  );

  // 24. Command: Relaunch Mobile App
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.relaunchApp', async () => {
      await handleRelaunchAppCommand(context);
    })
  );

  // 25. Command: Open Mobile Command Center
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.openMenu', async () => {
      await handleOpenMenuCommand(context);
    })
  );

  // 26. Remote Key Commands: Back, Home, Recents, Power
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.keyHome', () => handleSendKeyEventCommand(3, 'Home')),
    vscode.commands.registerCommand('adbsnap.keyBack', () => handleSendKeyEventCommand(4, 'Back')),
    vscode.commands.registerCommand('adbsnap.keyRecents', () => handleSendKeyEventCommand(187, 'Recents')),
    vscode.commands.registerCommand('adbsnap.keyPower', () => handleSendKeyEventCommand(26, 'Power'))
  );

  // 27. Command: Send Text to Phone
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.sendText', async () => {
      await handleSendTextCommand();
    })
  );

  // 28. Command: Open Deep Link on Device
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.openDeepLink', async () => {
      await handleOpenDeepLinkCommand();
    })
  );

  // 29. Command: Record Screen (GIF / MP4)
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.recordScreen', async () => {
      await handleRecordScreenCommand(context);
    })
  );

  // 30. Command: Capture Bug Report (Screenshot + Logcat)
  context.subscriptions.push(
    vscode.commands.registerCommand('adbsnap.bugReport', async () => {
      await handleBugReportCommand(context);
    })
  );

  // 31. Markdown Hover Provider for Visual Tooltip Preview
  registerMarkdownHoverProvider(context);

  // Restore known Wi-Fi endpoint and attempt background auto-reconnect if no active device is connected
  const savedWifi = context.globalState.get<string>('adbsnap.lastWifiEndpoint');
  if (savedWifi) {
    statusBarManager.setLastWirelessEndpoint(savedWifi);
    setTimeout(async () => {
      const active = statusBarManager.getActiveDevice();
      if (!active || !active.isAuthorized) {
        await statusBarManager.attemptAutoReconnect();
        devicesProvider.refresh();
      }
    }, 2000);
  }
}

export function deactivate() {
  StudioWebviewManager.dispose();
  if (statusBarManager) {
    statusBarManager.dispose();
  }
}

/**
 * Resolves the destination directory, replacing ${workspaceFolder} if needed.
 * Falls back to ~/Desktop/ADBSnap or ~/ADBSnap if no workspace is open.
 */
function resolveOutputDir(): string {
  const config = vscode.workspace.getConfiguration('adbsnap');
  let outDir = config.get<string>('outputDirectory') || '${workspaceFolder}/output';

  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (workspaceFolders && workspaceFolders.length > 0) {
    // Workspace is open — save relative to project root
    outDir = outDir.replace('${workspaceFolder}', workspaceFolders[0].uri.fsPath);
  } else if (outDir.includes('${workspaceFolder}')) {
    // No workspace open — save to Desktop/ADBSnap or Home/ADBSnap
    const os = require('node:os');
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const fallbackRoot = fs.stat(desktopPath).then(() => desktopPath).catch(() => os.homedir());
    // Use synchronous check for simplicity
    const home = os.homedir();
    const desktop = path.join(home, 'Desktop');
    let baseDir: string;
    try {
      require('node:fs').accessSync(desktop);
      baseDir = desktop;
    } catch {
      baseDir = home;
    }
    outDir = path.join(baseDir, 'ADBSnap');
  }

  return path.resolve(outDir);
}

interface SnapOptions {
  copyToClipboard?: boolean;
  returnResult?: boolean;
}

interface SnapResult {
  filePath: string;
  fileName: string;
}

/**
 * Handles Framed Screenshot Capture via CLI delegation.
 * Shells out to `adbsnap snap` to avoid bundling sharp native binaries.
 */
async function handleSnapCommand(
  context: vscode.ExtensionContext,
  options: SnapOptions
): Promise<SnapResult | null> {
  const device = statusBarManager.getActiveDevice();
  if (!device) {
    vscode.window.showWarningMessage('ADBSnap: No connected ADB device found. Please attach a device or emulator.');
    return null;
  }

  if (!device.isAuthorized) {
    vscode.window.showErrorMessage(`ADBSnap: Device "${device.model}" is unauthorized. Please accept the USB debugging prompt on the device.`);
    return null;
  }

  let resultOutput: SnapResult | null = null;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: options.copyToClipboard ? 'ADBSnap: Snapping to Clipboard...' : 'ADBSnap: Capturing & Framing...',
      cancellable: false,
    },
    async () => {
      try {
        const config = vscode.workspace.getConfiguration('adbsnap');
        const theme = config.get<string>('defaultTheme') || 'aurora';
        const frame = config.get<string>('defaultFrame') || 'iphone-16-pro';
        const format = config.get<string>('defaultFormat') || 'png';
        const aspect = config.get<string>('defaultAspectRatio') || 'portrait';
        const ext = format === 'jpeg' ? 'jpg' : format;

        const outDir = resolveOutputDir();
        await fs.mkdir(outDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `adbsnap-${frame}-${theme}-${aspect}-${timestamp}.${ext}`;
        const filePath = path.join(outDir, fileName);

        // Delegate to the adbsnap CLI for compositing (avoids sharp native dependency)
        const cliArgs = [
          'snap',
          '--frame', frame,
          '--theme', theme,
          '--format', format,
          '--aspect', aspect,
          '--device', device.id,
          '--out', filePath,
        ];

        const result = await runAdbSnapCli(context.extensionPath, cliArgs, 30000);

        if (result.exitCode !== 0) {
          const errorMsg = result.stderr || result.stdout || 'Unknown CLI error';
          throw new Error(errorMsg.trim());
        }

        resultOutput = { filePath, fileName };

        if (options.copyToClipboard) {
          // Read the saved file and copy to clipboard
          const imgBuffer = await fs.readFile(filePath);
          await copyImageBufferToClipboard(Buffer.from(imgBuffer));
          vscode.window.showInformationMessage('📸 ADBSnap: Framed screenshot copied to clipboard!');
        }

        if (capturesProvider) {
          capturesProvider.refresh();
        }

        if (!options.returnResult) {
          const action = await vscode.window.showInformationMessage(
            `📸 Saved screenshot to ${fileName}`,
            'Open Image',
            'Reveal in Explorer'
          );

          if (action === 'Open Image') {
            await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
          } else if (action === 'Reveal in Explorer') {
            await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(filePath));
          }
        }

        await checkAndPromptReview(context);
      } catch (err: any) {
        vscode.window.showErrorMessage(`ADBSnap Capture Failed: ${err.message || err}`);
      }
    }
  );

  return resultOutput;
}

/**
 * Handles Raw Unframed Screenshot Capture via CLI delegation.
 */
async function handleSnapRawCommand(context: vscode.ExtensionContext): Promise<void> {
  const device = statusBarManager.getActiveDevice();
  if (!device || !device.isAuthorized) {
    vscode.window.showWarningMessage('ADBSnap: No authorized device found.');
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'ADBSnap: Capturing Raw Screen...',
      cancellable: false,
    },
    async () => {
      try {
        const outDir = resolveOutputDir();
        await fs.mkdir(outDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `raw-snap-${timestamp}.png`;
        const filePath = path.join(outDir, fileName);

        // Delegate to CLI with --raw flag
        const cliArgs = [
          'snap',
          '--raw',
          '--device', device.id,
          '--out', filePath,
        ];

        const result = await runAdbSnapCli(context.extensionPath, cliArgs, 15000);

        if (result.exitCode !== 0) {
          const errorMsg = result.stderr || result.stdout || 'Unknown CLI error';
          throw new Error(errorMsg.trim());
        }

        if (capturesProvider) {
          capturesProvider.refresh();
        }

        const action = await vscode.window.showInformationMessage(
          `📸 Saved raw screen to ${fileName}`,
          'Open Image',
          'Reveal in Explorer'
        );

        if (action === 'Open Image') {
          await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
        } else if (action === 'Reveal in Explorer') {
          await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(filePath));
        }

        await checkAndPromptReview(context);
      } catch (err: any) {
        vscode.window.showErrorMessage(`ADBSnap Raw Capture Failed: ${err.message || err}`);
      }
    }
  );
}

/**
 * Prompts the user for a 5-star review on the Visual Studio Marketplace
 * after they have successfully performed 5 captures (proven value delivery).
 */
async function checkAndPromptReview(context: vscode.ExtensionContext): Promise<void> {
  const HAS_RATED_KEY = 'adbsnap.hasRatedOrDismissed';
  const SNAP_COUNT_KEY = 'adbsnap.successfulSnapCount';

  if (context.globalState.get<boolean>(HAS_RATED_KEY)) {
    return;
  }

  const currentCount = (context.globalState.get<number>(SNAP_COUNT_KEY) || 0) + 1;
  await context.globalState.update(SNAP_COUNT_KEY, currentCount);

  // Trigger prompt on 5th successful capture
  if (currentCount === 5) {
    const response = await vscode.window.showInformationMessage(
      '⭐ Enjoying ADBSnap? Leaving a 5-star review on the Marketplace helps support open-source development!',
      'Leave a Review',
      'Maybe Later',
      "Don't Ask Again"
    );

    if (response === 'Leave a Review') {
      await context.globalState.update(HAS_RATED_KEY, true);
      vscode.env.openExternal(
        vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=shriramsingh.adbsnap&ssr=false#review-details')
      );
    } else if (response === "Don't Ask Again") {
      await context.globalState.update(HAS_RATED_KEY, true);
    }
  }
}

/**
 * Device Picker QuickPick
 */
async function handleSelectDeviceCommand(): Promise<void> {
  const devices = await statusBarManager.refresh();

  type DeviceQuickPickItem = vscode.QuickPickItem & { device?: ConnectedDevice; action?: string };

  const items: DeviceQuickPickItem[] = [];

  if (devices.length > 0) {
    const active = statusBarManager.getActiveDevice();
    for (const d of devices) {
      const isCurrent = active?.id === d.id;
      const typeLabel = d.platform === 'ios'
        ? d.type === 'emulator' ? 'iOS Simulator' : `iOS ${d.type === 'wifi' ? 'Wi-Fi' : 'Device'}`
        : d.type === 'wifi' ? 'Wi-Fi' : d.type === 'emulator' ? 'Emulator' : 'USB';
      const statusIcon = d.isAuthorized ? '$(check)' : '$(alert)';
      items.push({
        label: `${statusIcon} ${d.model} (${typeLabel}) ${isCurrent ? '• Active' : ''}`,
        description: d.id,
        detail: d.isAuthorized
          ? `Status: Ready (${d.product})`
          : d.platform === 'ios'
            ? 'Status: Not paired - unlock the device and trust this Mac'
            : 'Status: Unauthorized - approve USB debugging on device',
        device: d,
      });
    }
  } else {
    items.push({
      label: '$(warning) No devices detected',
      description: 'Connect an Android device or pair an iOS device with this Mac',
    });
  }

  items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });
  items.push({
    label: '$(refresh) Refresh Connected Devices',
    description: 'Re-scan USB and Wi-Fi ADB devices',
    action: 'refresh',
  });
  items.push({
    label: '$(broadcast) Connect Device via Wi-Fi IP',
    description: 'Direct connect to phone IP (e.g. 192.168.1.45:5555)',
    action: 'connectIp',
  });
  items.push({
    label: '$(key) Pair Wireless Device (Android 11+)',
    description: 'Pair with 6-digit Wi-Fi pairing code and port from developer options',
    action: 'pairWifi',
  });
  const offlineEp = statusBarManager.getLastWirelessEndpoint();
  if (offlineEp && !devices.some((d) => d.id === offlineEp)) {
    items.push({
      label: `$(sync) Reconnect to ${offlineEp}`,
      description: 'Attempt reconnect to last known wireless endpoint',
      action: 'reconnect',
    });
  }
  items.push({
    label: '$(radio-tower) Switch USB Device to Wireless (WiFi)',
    description: 'Set up wireless debugging over local network from USB',
    action: 'wifi',
  });
  items.push({
    label: '$(plug) Turn Off Wi-Fi Mode (Revert to USB)',
    description: 'Disconnect wireless ADB and reset device connection to USB',
    action: 'disconnectWifi',
  });

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select active Android device or action',
  });

  if (!selected) return;

  if (selected.action === 'refresh') {
    await statusBarManager.refresh();
    vscode.window.showInformationMessage('ADBSnap: Device list refreshed.');
  } else if (selected.action === 'connectIp') {
    await handleConnectIpCommand();
  } else if (selected.action === 'pairWifi') {
    await handlePairWifiCommand();
  } else if (selected.action === 'reconnect') {
    await handleReconnectCommand();
  } else if (selected.action === 'wifi') {
    await handleWifiCommand();
  } else if (selected.action === 'disconnectWifi') {
    await handleDisconnectWifiCommand();
  } else if (selected.device) {
    statusBarManager.setActiveDevice(selected.device);
    vscode.window.showInformationMessage(`ADBSnap: Active device set to "${selected.device.model}".`);
  }
}

/**
 * Switch to Wireless ADB (WiFi)
 */
async function handleWifiCommand(): Promise<void> {
  const devices = await listAllDevices();
  const usbDevices = devices.filter((d) => d.platform === 'android' && d.type === 'usb' && d.isAuthorized);

  if (usbDevices.length === 0) {
    vscode.window.showWarningMessage('ADBSnap: No authorized USB device found. Connect phone via USB or use "Connect via Wi-Fi IP".');
    return;
  }

  let targetId = usbDevices[0].id;
  if (usbDevices.length > 1) {
    const picked = await vscode.window.showQuickPick(
      usbDevices.map((d) => ({ label: d.model, description: d.id })),
      { placeHolder: 'Select USB device to switch to Wireless' }
    );
    if (!picked) return;
    targetId = picked.description!;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'ADBSnap: Switching device to Wireless ADB...',
      cancellable: false,
    },
    async () => {
      try {
        const address = await androidDriver.enableWireless(targetId);
        statusBarManager.setLastWirelessEndpoint(address);
        await statusBarManager.refresh();
        if (devicesProvider) {
          devicesProvider.refresh();
        }
        vscode.window.showInformationMessage(`🎉 ADBSnap: Connected wirelessly to ${address}! You can now disconnect the USB cable.`);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Wireless Setup Failed: ${err.message || err}`);
      }
    }
  );
}

/**
 * Connect directly to an Android device by IP and port
 */
async function handleConnectIpCommand(context?: vscode.ExtensionContext): Promise<void> {
  const defaultVal = statusBarManager.getLastWirelessEndpoint() || '192.168.1.';
  const input = await vscode.window.showInputBox({
    title: 'Connect Android Device by Wi-Fi IP',
    prompt: 'Enter device IP and optional port (e.g. 192.168.1.45 or 192.168.1.45:5555)',
    value: defaultVal,
    ignoreFocusOut: true,
  });

  if (!input || !input.trim()) return;

  const raw = input.trim();
  const [ip, portStr] = raw.includes(':') ? raw.split(':') : [raw, '5555'];
  const port = portStr ? Number(portStr) : 5555;
  const endpoint = `${ip}:${port}`;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `ADBSnap: Connecting to ${endpoint}...`,
      cancellable: false,
    },
    async () => {
      try {
        const res = await androidDriver.connectWifi(ip, port);
        if (res.success) {
          statusBarManager.setLastWirelessEndpoint(endpoint);
          if (context) {
            context.globalState.update('adbsnap.lastWifiEndpoint', endpoint);
          }
          await statusBarManager.refresh();
          if (devicesProvider) devicesProvider.refresh();
          vscode.window.showInformationMessage(`📶 Connected to Android device at ${endpoint}!`);
        } else {
          vscode.window.showErrorMessage(`❌ Connection failed: ${res.message}`);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Connection error: ${err.message || err}`);
      }
    }
  );
}

/**
 * Pair with Android 11+ device using 6-digit wireless pairing code
 */
async function handlePairWifiCommand(context?: vscode.ExtensionContext): Promise<void> {
  const ipPort = await vscode.window.showInputBox({
    title: 'Wireless Pairing (Step 1/2: IP & Pairing Port)',
    prompt: 'Enter IP and 5-digit Pairing Port shown under Developer Options > Wireless debugging > Pair with code',
    placeHolder: '192.168.1.45:37851',
    ignoreFocusOut: true,
  });

  if (!ipPort || !ipPort.includes(':')) {
    if (ipPort) vscode.window.showErrorMessage('Please specify both IP and Pairing Port (format: 192.168.1.X:PORT)');
    return;
  }

  const [ip, portStr] = ipPort.trim().split(':');
  const port = Number(portStr);

  const code = await vscode.window.showInputBox({
    title: 'Wireless Pairing (Step 2/2: 6-Digit Code)',
    prompt: `Enter the 6-digit Wi-Fi pairing code displayed on your phone for ${ip}:${port}`,
    placeHolder: '123456',
    ignoreFocusOut: true,
  });

  if (!code || !code.trim()) return;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `ADBSnap: Pairing with ${ip}:${port}...`,
      cancellable: false,
    },
    async () => {
      try {
        const pairRes = await androidDriver.pairWifi(ip.trim(), port, code.trim());
        if (pairRes.success) {
          vscode.window.showInformationMessage(`🎉 Paired successfully with ${ip}! Connecting link...`);
          // Give mDNS daemon time to register
          await new Promise((r) => setTimeout(r, 1200));
          const connRes = await androidDriver.connectWifi(ip.trim(), 5555);
          const fullEndpoint = `${ip.trim()}:5555`;
          statusBarManager.setLastWirelessEndpoint(fullEndpoint);
          if (context) {
            context.globalState.update('adbsnap.lastWifiEndpoint', fullEndpoint);
          }
          await statusBarManager.refresh();
          if (devicesProvider) devicesProvider.refresh();
          if (connRes.success) {
            vscode.window.showInformationMessage(`📶 Wirelessly connected to ${fullEndpoint}!`);
          }
        } else {
          vscode.window.showErrorMessage(`❌ Pairing failed: ${pairRes.message}`);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Pairing error: ${err.message || err}`);
      }
    }
  );
}

/**
 * 1-Click Reconnect to known or offline wireless device
 */
async function handleReconnectCommand(context?: vscode.ExtensionContext, target?: any): Promise<void> {
  const endpoint = typeof target === 'string'
    ? target
    : target?.endpoint || target?.device?.id || statusBarManager.getLastWirelessEndpoint();

  if (!endpoint || !endpoint.includes(':')) {
    await handleConnectIpCommand(context);
    return;
  }

  const [ip, portStr] = endpoint.split(':');
  const port = portStr ? Number(portStr) : 5555;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `ADBSnap: Reconnecting to ${endpoint}...`,
      cancellable: false,
    },
    async () => {
      try {
        const res = await androidDriver.connectWifi(ip, port);
        if (res.success) {
          statusBarManager.setLastWirelessEndpoint(endpoint);
          if (context) {
            context.globalState.update('adbsnap.lastWifiEndpoint', endpoint);
          }
          await statusBarManager.refresh();
          if (devicesProvider) devicesProvider.refresh();
          vscode.window.showInformationMessage(`📶 Reconnected to ${endpoint}!`);
        } else {
          vscode.window.showWarningMessage(`❌ Reconnect to ${endpoint} failed: ${res.message}`);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Reconnect error: ${err.message || err}`);
      }
    }
  );
}

/**
 * Disconnect Wi-Fi mode and revert back to USB
 */
async function handleDisconnectWifiCommand(context?: vscode.ExtensionContext, targetDevice?: any): Promise<void> {
  const dev = targetDevice && 'device' in targetDevice ? targetDevice.device : targetDevice;
  const deviceId = dev?.id || statusBarManager.getActiveDevice()?.id;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'ADBSnap: Reverting ADB to USB mode...',
      cancellable: false,
    },
    async () => {
      try {
        if (androidDriver.disableWireless) {
          await androidDriver.disableWireless(deviceId);
        }
        statusBarManager.setLastWirelessEndpoint(null);
        if (context) {
          context.globalState.update('adbsnap.lastWifiEndpoint', undefined);
        }
        await statusBarManager.refresh();
        if (devicesProvider) {
          devicesProvider.refresh();
        }
        vscode.window.showInformationMessage('🔌 ADBSnap: Wi-Fi mode turned off. Switched back to USB mode.');
      } catch (err: any) {
        vscode.window.showErrorMessage(`Disconnect Wi-Fi Failed: ${err.message || err}`);
      }
    }
  );
}

/**
 * Diagnostic Doctor — shows environment info and CLI runner resolution
 */
async function handleDoctorCommand(context: vscode.ExtensionContext): Promise<void> {
  outputChannel.clear();
  outputChannel.show(true);

  outputChannel.appendLine('========================================');
  outputChannel.appendLine('  🩺 ADBSnap Environment Doctor');
  outputChannel.appendLine('========================================');
  outputChannel.appendLine(`• Node Version : ${process.version}`);
  outputChannel.appendLine(`• Platform     : ${process.platform} (${process.arch})`);

  let adbPath = 'adb';
  try {
    adbPath = resolveAdbPath();
    outputChannel.appendLine(`• ADB Path     : ${adbPath}`);
  } catch (err: any) {
    outputChannel.appendLine(`• ADB Path     : FAILED (${err.message})`);
  }

  // Show which CLI runner the extension resolved
  const cliLabel = getCliRunnerLabel(context.extensionPath);
  outputChannel.appendLine(`• CLI Runner   : ${cliLabel}`);

  outputChannel.appendLine('\n--- Connected Devices ---');
  try {
    const devices = await listAllDevices();
    if (devices.length === 0) {
      outputChannel.appendLine('No attached mobile devices detected.');
    } else {
      devices.forEach((d, index) => {
        outputChannel.appendLine(
          `[${index + 1}] [${d.type.toUpperCase()}] ${d.model} (${d.id}) -> ${d.isAuthorized ? 'READY' : 'UNAUTHORIZED'}`
        );
      });
    }
  } catch (err: any) {
    outputChannel.appendLine(`Device scan failed: ${err.message}`);
  }
  outputChannel.appendLine('========================================\n');
}

/**
 * Export Store Asset Pack — generates all App Store & Google Play dimensions via CLI
 */
async function handleExportCommand(context: vscode.ExtensionContext): Promise<void> {
  const device = statusBarManager.getActiveDevice();
  if (!device) {
    vscode.window.showWarningMessage('ADBSnap: No connected ADB device found. Please attach a device or emulator.');
    return;
  }

  if (!device.isAuthorized) {
    vscode.window.showErrorMessage(`ADBSnap: Device "${device.model}" is unauthorized. Please accept the USB debugging prompt on the device.`);
    return;
  }

  // Let user pick which store targets to export
  const storePick = await vscode.window.showQuickPick(
    [
      { label: '$(package) All Stores (App Store + Google Play)', description: '4 sizes: 6.9", 6.7", 6.5" + Play Store', value: 'all' },
      { label: '$(device-mobile) Apple App Store Only', description: '3 sizes: 6.9", 6.7", 6.5"', value: 'apple' },
      { label: '$(rocket) Google Play Store Only', description: '1 size: Play Store standard', value: 'google' },
    ],
    { placeHolder: 'Select store targets for export' }
  );

  if (!storePick) return;

  // Optional: ask for title and subtitle
  const title = await vscode.window.showInputBox({
    prompt: 'Headline text for the showcase (leave empty to skip)',
    placeHolder: 'e.g. Track Your Daily Habits',
  });

  const subtitle = title
    ? await vscode.window.showInputBox({
        prompt: 'Subtitle text (leave empty to skip)',
        placeHolder: 'e.g. Simple. Fast. Beautiful.',
      })
    : undefined;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `ADBSnap: Exporting ${storePick.value === 'all' ? 'All Stores' : storePick.value === 'apple' ? 'App Store' : 'Play Store'} assets...`,
      cancellable: false,
    },
    async () => {
      try {
        const config = vscode.workspace.getConfiguration('adbsnap');
        const theme = config.get<string>('defaultTheme') || 'aurora';
        const frame = config.get<string>('defaultFrame') || 'iphone-16-pro';

        const outDir = resolveOutputDir();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const exportDir = path.join(outDir, `export-${theme}-${timestamp}`);

        const cliArgs = [
          'export',
          '--frame', frame,
          '--theme', theme,
          '--store', storePick.value,
          '--device', device.id,
          '--out', exportDir,
          '--zip',
        ];

        if (title) {
          cliArgs.push('--title', title);
        }
        if (subtitle) {
          cliArgs.push('--subtitle', subtitle);
        }

        const result = await runAdbSnapCli(context.extensionPath, cliArgs, 60000);

        if (result.exitCode !== 0) {
          const errorMsg = result.stderr || result.stdout || 'Unknown CLI error';
          throw new Error(errorMsg.trim());
        }

        if (capturesProvider) {
          capturesProvider.refresh();
        }

        const action = await vscode.window.showInformationMessage(
          `📦 Store asset pack exported to ${path.basename(exportDir)}/`,
          'Reveal in Explorer'
        );

        if (action === 'Reveal in Explorer') {
          await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(exportDir));
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`ADBSnap Export Failed: ${err.message || err}`);
      }
    }
  );
}

/**
 * Capture screen and insert markdown image tag directly into active document
 */
async function handleInsertMarkdownCommand(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('ADBSnap: Please open a Markdown or text document first.');
    return;
  }

  const result = await handleSnapCommand(context, { copyToClipboard: false, returnResult: true });
  if (!result) return;

  const docDir = path.dirname(editor.document.uri.fsPath);
  let relPath = path.relative(docDir, result.filePath).replace(/\\/g, '/');
  if (!relPath.startsWith('.') && !relPath.startsWith('/')) {
    relPath = './' + relPath;
  }

  const markdownSnippet = `![ADBSnap](${relPath})`;
  await editor.edit((editBuilder) => {
    editBuilder.insert(editor.selection.active, markdownSnippet);
  });
  vscode.window.showInformationMessage(`📸 Inserted "${result.fileName}" into document!`);
}

/**
 * 2026 Flagship Bezels Picker
 */
async function handleSelectFrameCommand(): Promise<void> {
  const config = vscode.workspace.getConfiguration('adbsnap');
  const currentFrame = config.get<string>('defaultFrame') || 'iphone-16-pro';

  const frames = [
    { label: 'iPhone 16 Pro Max', id: 'iphone-16-pro-max', description: '6.9" Dynamic Island (2026 Flagship)' },
    { label: 'iPhone 16 Pro', id: 'iphone-16-pro', description: '6.3" Dynamic Island' },
    { label: 'iPhone 16', id: 'iphone-16', description: '6.1" Base Model' },
    { label: 'iPhone 15 Pro', id: 'iphone-15-pro', description: 'Titanium chassis' },
    { label: 'iPhone 14', id: 'iphone-14', description: 'Classic Notch Bezel' },
    { label: 'Google Pixel 9 Pro Fold', id: 'pixel-9-pro-fold', description: '8.0" Inner Foldable OLED' },
    { label: 'Google Pixel 9 Pro', id: 'pixel-9-pro', description: '6.3" Punch-Hole OLED' },
    { label: 'Google Pixel 8', id: 'pixel-8', description: 'Compact Android flagship' },
    { label: 'Samsung Galaxy S25 Ultra', id: 'galaxy-s25-ultra', description: '6.8" Titanium chassis' },
    { label: 'Samsung Galaxy S24 Ultra', id: 'galaxy-s24-ultra', description: 'Square profile titanium' },
    { label: 'Samsung Galaxy S24', id: 'galaxy-s24', description: 'Compact dynamic AMOLED' },
    { label: 'Apple iPad Pro 13" M4', id: 'ipad-pro-13', description: 'Ultra-thin 13" tablet' },
    { label: 'Android Tablet 10"', id: 'android-tablet-10', description: '10.5" widescreen tablet' },
    { label: 'Modern Minimalist', id: 'minimal', description: 'Clean universal floating frame' },
    { label: 'Pure Floating Screen', id: 'none', description: 'No hardware bezel (Raw shadow only)' },
  ];

  const items = frames.map((f) => ({
    label: `${f.id === currentFrame ? '$(check) ' : ''}${f.label}`,
    description: f.id,
    detail: f.description,
    id: f.id,
  }));

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: `Select default device bezel chassis (current: ${currentFrame})`,
  });

  if (pick) {
    await config.update('defaultFrame', pick.id, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`📱 ADBSnap: Default bezel set to "${pick.label.replace('$(check) ', '')}" (${pick.id}).`);
  }
}

/**
 * 16 Curated Gradient Themes Picker
 */
async function handleSelectThemeCommand(): Promise<void> {
  const config = vscode.workspace.getConfiguration('adbsnap');
  const currentTheme = config.get<string>('defaultTheme') || 'aurora';

  const themes = [
    { id: 'aurora', label: 'Electric Aurora', colors: '#4f46e5 ➔ #06b6d4 ➔ #10b981' },
    { id: 'studioLight', label: 'Apple Studio Light', colors: '#f8fafc ➔ #f1f5f9 ➔ #e2e8f0' },
    { id: 'freshMint', label: 'Fresh Mint', colors: '#0f766e ➔ #059669 ➔ #10b981' },
    { id: 'sunset', label: 'Warm Sunset', colors: '#f43f5e ➔ #fb923c ➔ #fbbf24' },
    { id: 'midnight', label: 'Deep Midnight', colors: '#090d16 ➔ #1e1b4b ➔ #312e81' },
    { id: 'royal', label: 'Royal Orchid', colors: '#7c3aed ➔ #c026d3 ➔ #f43f5e' },
    { id: 'cleanDark', label: 'Titanium Dark', colors: '#18181b ➔ #27272a ➔ #09090b' },
    { id: 'fintech', label: 'Fintech Emerald', colors: '#022c22 ➔ #064e3b ➔ #047857' },
    { id: 'lavender', label: 'Lavender Mist', colors: '#1e1b4b ➔ #4c1d95 ➔ #7c3aed' },
    { id: 'cyberpunk', label: 'Cyberpunk Neon', colors: '#09090b ➔ #701a75 ➔ #a21caf' },
    { id: 'crimsonVoid', label: 'Crimson Void', colors: '#18181b ➔ #7f1d1d ➔ #450a0a' },
    { id: 'cobalt', label: 'Cobalt Indigo', colors: '#030712 ➔ #1e3a8a ➔ #1e40af' },
    { id: 'terracotta', label: 'Warm Terracotta', colors: '#1c1917 ➔ #78350f ➔ #9a3412' },
    { id: 'slateCarbon', label: 'Carbon Matte', colors: '#090d16 ➔ #1e293b ➔ #334155' },
    { id: 'pureWhite', label: 'Studio Minimal White', colors: '#ffffff ➔ #f8fafc' },
    { id: 'none', label: 'None (Raw / Transparent)', colors: 'Transparent' },
  ];

  const items = themes.map((t) => ({
    label: `${t.id === currentTheme ? '$(check) ' : ''}${t.label}`,
    description: t.id,
    detail: t.colors,
    id: t.id,
  }));

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: `Select default canvas backdrop gradient (current: ${currentTheme})`,
  });

  if (pick) {
    await config.update('defaultTheme', pick.id, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`🎨 ADBSnap: Default backdrop set to "${pick.label.replace('$(check) ', '')}" (${pick.id}).`);
  }
}

/**
 * Image Format Picker (PNG, WebP, AVIF, JPEG)
 */
async function handleSelectFormatCommand(): Promise<void> {
  const config = vscode.workspace.getConfiguration('adbsnap');
  const currentFormat = config.get<string>('defaultFormat') || 'png';

  const formats = [
    { id: 'png', label: 'PNG (Lossless Standard)', detail: 'Full fidelity, standard format for App Store & Google Play' },
    { id: 'webp', label: 'WebP (42% Smaller)', detail: 'Super-fast load times, ideal for web portfolios and documentation' },
    { id: 'avif', label: 'AVIF (95% Smaller)', detail: 'Next-gen compact format with superior HDR chroma reproduction' },
    { id: 'jpeg', label: 'JPEG (mozjpeg)', detail: 'Universal compatibility for social media and legacy systems' },
  ];

  const items = formats.map((f) => ({
    label: `${f.id === currentFormat ? '$(check) ' : ''}${f.label}`,
    description: f.id,
    detail: f.detail,
    id: f.id,
  }));

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: `Select screenshot format (current: ${currentFormat})`,
  });

  if (pick) {
    await config.update('defaultFormat', pick.id, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`📦 ADBSnap: Export format set to "${pick.id.toUpperCase()}".`);
  }
}

/**
 * QuickPick: Select Default Aspect Ratio
 */
async function handleSelectAspectRatioCommand(): Promise<void> {
  const config = vscode.workspace.getConfiguration('adbsnap');
  const currentAspect = config.get<string>('defaultAspectRatio') || 'portrait';

  const ratios = [
    { id: 'portrait', label: '📱 Portrait 9:19.5 (1290×2796)', detail: 'Apple App Store Connect & Google Play Console standard store mockup' },
    { id: 'landscape', label: '🖥️ Landscape 16:9 (1920×1080)', detail: 'Product Hunt, Twitter/X, and social banner presentation card' },
    { id: 'square', label: '⬛ Square 1:1 (1080×1080)', detail: 'Instagram, LinkedIn feed showcase, and square post preset' },
  ];

  const items = ratios.map((r) => ({
    label: `${r.id === currentAspect ? '$(check) ' : ''}${r.label}`,
    description: r.id,
    detail: r.detail,
    id: r.id,
  }));

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: `Select canvas aspect ratio (current: ${currentAspect})`,
  });

  if (pick) {
    await config.update('defaultAspectRatio', pick.id, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`📐 ADBSnap: Aspect ratio set to "${pick.label}".`);
  }
}

/**
 * Toggle Android SystemUI Demo Mode
 */
async function handleToggleDemoModeCommand(_context: vscode.ExtensionContext): Promise<void> {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== 'android') {
    vscode.window.showWarningMessage('ADBSnap: SystemUI Demo Mode requires an active Android device.');
    return;
  }

  const choices = [
    {
      id: 'enable',
      label: '$(check) Enable Demo Mode',
      detail: 'Pristine 9:41 AM clock, 100% battery, full Wi-Fi signal, and notifications hidden.',
    },
    {
      id: 'disable',
      label: '$(x) Disable Demo Mode',
      detail: 'Exit demo mode and restore the real system status bar.',
    },
  ];

  const pick = await vscode.window.showQuickPick(choices, {
    placeHolder: `Configure SystemUI Demo Mode for ${device.model} (${device.id})`,
  });

  if (!pick) return;

  const enable = pick.id === 'enable';

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: enable ? 'ADBSnap: Enabling Demo Mode...' : 'ADBSnap: Disabling Demo Mode...',
      cancellable: false,
    },
    async () => {
      try {
        await androidDriver.setDemoMode(enable, device.id);
        if (enable) {
          vscode.window.showInformationMessage(`✨ Demo Mode ENABLED on ${device.model}! Status bar is now clean (9:41 AM, 100% battery).`);
        } else {
          vscode.window.showInformationMessage(`🔄 Demo Mode DISABLED on ${device.model}. Real status bar restored.`);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Demo Mode Error: ${err.message || err}`);
      }
    }
  );
}

/**
 * Autonomous Android Tab Crawler
 */
async function handleExploreCommand(context: vscode.ExtensionContext): Promise<void> {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== 'android') {
    vscode.window.showWarningMessage('ADBSnap: Tab Explorer requires an active Android device.');
    return;
  }

  const maxTabsInput = await vscode.window.showInputBox({
    title: 'ADBSnap: Explore Android App Tabs',
    prompt: 'Maximum number of bottom navigation tabs to crawl and snap',
    value: '5',
    validateInput: (v) => (!isNaN(Number(v)) && Number(v) > 0 ? null : 'Please enter a valid positive number'),
  });

  if (!maxTabsInput) return;
  const maxTabs = parseInt(maxTabsInput.trim(), 10);

  outputChannel.clear();
  outputChannel.show(true);
  outputChannel.appendLine(`🚀 Starting Android Tab Crawler on device: ${device.id} (Max tabs: ${maxTabs})...`);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `ADBSnap: Crawling app tabs (${device.model})...`,
      cancellable: false,
    },
    async () => {
      try {
        const outDir = resolveOutputDir();
        const cliArgs = [
          'explore',
          '--max-tabs', String(maxTabs),
          '--device', device.id,
          '--out', outDir,
          '--zip',
        ];
        const res = await runAdbSnapCli(context.extensionPath, cliArgs, 120000);
        outputChannel.appendLine(res.stdout || '');
        if (res.stderr) outputChannel.appendLine(res.stderr);

        if (res.exitCode === 0) {
          if (capturesProvider) capturesProvider.refresh();
          const action = await vscode.window.showInformationMessage(
            '🎉 Tab exploration completed! Screenshots & ZIP saved.',
            'Reveal in Explorer',
            'Open Studio'
          );
          if (action === 'Reveal in Explorer') {
            vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(outDir));
          } else if (action === 'Open Studio') {
            vscode.commands.executeCommand('adbsnap.openStudio');
          }
        } else {
          vscode.window.showErrorMessage(`Explorer error: ${res.stderr || res.stdout}`);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Exploration failed: ${err.message || err}`);
      }
    }
  );
}

/**
 * Autonomous iOS UI Explorer (XCTest)
 */
async function handleExploreIosCommand(context: vscode.ExtensionContext): Promise<void> {
  const device = statusBarManager.getActiveDevice();
  const isMac = process.platform === 'darwin';

  if (!isMac) {
    vscode.window.showWarningMessage('ADBSnap: iOS UI Explorer requires macOS with Xcode command-line tools installed.');
    return;
  }

  const bundleInput = await vscode.window.showInputBox({
    title: 'ADBSnap: Autonomous iOS UI Explorer (XCTest)',
    prompt: 'Bundle Identifier of the installed iOS app to explore',
    placeHolder: 'e.g. com.example.myapp',
    ignoreFocusOut: true,
  });

  if (!bundleInput || !bundleInput.trim()) return;
  const bundle = bundleInput.trim();

  let teamId: string | undefined;
  if (device && device.type !== 'emulator') {
    const teamInput = await vscode.window.showInputBox({
      title: 'Apple Developer Team ID (Physical Device)',
      prompt: '10-character Team ID from developer.apple.com for signing the UI runner',
      placeHolder: 'e.g. ABCDE12345',
    });
    if (teamInput && teamInput.trim()) teamId = teamInput.trim();
  }

  outputChannel.clear();
  outputChannel.show(true);
  outputChannel.appendLine(`🚀 Starting iOS XCTest Auto Explorer for "${bundle}"...`);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `ADBSnap: Exploring iOS app ${bundle}...`,
      cancellable: false,
    },
    async () => {
      try {
        const outDir = resolveOutputDir();
        const cliArgs = ['explore-ios', '--bundle', bundle, '--out', outDir, '--zip'];
        if (device?.id) cliArgs.push('--device', device.id);
        if (teamId) cliArgs.push('--team', teamId);

        const res = await runAdbSnapCli(context.extensionPath, cliArgs, 180000);
        outputChannel.appendLine(res.stdout || '');
        if (res.stderr) outputChannel.appendLine(res.stderr);

        if (res.exitCode === 0) {
          if (capturesProvider) capturesProvider.refresh();
          vscode.window.showInformationMessage('🎉 iOS UI Exploration completed! Screenshots saved.');
        } else {
          vscode.window.showErrorMessage(`iOS Explorer error: ${res.stderr || res.stdout}`);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`iOS Exploration failed: ${err.message || err}`);
      }
    }
  );
}

/**
 * 1-Click App Data Reset (Logout / Clear Cache)
 */
async function handleResetAppDataCommand(_context: vscode.ExtensionContext): Promise<void> {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== 'android') {
    vscode.window.showWarningMessage('ADBSnap: App Data Reset requires an active Android device.');
    return;
  }

  let defaultPkg = '';
  try {
    defaultPkg = (await androidDriver.getForegroundApp(device.id)) || '';
  } catch {
    // ignore
  }

  const pkg = await vscode.window.showInputBox({
    title: 'ADBSnap: Reset App Data (Logout / Clear Cache)',
    prompt: 'Enter Android application package name to reset (pm clear)',
    value: defaultPkg,
    ignoreFocusOut: true,
  });

  if (!pkg || !pkg.trim()) return;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `ADBSnap: Clearing app data for ${pkg.trim()}...`,
      cancellable: false,
    },
    async () => {
      try {
        await androidDriver.resetAppData(pkg.trim(), device.id);
        vscode.window.showInformationMessage(`🎉 Successfully wiped data for "${pkg.trim()}"! App reset to pristine state.`);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Reset App Data Failed: ${err.message || err}`);
      }
    }
  );
}

/**
 * Relaunch Mobile App
 */
async function handleRelaunchAppCommand(_context: vscode.ExtensionContext): Promise<void> {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== 'android') {
    vscode.window.showWarningMessage('ADBSnap: App Relaunch requires an active Android device.');
    return;
  }

  let defaultPkg = '';
  try {
    defaultPkg = (await androidDriver.getForegroundApp(device.id)) || '';
  } catch {
    // ignore
  }

  const pkg = await vscode.window.showInputBox({
    title: 'ADBSnap: Relaunch Mobile App',
    prompt: 'Enter package name to terminate and restart',
    value: defaultPkg,
    ignoreFocusOut: true,
  });

  if (!pkg || !pkg.trim()) return;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `ADBSnap: Relaunching ${pkg.trim()}...`,
      cancellable: false,
    },
    async () => {
      try {
        await androidDriver.killApp(pkg.trim(), device.id);
        await new Promise((r) => setTimeout(r, 400));
        await androidDriver.launchApp(pkg.trim(), device.id);
        vscode.window.showInformationMessage(`🚀 Relaunched "${pkg.trim()}"!`);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Relaunch Failed: ${err.message || err}`);
      }
    }
  );
}

/**
 * Mobile Command Center Menu (triggered from Status Bar or Command Palette)
 */
async function handleOpenMenuCommand(context: vscode.ExtensionContext): Promise<void> {
  const activeDevice = statusBarManager.getActiveDevice();
  const deviceLabel = activeDevice
    ? `${activeDevice.model} (${activeDevice.id}) [${activeDevice.platform.toUpperCase()} ${activeDevice.type.toUpperCase()}]`
    : 'No active device connected';

  const items: (vscode.QuickPickItem & { action?: () => Promise<void> | void })[] = [
    {
      label: `📱 Active Device: ${deviceLabel}`,
      description: activeDevice?.isAuthorized ? '$(check) READY' : '$(alert) UNAUTHORIZED',
      detail: 'Click to select or switch active target device',
      action: () => vscode.commands.executeCommand('adbsnap.devices'),
    },
    { label: '', kind: vscode.QuickPickItemKind.Separator },
    {
      label: '$(camera) Quick Capture (Framed)',
      description: 'Ctrl+Alt+S',
      detail: 'Capture and composite into active device frame and gradient theme',
      action: () => vscode.commands.executeCommand('adbsnap.snap'),
    },
    {
      label: '$(copy) Capture & Copy to Clipboard',
      description: 'Ctrl+Alt+C',
      detail: 'Capture framed image and copy directly to system clipboard',
      action: () => vscode.commands.executeCommand('adbsnap.snapClipboard'),
    },
    {
      label: '$(markdown) Capture & Insert into Document',
      detail: 'Capture screen and write ![ADBSnap](path) markdown tag at cursor position',
      action: () => vscode.commands.executeCommand('adbsnap.insertMarkdown'),
    },
    {
      label: '$(device-mobile) Capture Raw Screenshot',
      detail: 'Save raw device pixel buffer without framing or backdrops',
      action: () => vscode.commands.executeCommand('adbsnap.snapRaw'),
    },
    {
      label: '$(record) Record Screen (MP4 / Video)',
      detail: 'Record mobile screen video and composite inside 4K vector chassis',
      action: () => vscode.commands.executeCommand('adbsnap.recordScreen'),
    },
    {
      label: '$(bug) Capture Bug Report (Screenshot + Logcat)',
      detail: 'Snap screen and bundle with recent crash exception logs into Markdown',
      action: () => vscode.commands.executeCommand('adbsnap.bugReport'),
    },
    { label: '', kind: vscode.QuickPickItemKind.Separator },
    {
      label: '$(paintcan) Open Asset Studio',
      detail: 'Open the visual WYSIWYG studio canvas in an embedded tab',
      action: () => vscode.commands.executeCommand('adbsnap.openStudio'),
    },
    {
      label: '$(edit) Send Selected Text to Phone',
      detail: 'Type editor selection or input text into active phone input field',
      action: () => vscode.commands.executeCommand('adbsnap.sendText'),
    },
    {
      label: '$(link-external) Open Deep Link on Device',
      detail: 'Open selected URL or deep-link URI intent on connected device',
      action: () => vscode.commands.executeCommand('adbsnap.openDeepLink'),
    },
    { label: '', kind: vscode.QuickPickItemKind.Separator },
    {
      label: '$(arrow-left) Remote Key: Back',
      detail: 'Dispatch hardware Back button (KEYCODE_BACK)',
      action: () => vscode.commands.executeCommand('adbsnap.keyBack'),
    },
    {
      label: '$(home) Remote Key: Home',
      detail: 'Dispatch hardware Home button (KEYCODE_HOME)',
      action: () => vscode.commands.executeCommand('adbsnap.keyHome'),
    },
    {
      label: '$(versions) Remote Key: Recent Apps',
      detail: 'Dispatch app switcher / recent tasks (KEYCODE_APP_SWITCH)',
      action: () => vscode.commands.executeCommand('adbsnap.keyRecents'),
    },
    {
      label: '$(lock) Remote Key: Power / Lock',
      detail: 'Dispatch hardware Power key to lock or wake device (KEYCODE_POWER)',
      action: () => vscode.commands.executeCommand('adbsnap.keyPower'),
    },
    { label: '', kind: vscode.QuickPickItemKind.Separator },
    {
      label: '$(screen-normal) Change Default Aspect Ratio',
      detail: 'Switch canvas aspect ratio preset (Portrait 9:19.5, Landscape 16:9, Square 1:1)',
      action: () => vscode.commands.executeCommand('adbsnap.selectAspectRatio'),
    },
    {
      label: '$(device-mobile) Change Default Bezel Frame',
      detail: 'Switch default chassis (iPhone 16 Pro Max, Pixel 9 Fold, Galaxy S25...)',
      action: () => vscode.commands.executeCommand('adbsnap.selectFrame'),
    },
    {
      label: '$(color-mode) Change Default Canvas Theme',
      detail: 'Switch default backdrop gradient (Aurora, Studio Light, Sunset...)',
      action: () => vscode.commands.executeCommand('adbsnap.selectTheme'),
    },
    {
      label: '$(file-media) Change Default Export Format',
      detail: 'Switch export format: PNG, WebP (42% smaller), AVIF (95% smaller), JPEG',
      action: () => vscode.commands.executeCommand('adbsnap.selectFormat'),
    },
    { label: '', kind: vscode.QuickPickItemKind.Separator },
    {
      label: '$(radio-tower) Switch to Wireless ADB (WiFi)',
      detail: '1-click switch USB phone to wireless TCP/IP mode',
      action: () => vscode.commands.executeCommand('adbsnap.wifi'),
    },
    {
      label: '$(plug) Revert Wi-Fi to USB Mode',
      detail: 'Disconnect wireless session and reset device port to USB',
      action: () => vscode.commands.executeCommand('adbsnap.disconnectWifi'),
    },
    {
      label: '$(key) Pair Wireless Device (Android 11+ PIN)',
      detail: 'Pair device using 6-digit wireless debugging code and pairing port',
      action: () => vscode.commands.executeCommand('adbsnap.pairWifi'),
    },
    {
      label: '$(clock) Toggle Android SystemUI Demo Mode',
      detail: 'Force status bar to clean 9:41 AM, 100% battery, no notification icons',
      action: () => vscode.commands.executeCommand('adbsnap.toggleDemoMode'),
    },
    {
      label: '$(clear-all) Reset App Data (pm clear)',
      detail: 'Wipe tokens, database, and cache in <100ms for fresh onboarding test',
      action: () => vscode.commands.executeCommand('adbsnap.resetAppData'),
    },
    {
      label: '$(debug-restart) Relaunch Mobile App',
      detail: 'Force-stop and restart active application from cold start',
      action: () => vscode.commands.executeCommand('adbsnap.relaunchApp'),
    },
    {
      label: '$(pulse) Run ADB Doctor Diagnostics',
      detail: 'Check adb path, daemon state, and device authorization',
      action: () => vscode.commands.executeCommand('adbsnap.doctor'),
    },
  ];

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: 'ADBSnap Mobile Command Center',
    matchOnDetail: true,
    matchOnDescription: true,
  });

  if (pick && pick.action) {
    await pick.action();
  }
}

/**
 * Dispatch hardware key event to connected Android device
 */
async function handleSendKeyEventCommand(keyCode: number, keyName: string): Promise<void> {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== 'android') {
    vscode.window.showWarningMessage(`ADBSnap: Remote ${keyName} key requires an active Android device.`);
    return;
  }
  try {
    await androidDriver.sendKeyEvent(keyCode, device.id);
    vscode.window.setStatusBarMessage(`📱 Key ${keyName} dispatched to ${device.model}`, 2000);
  } catch (err: any) {
    vscode.window.showErrorMessage(`Failed to send key ${keyName}: ${err.message || err}`);
  }
}

/**
 * Type text from editor or input box directly into active text field on phone
 */
async function handleSendTextCommand(): Promise<void> {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== 'android') {
    vscode.window.showWarningMessage('ADBSnap: Send Text requires an active Android device.');
    return;
  }

  const editor = vscode.window.activeTextEditor;
  let initialText = '';
  if (editor && !editor.selection.isEmpty) {
    initialText = editor.document.getText(editor.selection);
  }

  const text = await vscode.window.showInputBox({
    title: 'ADBSnap: Send Text to Phone',
    prompt: 'Enter text to type into the focused input field on the device',
    value: initialText,
    ignoreFocusOut: true,
  });

  if (!text) return;

  try {
    await androidDriver.inputText(text, device.id);
    vscode.window.showInformationMessage(`⌨️ Typed "${text.length > 25 ? text.slice(0, 25) + '...' : text}" onto ${device.model}!`);
  } catch (err: any) {
    vscode.window.showErrorMessage(`Failed to type text: ${err.message || err}`);
  }
}

/**
 * Open deep link or URL intent directly on mobile device
 */
async function handleOpenDeepLinkCommand(): Promise<void> {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== 'android') {
    vscode.window.showWarningMessage('ADBSnap: Open Deep Link requires an active Android device.');
    return;
  }

  const editor = vscode.window.activeTextEditor;
  let initialUri = '';
  if (editor && !editor.selection.isEmpty) {
    initialUri = editor.document.getText(editor.selection).trim();
  }

  const uri = await vscode.window.showInputBox({
    title: 'ADBSnap: Open Deep Link on Device',
    prompt: 'Enter deep link URI or URL (e.g. myapp://checkout?id=123 or https://...)',
    value: initialUri,
    ignoreFocusOut: true,
  });

  if (!uri || !uri.trim()) return;

  try {
    await androidDriver.openDeepLink(uri.trim(), device.id);
    vscode.window.showInformationMessage(`🔗 Dispatched intent for "${uri.trim()}" on ${device.model}!`);
  } catch (err: any) {
    vscode.window.showErrorMessage(`Failed to open deep link: ${err.message || err}`);
  }
}

/**
 * Record screen video directly from VS Code
 */
async function handleRecordScreenCommand(context: vscode.ExtensionContext): Promise<void> {
  const device = statusBarManager.getActiveDevice();
  if (!device) {
    vscode.window.showWarningMessage('ADBSnap: Screen Recording requires a connected device.');
    return;
  }

  const durationPick = await vscode.window.showQuickPick(
    [
      { id: '5', label: '5 seconds', detail: 'Fast, compact demo clip (great for PRs and bug reports)' },
      { id: '10', label: '10 seconds (Recommended)', detail: 'Standard user interaction walkthrough' },
      { id: '15', label: '15 seconds', detail: 'Extended flow demonstration' },
    ],
    { placeHolder: 'Select recording duration' }
  );

  if (!durationPick) return;
  const duration = durationPick.id;

  outputChannel.clear();
  outputChannel.show(true);
  outputChannel.appendLine(`🎥 Starting screen recording on ${device.model} (${duration} seconds)...`);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `ADBSnap: 🔴 Recording screen on ${device.model} (${duration}s)... Please interact with the device.`,
      cancellable: false,
    },
    async () => {
      try {
        const outDir = resolveOutputDir();
        await fs.mkdir(outDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const outPath = path.join(outDir, `record-${device.model.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.mp4`);

        const cliArgs = [
          'record',
          '--duration', duration,
          '--device', device.id,
          '--out', outPath,
        ];

        const res = await runAdbSnapCli(context.extensionPath, cliArgs, 60000);
        outputChannel.appendLine(res.stdout || '');
        if (res.stderr) outputChannel.appendLine(res.stderr);

        if (res.exitCode === 0 && (await fs.stat(outPath).catch(() => null))) {
          if (capturesProvider) capturesProvider.refresh();
          const action = await vscode.window.showInformationMessage(
            `🎬 Screen recording saved: ${path.basename(outPath)}`,
            'Open Video',
            'Reveal in Explorer'
          );
          if (action === 'Open Video') {
            await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(outPath));
          } else if (action === 'Reveal in Explorer') {
            await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(outPath));
          }
        } else {
          vscode.window.showErrorMessage(`Screen recording failed: ${res.stderr || res.stdout}`);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Recording error: ${err.message || err}`);
      }
    }
  );
}

/**
 * Capture Bug Report bundle (Screenshot + Logcat Crash Snippet) into structured Markdown
 */
async function handleBugReportCommand(context: vscode.ExtensionContext): Promise<void> {
  const device = statusBarManager.getActiveDevice();
  if (!device) {
    vscode.window.showWarningMessage('ADBSnap: Bug Report capture requires a connected device.');
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'ADBSnap: Generating Bug Report (Screenshot + Logcat)...',
      cancellable: false,
    },
    async () => {
      try {
        // 1. Capture framed screenshot
        const snap = await handleSnapCommand(context, { copyToClipboard: false, returnResult: true });
        if (!snap) throw new Error('Failed to capture bug screenshot');

        // 2. Query logcat crash snippet if Android
        let logcat = 'Logcat not applicable for iOS.';
        if (device.platform === 'android') {
          logcat = await androidDriver.getLogcatErrors(60, device.id);
          if (!logcat || logcat.trim().length === 0) {
            logcat = 'No recent fatal exception logs detected in logcat (*:E).';
          }
        }

        const outDir = resolveOutputDir();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const mdFileName = `bug-report-${timestamp}.md`;
        const mdFilePath = path.join(outDir, mdFileName);

        const markdownContent = `# 🐛 Mobile Bug Report
**Device**: ${device.model} (\`${device.id}\`)  
**Platform**: ${device.platform.toUpperCase()} (${device.type})  
**Captured At**: ${new Date().toLocaleString()}  

---

### 📸 Visual Evidence
![Bug Screenshot](./${snap.fileName})

---

### 💥 Recent Fatal Exceptions & Crash Logs
\`\`\`log
${logcat}
\`\`\`
`;

        await fs.writeFile(mdFilePath, markdownContent, 'utf-8');
        await vscode.env.clipboard.writeText(markdownContent);

        if (capturesProvider) capturesProvider.refresh();

        const action = await vscode.window.showInformationMessage(
          `🐛 Bug report created & copied to clipboard! (${mdFileName})`,
          'Open Markdown',
          'Reveal in Explorer'
        );

        if (action === 'Open Markdown') {
          const doc = await vscode.workspace.openTextDocument(mdFilePath);
          await vscode.window.showTextDocument(doc);
        } else if (action === 'Reveal in Explorer') {
          await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(mdFilePath));
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Bug Report Failed: ${err.message || err}`);
      }
    }
  );
}

/**
 * Register HoverProvider for Markdown documents to show rich image preview tooltips
 */
function registerMarkdownHoverProvider(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerHoverProvider('markdown', {
    provideHover(document, position) {
      const lineText = document.lineAt(position.line).text;
      const regex = /!\[(.*?)\]\((.*?)\)/g;
      let match;
      while ((match = regex.exec(lineText)) !== null) {
        const linkStart = match.index;
        const linkEnd = match.index + match[0].length;
        if (position.character >= linkStart && position.character <= linkEnd) {
          const label = match[1] || 'ADBSnap Image';
          const rawPath = match[2];
          const resolvedUri = rawPath.startsWith('http')
            ? rawPath
            : vscode.Uri.file(path.resolve(path.dirname(document.uri.fsPath), rawPath));

          const hoverContent = new vscode.MarkdownString();
          hoverContent.isTrusted = true;
          hoverContent.supportHtml = true;
          hoverContent.appendMarkdown(`**📸 ${label}**\n\n`);
          hoverContent.appendMarkdown(`![](${resolvedUri.toString()}|width=280)\n\n`);
          hoverContent.appendMarkdown(`[🎨 Open Studio](command:adbsnap.openStudio) &nbsp;|&nbsp; [📂 Reveal Folder](command:revealFileInOS?${encodeURIComponent(JSON.stringify(resolvedUri))})`);

          return new vscode.Hover(hoverContent, new vscode.Range(position.line, linkStart, position.line, linkEnd));
        }
      }
      return null;
    },
  });

  context.subscriptions.push(provider);
}
