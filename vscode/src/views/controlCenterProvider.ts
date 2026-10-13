import * as vscode from 'vscode';
import path from 'node:path';
import type { ConnectedDevice } from '../../../lib/driver';
import type { AdbStatusBarManager } from '../statusBar';

export interface ControlCenterState {
  activeDevice: {
    id: string;
    model: string;
    platform: string;
    type: string;
    isAuthorized: boolean;
  } | null;
  recentWifiEndpoints: string[];
  lastWifiEndpoint: string | null;
  settings: {
    defaultTheme: string;
    defaultFrame: string;
    defaultFormat: string;
    defaultAspectRatio: string;
    outputDirectory: string;
  };
}

export class ControlCenterViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'adbsnap.controlCenterView';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly statusBarManager: AdbStatusBarManager,
    private readonly resolveOutputDir: () => string
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(this.context.extensionPath)],
    };

    webviewView.webview.html = this.getHtmlContent();

    // Listen to messages from webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'snap':
          await vscode.commands.executeCommand('adbsnap.snap');
          break;
        case 'snapAs':
          await vscode.commands.executeCommand('adbsnap.snapAs');
          break;
        case 'snapClipboard':
          await vscode.commands.executeCommand('adbsnap.snapClipboard');
          break;
        case 'recordScreen':
          await vscode.commands.executeCommand('adbsnap.recordScreen');
          break;
        case 'explore':
          await vscode.commands.executeCommand('adbsnap.explore');
          break;
        case 'openStudio':
          await vscode.commands.executeCommand('adbsnap.openStudio');
          break;
        case 'reconnect':
          await vscode.commands.executeCommand('adbsnap.reconnectDevice', message.endpoint);
          break;
        case 'connectIp':
          await vscode.commands.executeCommand('adbsnap.connectIp');
          break;
        case 'wifi':
          await vscode.commands.executeCommand('adbsnap.wifi');
          break;
        case 'disconnectWifi':
          await vscode.commands.executeCommand('adbsnap.disconnectWifi');
          break;
        case 'devices':
          await vscode.commands.executeCommand('adbsnap.devices');
          break;
        case 'key':
          await vscode.commands.executeCommand(`adbsnap.key${message.key}`);
          break;
        case 'selectOutputDir':
          await vscode.commands.executeCommand('adbsnap.selectOutputDir');
          break;
        case 'revealOutputDir':
          await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(this.resolveOutputDir()));
          break;
        case 'updateSetting': {
          const config = vscode.workspace.getConfiguration('adbsnap');
          await config.update(message.key, message.value, vscode.ConfigurationTarget.Global);
          this.refresh();
          break;
        }
      }
    });

    // Send initial state to webview
    this.refresh();
  }

  public refresh(): void {
    if (!this._view) return;
    const state = this.getCurrentState();
    this._view.webview.postMessage({ type: 'updateState', state });
  }

  private getCurrentState(): ControlCenterState {
    const active = this.statusBarManager.getActiveDevice();
    const config = vscode.workspace.getConfiguration('adbsnap');
    const recentWifi = this.context.globalState.get<string[]>('adbsnap.recentWifiEndpoints') || [];
    const lastWifi = this.statusBarManager.getLastWirelessEndpoint() || this.context.globalState.get<string>('adbsnap.lastWifiEndpoint') || null;

    return {
      activeDevice: active
        ? {
            id: active.id,
            model: active.model,
            platform: active.platform,
            type: active.type,
            isAuthorized: active.isAuthorized,
          }
        : null,
      recentWifiEndpoints: recentWifi,
      lastWifiEndpoint: lastWifi,
      settings: {
        defaultTheme: config.get<string>('defaultTheme') || 'aurora',
        defaultFrame: config.get<string>('defaultFrame') || 'iphone-16-pro',
        defaultFormat: config.get<string>('defaultFormat') || 'png',
        defaultAspectRatio: config.get<string>('defaultAspectRatio') || 'portrait',
        outputDirectory: this.resolveOutputDir(),
      },
    };
  }

  private getHtmlContent(): string {
    const initialState = JSON.stringify(this.getCurrentState());

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ADBSnap Control Center</title>
  <style>
    :root {
      --font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
      --bg-color: var(--vscode-sideBar-background, #18181b);
      --text-color: var(--vscode-foreground, #e4e4e7);
      --text-muted: var(--vscode-descriptionForeground, #a1a1aa);
      --card-bg: var(--vscode-editor-background, #202023);
      --border-color: var(--vscode-widget-border, rgba(255, 255, 255, 0.08));
      --btn-bg: var(--vscode-button-background, #6366f1);
      --btn-fg: var(--vscode-button-foreground, #ffffff);
      --btn-hover: var(--vscode-button-hoverBackground, #4f46e5);
      --btn-sec-bg: var(--vscode-button-secondaryBackground, #27272a);
      --btn-sec-fg: var(--vscode-button-secondaryForeground, #e4e4e7);
      --btn-sec-hover: var(--vscode-button-secondaryHoverBackground, #3f3f46);
      --input-bg: var(--vscode-input-background, #18181b);
      --input-fg: var(--vscode-input-foreground, #ffffff);
      --input-border: var(--vscode-input-border, rgba(255, 255, 255, 0.15));
      --badge-bg: var(--vscode-badge-background, #4f46e5);
      --badge-fg: var(--vscode-badge-foreground, #ffffff);
      --accent-green: #10b981;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font-family);
      background-color: var(--bg-color);
      color: var(--text-color);
      padding: 10px 8px;
      font-size: 12px;
      line-height: 1.4;
      user-select: none;
    }

    .section-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin: 12px 0 6px 2px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 8px;
    }

    /* Device Status Card */
    .device-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 6px;
    }

    .device-info {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .status-dot.online { background: var(--accent-green); box-shadow: 0 0 6px rgba(16, 185, 129, 0.6); }
    .status-dot.offline { background: var(--accent-amber); }
    .status-dot.none { background: var(--text-muted); }

    .device-name {
      font-weight: 600;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .badge {
      font-size: 9px;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-wifi { background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); }
    .badge-usb { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-offline { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }

    .device-sub {
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .btn-row {
      display: flex;
      gap: 4px;
    }

    button {
      font-family: inherit;
      font-size: 11px;
      font-weight: 500;
      border: 1px solid transparent;
      border-radius: 4px;
      padding: 5px 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      transition: background 0.15s ease, transform 0.05s ease;
      white-space: nowrap;
    }
    button:active { transform: scale(0.98); }

    .btn-primary {
      background: var(--btn-bg);
      color: var(--btn-fg);
    }
    .btn-primary:hover { background: var(--btn-hover); }

    .btn-sec {
      background: var(--btn-sec-bg);
      color: var(--btn-sec-fg);
      border-color: var(--border-color);
    }
    .btn-sec:hover { background: var(--btn-sec-hover); }

    .btn-reconnect {
      background: #047857;
      color: #ffffff;
      font-weight: 600;
      width: 100%;
      padding: 7px 10px;
      margin-top: 6px;
    }
    .btn-reconnect:hover { background: #059669; }

    /* Action Grid */
    .action-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      margin-bottom: 8px;
    }
    .action-grid button {
      padding: 7px 6px;
      font-size: 11px;
    }

    /* Preset Selectors */
    .form-group {
      margin-bottom: 7px;
    }
    .form-label {
      font-size: 10px;
      color: var(--text-muted);
      margin-bottom: 2px;
      display: block;
    }
    select {
      width: 100%;
      font-family: inherit;
      font-size: 11px;
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 4px;
      padding: 4px 6px;
      outline: none;
      cursor: pointer;
    }
    select:focus { border-color: var(--btn-bg); }

    /* Output Folder pill */
    .folder-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--input-bg);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 4px 6px;
      font-size: 11px;
      gap: 6px;
    }
    .folder-path {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      direction: rtl;
      text-align: left;
      color: var(--text-muted);
      flex: 1;
    }

    /* Hardware Remote D-Pad */
    .remote-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      margin-bottom: 8px;
    }
    .remote-btn {
      padding: 6px 2px;
      font-size: 10px;
      flex-direction: column;
      gap: 2px;
    }

    /* Studio Banner */
    .studio-btn {
      width: 100%;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: white;
      font-weight: 600;
      padding: 8px 10px;
      border: none;
      box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
    }
    .studio-btn:hover {
      background: linear-gradient(135deg, #4338ca, #0891b2);
    }
  </style>
</head>
<body>

  <!-- ACTIVE DEVICE SECTION -->
  <div class="card" id="deviceCard">
    <div class="device-header">
      <div class="device-info">
        <span class="status-dot" id="deviceDot"></span>
        <span class="device-name" id="deviceName">Searching devices...</span>
      </div>
      <span class="badge" id="deviceBadge">--</span>
    </div>

    <div class="device-sub" id="deviceSub">
      <span id="deviceIdText">Checking ADB...</span>
    </div>

    <!-- Reconnect Banner (Dynamic) -->
    <div id="reconnectArea" style="display: none;"></div>

    <div class="btn-row" style="margin-top: 6px;">
      <button class="btn-sec" style="flex: 1;" onclick="send('devices')">📱 Devices</button>
      <button class="btn-sec" style="flex: 1;" onclick="send('connectIp')">📶 Wi-Fi IP</button>
    </div>
  </div>

  <!-- QUICK CAPTURE ACTIONS -->
  <div class="section-title">Quick Actions</div>
  <div class="action-grid">
    <button class="btn-primary" onclick="send('snap')">📸 Quick Snap</button>
    <button class="btn-sec" onclick="send('snapClipboard')">📋 To Clipboard</button>
    <button class="btn-sec" onclick="send('snapAs')">💾 Snap As...</button>
    <button class="btn-sec" onclick="send('explore')">🕷️ Crawl Tabs</button>
  </div>
  <div class="btn-row" style="margin-bottom: 8px;">
    <button class="btn-sec" style="flex: 1;" onclick="send('recordScreen')">🎥 Record Screen</button>
    <button class="studio-btn" style="flex: 1.2;" onclick="send('openStudio')">🎨 Asset Studio</button>
  </div>

  <!-- PRESET TUNER -->
  <div class="section-title">Canvas Tuning</div>
  <div class="card">
    <div class="form-group">
      <label class="form-label">Device Chassis Bezel</label>
      <select id="selectFrame" onchange="updateSetting('defaultFrame', this.value)">
        <option value="iphone-16-pro-max">iPhone 16 Pro Max (6.9")</option>
        <option value="iphone-16-pro">iPhone 16 Pro (6.3")</option>
        <option value="iphone-16">iPhone 16 Base</option>
        <option value="iphone-15-pro">iPhone 15 Pro</option>
        <option value="iphone-14">iPhone 14 Notch</option>
        <option value="pixel-9-pro-fold">Google Pixel 9 Pro Fold (8")</option>
        <option value="pixel-9-pro">Google Pixel 9 Pro</option>
        <option value="pixel-8">Google Pixel 8</option>
        <option value="galaxy-s25-ultra">Samsung Galaxy S25 Ultra</option>
        <option value="galaxy-s24-ultra">Samsung Galaxy S24 Ultra</option>
        <option value="galaxy-s24">Samsung Galaxy S24</option>
        <option value="ipad-pro-13">Apple iPad Pro 13" M4</option>
        <option value="android-tablet-10">Android Tablet 10"</option>
        <option value="minimal">Minimal Floating Bezel</option>
        <option value="none">No Bezel (Pure Screen)</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Backdrop Gradient Theme</label>
      <select id="selectTheme" onchange="updateSetting('defaultTheme', this.value)">
        <option value="aurora">Electric Aurora (Indigo ➔ Cyan ➔ Emerald)</option>
        <option value="studioLight">Apple Studio Light</option>
        <option value="freshMint">Fresh Mint (Teal ➔ Emerald)</option>
        <option value="sunset">Warm Sunset (Rose ➔ Amber)</option>
        <option value="midnight">Deep Midnight</option>
        <option value="royal">Royal Orchid (Violet ➔ Fuchsia)</option>
        <option value="cleanDark">Titanium Dark</option>
        <option value="cyberpunk">Cyberpunk Neon</option>
        <option value="pastelDream">Pastel Dream</option>
        <option value="slate">Minimal Slate</option>
        <option value="emerald">Emerald Forest</option>
        <option value="crimson">Crimson Blaze</option>
        <option value="oceanic">Oceanic Blue</option>
        <option value="amethyst">Deep Amethyst</option>
        <option value="monochrome">Pure Monochrome</option>
        <option value="transparent">Transparent Canvas</option>
      </select>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
      <div class="form-group">
        <label class="form-label">Aspect Ratio</label>
        <select id="selectAspect" onchange="updateSetting('defaultAspectRatio', this.value)">
          <option value="portrait">📱 Portrait 9:19.5</option>
          <option value="landscape">🖥️ Landscape 16:9</option>
          <option value="square">🔲 Square 1:1</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Format</label>
        <select id="selectFormat" onchange="updateSetting('defaultFormat', this.value)">
          <option value="png">PNG (Lossless)</option>
          <option value="webp">WebP (42% smaller)</option>
          <option value="avif">AVIF (95% smaller)</option>
          <option value="jpeg">JPEG</option>
        </select>
      </div>
    </div>

    <div class="form-group" style="margin-bottom: 0;">
      <label class="form-label">Output Directory</label>
      <div class="folder-pill">
        <span class="folder-path" id="outputPathText">/output</span>
        <button class="btn-sec" style="padding: 2px 5px;" onclick="send('selectOutputDir')">📁 Change</button>
        <button class="btn-sec" style="padding: 2px 5px;" onclick="send('revealOutputDir')">↗ Open</button>
      </div>
    </div>
  </div>

  <!-- REMOTE HARDWARE CONTROLLER -->
  <div class="section-title">Remote Phone Controls</div>
  <div class="remote-grid">
    <button class="btn-sec remote-btn" onclick="send('key', { key: 'Back' })">
      <span>◀</span>
      <span>Back</span>
    </button>
    <button class="btn-sec remote-btn" onclick="send('key', { key: 'Home' })">
      <span>🔘</span>
      <span>Home</span>
    </button>
    <button class="btn-sec remote-btn" onclick="send('key', { key: 'Recents' })">
      <span>🔲</span>
      <span>Recents</span>
    </button>
    <button class="btn-sec remote-btn" onclick="send('key', { key: 'Power' })">
      <span>🔒</span>
      <span>Power</span>
    </button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let state = ${initialState};

    function send(command, extra = {}) {
      vscode.postMessage({ command, ...extra });
    }

    function updateSetting(key, value) {
      send('updateSetting', { key, value });
    }

    function render() {
      const dev = state.activeDevice;
      const dot = document.getElementById('deviceDot');
      const name = document.getElementById('deviceName');
      const badge = document.getElementById('deviceBadge');
      const sub = document.getElementById('deviceIdText');
      const reconnectArea = document.getElementById('reconnectArea');

      if (dev) {
        dot.className = 'status-dot online';
        name.innerText = dev.model;
        sub.innerText = dev.id + (dev.isAuthorized ? ' • Ready' : ' • Unauthorized');
        if (dev.type === 'wifi') {
          badge.className = 'badge badge-wifi';
          badge.innerText = 'Wi-Fi';
        } else {
          badge.className = 'badge badge-usb';
          badge.innerText = 'USB';
        }
        reconnectArea.style.display = 'none';
      } else {
        // No active device
        const lastWifi = state.lastWifiEndpoint;
        if (lastWifi) {
          dot.className = 'status-dot offline';
          name.innerText = 'Wi-Fi Disconnected';
          sub.innerText = 'Last connected: ' + lastWifi;
          badge.className = 'badge badge-offline';
          badge.innerText = 'Offline';

          reconnectArea.style.display = 'block';
          reconnectArea.innerHTML = \`
            <button class="btn-reconnect" onclick="send('reconnect', { endpoint: '\${lastWifi}' })">
              🔄 Reconnect to \${lastWifi}
            </button>
          \`;
        } else {
          dot.className = 'status-dot none';
          name.innerText = 'No Device Connected';
          sub.innerText = 'Attach USB cable or connect via Wi-Fi IP';
          badge.className = 'badge';
          badge.innerText = 'None';
          reconnectArea.style.display = 'none';
        }
      }

      // Settings
      if (state.settings) {
        document.getElementById('selectFrame').value = state.settings.defaultFrame || 'iphone-16-pro';
        document.getElementById('selectTheme').value = state.settings.defaultTheme || 'aurora';
        document.getElementById('selectAspect').value = state.settings.defaultAspectRatio || 'portrait';
        document.getElementById('selectFormat').value = state.settings.defaultFormat || 'png';
        document.getElementById('outputPathText').innerText = state.settings.outputDirectory || './output';
      }
    }

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'updateState') {
        state = message.state;
        render();
      }
    });

    render();
  </script>
</body>
</html>`;
  }
}
