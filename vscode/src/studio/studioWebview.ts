import * as vscode from 'vscode';
import path from 'node:path';
import net from 'node:net';
import { spawn, type ChildProcess } from 'node:child_process';
import type { AdbStatusBarManager } from '../statusBar';
import { resolveNodeBinary } from '../cli';

/**
 * Checks if a TCP port is currently open and responding.
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port, '127.0.0.1');
  });
}

/**
 * Finds the first available port starting from startPort.
 */
async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
    if (port > startPort + 50) break;
  }
  return port;
}

/**
 * Polls the studio server until it responds with 200 OK or times out.
 */
async function waitForStudioServer(port: number, timeoutMs = 7000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/devices`, {
        signal: AbortSignal.timeout(500),
      });
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

export class StudioWebviewManager {
  private static currentPanel: vscode.WebviewPanel | null = null;
  private static studioProcess: ChildProcess | null = null;
  private static activePort: number | null = null;
  private static isStarting = false;

  public static async createOrShow(
    context: vscode.ExtensionContext,
    statusBarManager: AdbStatusBarManager,
    resolveOutputDir: () => string,
    onCaptureSaved?: () => void
  ): Promise<void> {
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

    // Show initial loading splash
    panel.webview.html = StudioWebviewManager.getLoadingHtml();

    panel.onDidDispose(() => {
      StudioWebviewManager.currentPanel = null;
    });

    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'openExternal' && message.url) {
        vscode.env.openExternal(vscode.Uri.parse(message.url));
      } else if (message.command === 'reload') {
        if (StudioWebviewManager.activePort) {
          panel.webview.html = StudioWebviewManager.getStudioIframeHtml(StudioWebviewManager.activePort);
        }
      } else if (message.command === 'copied') {
        vscode.window.setStatusBarMessage('✨ ADBSnap mockup copied to clipboard! Ready to paste into Figma, Slack, or PR.', 3500);
      }
    });

    // Start or reuse embedded studio server
    try {
      const port = await StudioWebviewManager.ensureStudioServer(context);
      StudioWebviewManager.activePort = port;
      panel.webview.html = StudioWebviewManager.getStudioIframeHtml(port);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      panel.webview.html = StudioWebviewManager.getErrorHtml(errMsg);
    }
  }

  /**
   * Ensures the local ADBSnap studio server is alive and returns the listening port.
   */
  private static async ensureStudioServer(context: vscode.ExtensionContext): Promise<number> {
    // 1. If we already have a live port, verify it
    if (StudioWebviewManager.activePort) {
      const alive = await waitForStudioServer(StudioWebviewManager.activePort, 800);
      if (alive) return StudioWebviewManager.activePort;
    }

    // 2. Check if a default instance is already listening on 3000
    if (await waitForStudioServer(3000, 400)) {
      StudioWebviewManager.activePort = 3000;
      return 3000;
    }

    // 3. Find an available port starting at 3300
    const targetPort = await findAvailablePort(3300);

    // 4. Resolve the CLI executable to launch the studio server
    const bundledCli = path.resolve(context.extensionPath, 'dist', 'bin', 'cli.js');
    const localCli = path.resolve(context.extensionPath, '..', 'dist', 'bin', 'cli.js');
    const localSrcCli = path.resolve(context.extensionPath, '..', 'bin', 'cli.ts');
    const rootDir = (await fileExists(path.resolve(context.extensionPath, '..', 'package.json')))
      ? path.resolve(context.extensionPath, '..')
      : context.extensionPath;

    const nodeBin = resolveNodeBinary();
    let cmd = nodeBin;
    let args: string[] = [];

    if (await fileExists(bundledCli)) {
      cmd = nodeBin;
      args = [bundledCli, 'studio', '--port', String(targetPort), '--no-open'];
    } else if (await fileExists(localCli)) {
      cmd = nodeBin;
      args = [localCli, 'studio', '--port', String(targetPort), '--no-open'];
    } else if (await fileExists(localSrcCli)) {
      const tsxBin = path.resolve(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
      cmd = tsxBin;
      args = [localSrcCli, 'studio', '--port', String(targetPort), '--no-open'];
    } else {
      cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      args = ['adbsnap', 'studio', '--port', String(targetPort), '--no-open'];
    }

    // Terminate any previous dead child process
    if (StudioWebviewManager.studioProcess) {
      try {
        StudioWebviewManager.studioProcess.kill();
      } catch {}
      StudioWebviewManager.studioProcess = null;
    }

    const child = spawn(cmd, args, {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
      windowsHide: true,
      shell: process.platform === 'win32' && (cmd.endsWith('.cmd') || cmd.endsWith('.bat')),
    });

    StudioWebviewManager.studioProcess = child;

    child.on('error', (err) => {
      console.error('ADBSnap Studio server process error:', err);
    });

    child.on('exit', () => {
      if (StudioWebviewManager.studioProcess === child) {
        StudioWebviewManager.studioProcess = null;
        StudioWebviewManager.activePort = null;
      }
    });

    // Wait until HTTP server responds
    const isUp = await waitForStudioServer(targetPort, 8000);
    if (!isUp) {
      throw new Error(`Studio server failed to start on port ${targetPort} within 8 seconds.`);
    }

    return targetPort;
  }

  /**
   * Generates the VS Code Webview HTML containing the full React 19 Studio.
   */
  private static getStudioIframeHtml(port: number): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src http://127.0.0.1:* http://localhost:*; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: https: http://127.0.0.1:* http://localhost:*; connect-src http://127.0.0.1:* http://localhost:*; font-src data: https:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ADBSnap Studio</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #090a0f;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 38px;
      padding: 0 14px;
      background: #11141c;
      border-bottom: 1px solid #1f2433;
      color: #94a3b8;
      font-size: 12px;
      user-select: none;
    }
    .status-badge {
      display: flex;
      align-items: center;
      gap: 7px;
      font-weight: 600;
      color: #38bdf8;
      letter-spacing: -0.01em;
    }
    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite ease-in-out;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.9); }
    }
    .port-label {
      font-size: 11px;
      font-weight: 400;
      color: #64748b;
      margin-left: 4px;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn {
      background: #1a1f2c;
      color: #e2e8f0;
      border: 1px solid #2d3748;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
    }
    .btn:hover {
      background: #283347;
      border-color: #4a5568;
      color: #ffffff;
    }
    .frame-wrapper {
      width: 100%;
      height: calc(100% - 38px);
      position: relative;
      background: #090a0f;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="status-badge">
      <div class="live-dot"></div>
      <span>ADBSnap Studio</span>
      <span class="port-label">(:${port})</span>
    </div>
    <div class="controls">
      <button class="btn" onclick="reloadStudio()" title="Reload canvas state">
        <span>🔄</span> Reload
      </button>
      <button class="btn" onclick="openInBrowser()" title="Open studio in your full desktop browser">
        <span>🌐</span> Open in Browser
      </button>
    </div>
  </div>
  <div class="frame-wrapper">
    <iframe id="studio-iframe" src="http://127.0.0.1:${port}/" allow="clipboard-read; clipboard-write"></iframe>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    function reloadStudio() {
      const frame = document.getElementById('studio-iframe');
      if (frame) frame.src = frame.src;
    }
    function openInBrowser() {
      vscode.postMessage({ command: 'openExternal', url: 'http://127.0.0.1:${port}/' });
    }
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'adbsnap-copied') {
        vscode.postMessage({ command: 'copied' });
      }
    });
  </script>
</body>
</html>`;
  }

  private static getLoadingHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #090a0f;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(56, 189, 248, 0.2);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h3 { margin: 0 0 6px 0; font-size: 15px; font-weight: 600; }
    p { margin: 0; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h3>Launching ADBSnap Studio...</h3>
  <p>Connecting live visual canvas engine...</p>
</body>
</html>`;
  }

  private static getErrorHtml(error: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #090a0f;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 24px;
      text-align: center;
    }
    .error-card {
      background: #161a24;
      border: 1px solid #ef4444;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
    }
    h3 { margin: 0 0 8px 0; color: #f87171; }
    p { font-size: 13px; color: #cbd5e1; margin-bottom: 16px; word-break: break-all; }
    button {
      background: #ef4444;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="error-card">
    <h3>Studio Launch Error</h3>
    <p>${error}</p>
    <button onclick="location.reload()">Retry</button>
  </div>
</body>
</html>`;
  }

  public static dispose(): void {
    if (StudioWebviewManager.studioProcess) {
      try {
        StudioWebviewManager.studioProcess.kill();
      } catch {}
      StudioWebviewManager.studioProcess = null;
    }
    StudioWebviewManager.activePort = null;
    if (StudioWebviewManager.currentPanel) {
      StudioWebviewManager.currentPanel.dispose();
      StudioWebviewManager.currentPanel = null;
    }
  }
}

async function fileExists(p: string): Promise<boolean> {
  try {
    const fs = await import('node:fs/promises');
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
