import * as vscode from 'vscode';
import path from 'node:path';
import fs from 'node:fs/promises';
import { androidDriver, resolveAdbPath } from '../../lib/adb';
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
    vscode.commands.registerCommand('adbsnap.disconnectWifi', async (item?: DeviceTreeItem | ConnectedDevice) => {
      await handleDisconnectWifiCommand(item);
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
}

export function deactivate() {
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

/**
 * Handles Framed Screenshot Capture via CLI delegation.
 * Shells out to `adbsnap snap` to avoid bundling sharp native binaries.
 */
async function handleSnapCommand(context: vscode.ExtensionContext, options: { copyToClipboard: boolean }): Promise<void> {
  const device = statusBarManager.getActiveDevice();
  if (!device) {
    vscode.window.showWarningMessage('ADBSnap: No connected ADB device found. Please attach a device or emulator.');
    return;
  }

  if (!device.isAuthorized) {
    vscode.window.showErrorMessage(`ADBSnap: Device "${device.model}" is unauthorized. Please accept the USB debugging prompt on the device.`);
    return;
  }

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

        const outDir = resolveOutputDir();
        await fs.mkdir(outDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `adbsnap-${frame}-${theme}-${timestamp}.png`;
        const filePath = path.join(outDir, fileName);

        // Delegate to the adbsnap CLI for compositing (avoids sharp native dependency)
        const cliArgs = [
          'snap',
          '--frame', frame,
          '--theme', theme,
          '--device', device.id,
          '--out', filePath,
        ];

        const result = await runAdbSnapCli(context.extensionPath, cliArgs, 30000);

        if (result.exitCode !== 0) {
          const errorMsg = result.stderr || result.stdout || 'Unknown CLI error';
          throw new Error(errorMsg.trim());
        }

        if (options.copyToClipboard) {
          // Read the saved file and copy to clipboard
          const imgBuffer = await fs.readFile(filePath);
          await copyImageBufferToClipboard(Buffer.from(imgBuffer));
          vscode.window.showInformationMessage('📸 ADBSnap: Framed screenshot copied to clipboard!');
          if (capturesProvider) {
            capturesProvider.refresh();
          }

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
      } catch (err: any) {
        vscode.window.showErrorMessage(`ADBSnap Capture Failed: ${err.message || err}`);
      }
    }
  );
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
      } catch (err: any) {
        vscode.window.showErrorMessage(`ADBSnap Raw Capture Failed: ${err.message || err}`);
      }
    }
  );
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
      const typeLabel = d.type === 'wifi' ? 'Wi-Fi' : d.type === 'emulator' ? 'Emulator' : 'USB';
      const statusIcon = d.isAuthorized ? '$(check)' : '$(alert)';
      items.push({
        label: `${statusIcon} ${d.model} (${typeLabel}) ${isCurrent ? '• Active' : ''}`,
        description: d.id,
        detail: d.isAuthorized ? `Status: Ready (${d.product})` : 'Status: Unauthorized - approve USB debugging on device',
        device: d,
      });
    }
  } else {
    items.push({
      label: '$(warning) No devices detected',
      description: 'Ensure USB debugging is enabled on your phone',
    });
  }

  items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });
  items.push({
    label: '$(refresh) Refresh Connected Devices',
    description: 'Re-scan USB and Wi-Fi ADB devices',
    action: 'refresh',
  });
  items.push({
    label: '$(radio-tower) Switch USB Device to Wireless (WiFi)',
    description: 'Set up wireless debugging over local network',
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
  const devices = await androidDriver.listDevices();
  const usbDevices = devices.filter((d) => d.type === 'usb' && d.isAuthorized);

  if (usbDevices.length === 0) {
    vscode.window.showWarningMessage('ADBSnap: No authorized USB device found. Please connect your phone via USB first to enable wireless mode.');
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
 * Disconnect Wi-Fi mode and revert back to USB
 */
async function handleDisconnectWifiCommand(targetDevice?: ConnectedDevice | DeviceTreeItem): Promise<void> {
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
    const devices = await androidDriver.listDevices();
    if (devices.length === 0) {
      outputChannel.appendLine('No attached Android devices detected.');
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
