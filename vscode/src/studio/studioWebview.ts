import * as vscode from 'vscode';
import path from 'node:path';
import fs from 'node:fs/promises';
import { androidDriver } from '../../../lib/adb';
import { runAdbSnapCli } from '../cli';
import { copyImageBufferToClipboard } from '../clipboard';
import type { AdbStatusBarManager } from '../statusBar';

export class StudioWebviewManager {
  private static currentPanel: vscode.WebviewPanel | null = null;

  public static createOrShow(
    context: vscode.ExtensionContext,
    statusBarManager: AdbStatusBarManager,
    resolveOutputDir: () => string,
    onCaptureSaved?: () => void
  ): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (StudioWebviewManager.currentPanel) {
      StudioWebviewManager.currentPanel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'adbsnapStudio',
      'ADBSnap Studio 🎨',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(context.extensionPath)],
      }
    );

    StudioWebviewManager.currentPanel = panel;

    panel.webview.html = StudioWebviewManager.getHtmlForWebview();

    panel.onDidDispose(() => {
      StudioWebviewManager.currentPanel = null;
    });

    // Handle messages from the Webview
    panel.webview.onDidReceiveMessage(async (message) => {
      const activeDevice = statusBarManager.getActiveDevice();

      switch (message.command) {
        case 'init': {
          const devices = await androidDriver.listDevices();
          panel.webview.postMessage({
            type: 'state',
            devices,
            activeDeviceId: activeDevice?.id || null,
          });
          break;
        }

        case 'refreshDevices': {
          const devices = await statusBarManager.refresh();
          panel.webview.postMessage({
            type: 'state',
            devices,
            activeDeviceId: statusBarManager.getActiveDevice()?.id || null,
          });
          break;
        }

        case 'capture': {
          if (!activeDevice || !activeDevice.isAuthorized) {
            vscode.window.showErrorMessage('ADBSnap: No authorized device available to capture.');
            panel.webview.postMessage({ type: 'captureError', message: 'Device not ready' });
            return;
          }

          try {
            panel.webview.postMessage({ type: 'busy', isBusy: true, message: 'Capturing from device...' });
            const outDir = resolveOutputDir();
            await fs.mkdir(outDir, { recursive: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const tempFile = path.join(outDir, `adbsnap-temp-${timestamp}.png`);

            const cliArgs = [
              'snap',
              '--frame', message.frame || 'iphone-16-pro',
              '--theme', message.theme || 'aurora',
              '--device', activeDevice.id,
              '--out', tempFile,
            ];

            if (message.title) cliArgs.push('--title', message.title);
            if (message.subtitle) cliArgs.push('--subtitle', message.subtitle);

            const result = await runAdbSnapCli(context.extensionPath, cliArgs, 35000);

            if (result.exitCode !== 0) {
              throw new Error(result.stderr || result.stdout || 'Capture failed');
            }

            const imageBuffer = await fs.readFile(tempFile);
            const base64Data = imageBuffer.toString('base64');

            panel.webview.postMessage({
              type: 'previewImage',
              dataUrl: `data:image/png;base64,${base64Data}`,
              filePath: tempFile,
            });

            if (onCaptureSaved) onCaptureSaved();
          } catch (err: any) {
            vscode.window.showErrorMessage(`Capture failed: ${err.message || err}`);
            panel.webview.postMessage({ type: 'captureError', message: err.message || String(err) });
          } finally {
            panel.webview.postMessage({ type: 'busy', isBusy: false });
          }
          break;
        }

        case 'copyToClipboard': {
          if (!message.filePath) {
            vscode.window.showWarningMessage('ADBSnap: Please capture an image first before copying.');
            return;
          }

          try {
            const buf = await fs.readFile(message.filePath);
            await copyImageBufferToClipboard(buf);
            vscode.window.showInformationMessage('📸 ADBSnap: Framed graphic copied to clipboard!');
          } catch (err: any) {
            vscode.window.showErrorMessage(`Copy failed: ${err.message || err}`);
          }
          break;
        }

        case 'saveAsset': {
          if (!message.filePath) {
            vscode.window.showWarningMessage('ADBSnap: Please capture an image first.');
            return;
          }
          vscode.window.showInformationMessage(`📸 Asset saved: ${path.basename(message.filePath)}`);
          break;
        }
      }
    });
  }

  private static getHtmlForWebview(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ADBSnap Studio</title>
  <style>
    :root {
      --bg-dark: #0f111a;
      --panel-bg: #161925;
      --card-bg: #1e2235;
      --border-color: #2b3049;
      --accent: #6366f1;
      --accent-hover: #4f46e5;
      --cyan: #06b6d4;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body {
      background: var(--bg-dark);
      color: var(--text);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    /* Controls Panel */
    .controls {
      width: 360px;
      min-width: 340px;
      background: var(--panel-bg);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .controls-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .controls-header h2 {
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #a5b4fc, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 999px;
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #334155;
    }
    .controls-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }
    input[type="text"], select {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      color: var(--text);
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="text"]:focus, select:focus {
      border-color: var(--accent);
    }
    /* Theme Swatches */
    .theme-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .theme-btn {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      padding: 8px 10px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text);
      font-size: 12px;
      transition: all 0.2s;
    }
    .theme-btn.active {
      border-color: var(--accent);
      background: #282e47;
    }
    .swatch {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    /* Frame Buttons */
    .frame-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .frame-btn {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      padding: 10px;
      border-radius: 8px;
      color: var(--text);
      font-size: 11px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .frame-btn.active {
      border-color: var(--cyan);
      background: #182e3f;
      color: #38bdf8;
    }
    /* Action Buttons */
    .actions-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .btn {
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--accent), var(--cyan));
      color: #fff;
    }
    .btn-primary:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: var(--card-bg);
      color: var(--text);
      border: 1px solid var(--border-color);
    }
    .btn-secondary:hover {
      background: #252b42;
    }
    /* Canvas / Preview Stage */
    .canvas-stage {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px;
      background: radial-gradient(circle at center, #1b2033 0%, #0d0f17 100%);
      position: relative;
      overflow: hidden;
    }
    .preview-container {
      max-height: 85vh;
      max-width: 90%;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
    }
    .preview-container img {
      max-height: 82vh;
      max-width: 100%;
      display: block;
      object-fit: contain;
    }
    .placeholder-box {
      border: 2px dashed #333a56;
      border-radius: 16px;
      padding: 60px 40px;
      text-align: center;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .placeholder-box svg {
      width: 48px;
      height: 48px;
      stroke: #475569;
    }
    /* Spinner */
    .spinner {
      display: none;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>

  <!-- Controls Sidebar -->
  <div class="controls">
    <div class="controls-header">
      <h2>📸 ADBSnap Studio</h2>
      <span class="badge" id="deviceBadge">Scanning...</span>
    </div>

    <div class="controls-body">
      <!-- Device Bezel Frame -->
      <div class="form-group">
        <label>Device Frame</label>
        <div class="frame-grid">
          <div class="frame-btn active" data-frame="iphone-16-pro">iPhone 16 Pro</div>
          <div class="frame-btn" data-frame="pixel-9-pro">Pixel 9 Pro</div>
          <div class="frame-btn" data-frame="minimal">Minimalist</div>
        </div>
      </div>

      <!-- Theme Preset -->
      <div class="form-group">
        <label>Backdrop Gradient</label>
        <div class="theme-grid">
          <div class="theme-btn active" data-theme="aurora">
            <span class="swatch" style="background: linear-gradient(135deg, #4f46e5, #06b6d4);"></span> Aurora
          </div>
          <div class="theme-btn" data-theme="studioLight">
            <span class="swatch" style="background: linear-gradient(135deg, #f8f9fa, #cbd5e1);"></span> Studio Light
          </div>
          <div class="theme-btn" data-theme="midnight">
            <span class="swatch" style="background: linear-gradient(135deg, #090d16, #1e293b);"></span> Midnight
          </div>
          <div class="theme-btn" data-theme="sunset">
            <span class="swatch" style="background: linear-gradient(135deg, #e11d48, #f59e0b);"></span> Sunset
          </div>
          <div class="theme-btn" data-theme="freshMint">
            <span class="swatch" style="background: linear-gradient(135deg, #059669, #10b981);"></span> Fresh Mint
          </div>
          <div class="theme-btn" data-theme="royal">
            <span class="swatch" style="background: linear-gradient(135deg, #4338ca, #3b82f6);"></span> Royal
          </div>
        </div>
      </div>

      <!-- Headlines -->
      <div class="form-group">
        <label>Showcase Headline</label>
        <input type="text" id="headlineInput" placeholder="e.g. Master Your Daily Routine" value="" />
      </div>

      <div class="form-group">
        <label>Subtitle</label>
        <input type="text" id="subtitleInput" placeholder="e.g. Simple. Fast. Beautiful." value="" />
      </div>
    </div>

    <!-- Actions -->
    <div class="actions-footer">
      <button class="btn btn-primary" id="captureBtn">
        <span class="spinner" id="btnSpinner"></span>
        <span id="btnText">📸 Capture Live Device</span>
      </button>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button class="btn btn-secondary" id="copyBtn">📋 Copy</button>
        <button class="btn btn-secondary" id="saveBtn">💾 Save Asset</button>
      </div>
    </div>
  </div>

  <!-- Stage / Canvas -->
  <div class="canvas-stage">
    <div class="preview-container" id="previewContainer">
      <div class="placeholder-box" id="placeholder">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <div>
          <h3 style="font-size: 15px; margin-bottom: 6px; color: #cbd5e1;">Live Showcase Preview</h3>
          <p style="font-size: 13px;">Click <b>Capture Live Device</b> to pull your screen buffer into 4K vectors.</p>
        </div>
      </div>
      <img id="previewImage" style="display: none;" alt="Showcase Preview" />
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentFrame = 'iphone-16-pro';
    let currentTheme = 'aurora';
    let lastSavedPath = null;

    // Elements
    const deviceBadge = document.getElementById('deviceBadge');
    const headlineInput = document.getElementById('headlineInput');
    const subtitleInput = document.getElementById('subtitleInput');
    const captureBtn = document.getElementById('captureBtn');
    const btnSpinner = document.getElementById('btnSpinner');
    const btnText = document.getElementById('btnText');
    const copyBtn = document.getElementById('copyBtn');
    const saveBtn = document.getElementById('saveBtn');
    const previewContainer = document.getElementById('previewContainer');
    const placeholder = document.getElementById('placeholder');
    const previewImage = document.getElementById('previewImage');

    // Init
    vscode.postMessage({ command: 'init' });

    // Frame selection
    document.querySelectorAll('.frame-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFrame = btn.dataset.frame;
      });
    });

    // Theme selection
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTheme = btn.dataset.theme;
      });
    });

    // Trigger Capture
    captureBtn.addEventListener('click', () => {
      vscode.postMessage({
        command: 'capture',
        frame: currentFrame,
        theme: currentTheme,
        title: headlineInput.value.trim(),
        subtitle: subtitleInput.value.trim()
      });
    });

    // Copy
    copyBtn.addEventListener('click', () => {
      if (lastSavedPath) {
        vscode.postMessage({ command: 'copyToClipboard', filePath: lastSavedPath });
      } else {
        alert('Please capture a graphic first!');
      }
    });

    // Save
    saveBtn.addEventListener('click', () => {
      if (lastSavedPath) {
        vscode.postMessage({ command: 'saveAsset', filePath: lastSavedPath });
      } else {
        alert('Please capture a graphic first!');
      }
    });

    // Incoming messages
    window.addEventListener('message', event => {
      const msg = event.data;

      switch (msg.type) {
        case 'state':
          if (msg.devices && msg.devices.length > 0) {
            const active = msg.devices.find(d => d.id === msg.activeDeviceId) || msg.devices[0];
            deviceBadge.textContent = active.model + ' (' + active.type.toUpperCase() + ')';
            deviceBadge.style.color = '#38bdf8';
          } else {
            deviceBadge.textContent = 'No Device';
            deviceBadge.style.color = '#f87171';
          }
          break;

        case 'busy':
          if (msg.isBusy) {
            btnSpinner.style.display = 'inline-block';
            btnText.textContent = msg.message || 'Processing...';
            captureBtn.disabled = true;
          } else {
            btnSpinner.style.display = 'none';
            btnText.textContent = '📸 Capture Live Device';
            captureBtn.disabled = false;
          }
          break;

        case 'previewImage':
          placeholder.style.display = 'none';
          previewImage.style.display = 'block';
          previewImage.src = msg.dataUrl;
          lastSavedPath = msg.filePath;
          break;

        case 'captureError':
          btnSpinner.style.display = 'none';
          btnText.textContent = '📸 Capture Live Device';
          captureBtn.disabled = false;
          break;
      }
    });
  </script>
</body>
</html>`;
  }
}
