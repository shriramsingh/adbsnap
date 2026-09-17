"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode5 = __toESM(require("vscode"));
var import_node_path6 = __toESM(require("node:path"));
var import_promises3 = __toESM(require("node:fs/promises"));

// ../lib/adb.ts
var import_node_child_process = require("node:child_process");
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_node_os = __toESM(require("node:os"), 1);

// ../constants/commands.ts
var ADB_COMMANDS = {
  DEVICES: ["devices", "-l"],
  SCREENCAP: ["exec-out", "screencap", "-p"],
  TCP_IP: (port) => ["tcpip", port.toString()],
  CONNECT: (ip, port) => ["connect", `${ip}:${port}`],
  PAIR: (ip, port, code) => ["pair", `${ip}:${port}`, code],
  WLAN_IP: ["shell", "ip", "-f", "inet", "addr", "show", "wlan0"],
  FOREGROUND_APP: ["shell", "dumpsys", "window"],
  FORCE_STOP: (pkg) => ["shell", "am", "force-stop", pkg],
  CLEAR_APP: (pkg) => ["shell", "pm", "clear", pkg],
  LAUNCH_APP: (pkg) => ["shell", "monkey", "-p", pkg, "-c", "android.intent.category.LAUNCHER", "1"],
  UIAUTOMATOR_DUMP: ["exec-out", "uiautomator", "dump", "/dev/tty"],
  INPUT_TAP: (x, y) => ["shell", "input", "tap", x.toString(), y.toString()],
  INPUT_TEXT: (escapedText) => ["shell", "input", "text", escapedText],
  INPUT_KEY: (keyCode) => ["shell", "input", "keyevent", keyCode.toString()],
  INPUT_SWIPE: (x1, y1, x2, y2, durationMs = 300) => [
    "shell",
    "input",
    "swipe",
    x1.toString(),
    y1.toString(),
    x2.toString(),
    y2.toString(),
    durationMs.toString()
  ]
};

// ../constants/config.ts
var CONFIG = {
  DEFAULT_PORT: 5555,
  DEFAULT_OUTPUT_DIR: "./output",
  DEFAULT_TIMEOUT_MS: 1e4,
  DEFAULT_DEVICE_FRAME: "minimal",
  ADB_DEFAULT_HOST: "127.0.0.1"
};

// ../lib/adb.ts
var cachedAdbPath = null;
function resolveAdbPath() {
  if (cachedAdbPath) return cachedAdbPath;
  if (process.env.ADB_PATH && import_node_fs.default.existsSync(process.env.ADB_PATH)) {
    cachedAdbPath = process.env.ADB_PATH;
    return cachedAdbPath;
  }
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (androidHome) {
    const adbExt = process.platform === "win32" ? "adb.exe" : "adb";
    const candidate = import_node_path.default.join(androidHome, "platform-tools", adbExt);
    if (import_node_fs.default.existsSync(candidate)) {
      cachedAdbPath = candidate;
      return cachedAdbPath;
    }
  }
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || import_node_path.default.join(import_node_os.default.homedir(), "AppData", "Local");
    const winCandidate = import_node_path.default.join(localAppData, "Android", "Sdk", "platform-tools", "adb.exe");
    if (import_node_fs.default.existsSync(winCandidate)) {
      cachedAdbPath = winCandidate;
      return cachedAdbPath;
    }
  } else if (process.platform === "darwin") {
    const macCandidate = import_node_path.default.join(import_node_os.default.homedir(), "Library", "Android", "sdk", "platform-tools", "adb");
    if (import_node_fs.default.existsSync(macCandidate)) {
      cachedAdbPath = macCandidate;
      return cachedAdbPath;
    }
  } else {
    const linuxCandidate = import_node_path.default.join(import_node_os.default.homedir(), "Android", "Sdk", "platform-tools", "adb");
    if (import_node_fs.default.existsSync(linuxCandidate)) {
      cachedAdbPath = linuxCandidate;
      return cachedAdbPath;
    }
  }
  cachedAdbPath = "adb";
  return cachedAdbPath;
}
var AndroidDriver = class {
  platform = "android";
  /**
   * Helper to execute adb commands with timeout and error handling.
   */
  async exec(args, timeoutMs = CONFIG.DEFAULT_TIMEOUT_MS) {
    const adbBinary = resolveAdbPath();
    return new Promise((resolve, reject) => {
      (0, import_node_child_process.execFile)(adbBinary, args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`ADB command "${adbBinary} ${args.join(" ")}" failed: ${stderr || err.message}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }
  /**
   * Discovers and parses all currently attached Android devices (USB, Wi-Fi, Emulator).
   */
  async listDevices() {
    const output = await this.exec(ADB_COMMANDS.DEVICES);
    const lines = output.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const devices = [];
    for (const line of lines) {
      if (line.startsWith("List of devices attached") || line.startsWith("* daemon")) {
        continue;
      }
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;
      const id = parts[0];
      const rawStatus = parts[1];
      const isAuthorized = rawStatus === "device";
      let model = id;
      let product = "generic";
      for (let i = 2; i < parts.length; i++) {
        const part = parts[i];
        if (part.startsWith("model:")) {
          model = part.replace("model:", "").replace(/_/g, " ");
        } else if (part.startsWith("product:")) {
          product = part.replace("product:", "");
        }
      }
      let type = "usb";
      if (id.includes(":")) {
        type = "wifi";
      } else if (id.startsWith("emulator-")) {
        type = "emulator";
      }
      devices.push({
        id,
        platform: "android",
        type,
        model,
        product,
        isAuthorized,
        rawStatus
      });
    }
    return devices;
  }
  /**
   * Captures raw screenshot directly into a memory Buffer via `adb exec-out screencap -p`.
   * Zero temporary files are written to the mobile device or host disk.
   */
  async captureScreenshot(deviceId) {
    let targetId = deviceId;
    if (!targetId) {
      try {
        const devices = await this.listDevices();
        const ready = devices.find((d) => d.isAuthorized);
        if (ready) targetId = ready.id;
      } catch {
      }
    }
    const args = targetId ? ["-s", targetId, ...ADB_COMMANDS.SCREENCAP] : ADB_COMMANDS.SCREENCAP;
    const adbBinary = resolveAdbPath();
    return new Promise((resolve, reject) => {
      (0, import_node_child_process.execFile)(
        adbBinary,
        args,
        {
          encoding: "buffer",
          maxBuffer: 50 * 1024 * 1024,
          timeout: CONFIG.DEFAULT_TIMEOUT_MS
        },
        (err, stdout, stderr) => {
          if (err) {
            reject(new Error(`Screenshot capture failed: ${stderr ? stderr.toString() : err.message}`));
          } else {
            if (!stdout || stdout.length === 0) {
              reject(new Error("Received empty screenshot buffer from ADB."));
              return;
            }
            resolve(stdout);
          }
        }
      );
    });
  }
  /**
   * Extracts the internal local Wi-Fi IP address of an attached device.
   */
  async getDeviceIp(deviceId) {
    const args = ["-s", deviceId, ...ADB_COMMANDS.WLAN_IP];
    const output = await this.exec(args);
    const match = output.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
    if (!match || !match[1]) {
      throw new Error(`Unable to determine Wi-Fi IP address for device ${deviceId}. Ensure phone is connected to Wi-Fi.`);
    }
    return match[1];
  }
  /**
   * 1-Click Switch: Puts USB-connected device in TCP mode, finds its IP, and connects over Wi-Fi.
   */
  async enableWireless(deviceId, port = CONFIG.DEFAULT_PORT) {
    const ip = await this.getDeviceIp(deviceId);
    await this.exec(["-s", deviceId, ...ADB_COMMANDS.TCP_IP(port)]);
    await new Promise((r) => setTimeout(r, 600));
    const connectOutput = await this.exec(ADB_COMMANDS.CONNECT(ip, port));
    if (!connectOutput.includes("connected to")) {
      throw new Error(`Failed to connect over Wi-Fi: ${connectOutput}`);
    }
    return `${ip}:${port}`;
  }
  /**
   * Disconnects a wireless ADB session and resets device connection back to USB mode.
   */
  async disableWireless(deviceId) {
    if (deviceId && deviceId.includes(":")) {
      try {
        await this.exec(["disconnect", deviceId]);
      } catch {
      }
    }
    const prefix = deviceId && !deviceId.includes(":") ? ["-s", deviceId] : [];
    return await this.exec([...prefix, "usb"]);
  }
  /**
   * Connects directly to an existing wireless device endpoint (IP:Port).
   */
  async connectWifi(ip, port = CONFIG.DEFAULT_PORT) {
    const output = await this.exec(ADB_COMMANDS.CONNECT(ip, port));
    return output.includes("connected to");
  }
  /**
   * Pairs an Android 11+ device using pairing code and pairing port.
   */
  async pairWifi(ip, port, code) {
    const output = await this.exec(ADB_COMMANDS.PAIR(ip, port, code));
    return output.includes("Successfully paired");
  }
  /**
   * Detects the currently open/focused application package on the phone screen.
   */
  async getForegroundApp(deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    const output = await this.exec([...prefix, ...ADB_COMMANDS.FOREGROUND_APP]);
    const match = output.match(/mCurrentFocus[^\n]*\s([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\//) || output.match(/mFocusedApp[^\n]*\s([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\//) || output.match(/topResumedActivity[^\n]*\s([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\//);
    return match ? match[1] : null;
  }
  /**
   * Instantly wipes app data, tokens, and cache in <100ms, returning app to pristine logged-out state.
   */
  async resetAppData(packageName, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    await this.exec([...prefix, ...ADB_COMMANDS.CLEAR_APP(packageName)]);
  }
  /**
   * Launches an app from cold start using Android Monkey launcher trigger.
   */
  async launchApp(packageName, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    await this.exec([...prefix, ...ADB_COMMANDS.LAUNCH_APP(packageName)]);
  }
  /**
   * Terminates the app process completely.
   */
  async killApp(packageName, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    await this.exec([...prefix, ...ADB_COMMANDS.FORCE_STOP(packageName)]);
  }
};
var androidDriver = new AndroidDriver();

// src/clipboard.ts
var import_promises = __toESM(require("node:fs/promises"));
var import_node_path2 = __toESM(require("node:path"));
var import_node_os2 = __toESM(require("node:os"));
var import_node_child_process2 = require("node:child_process");
async function copyImageBufferToClipboard(buffer) {
  const tempPath = import_node_path2.default.join(import_node_os2.default.tmpdir(), `adbsnap-clip-${Date.now()}.png`);
  await import_promises.default.writeFile(tempPath, buffer);
  try {
    const platform = process.platform;
    if (platform === "win32") {
      const psCommand = `
Add-Type -AssemblyName System.Windows.Forms;
Add-Type -AssemblyName System.Drawing;
$img = [System.Drawing.Image]::FromFile('${tempPath.replace(/\\/g, "\\\\")}');
[System.Windows.Forms.Clipboard]::SetImage($img);
$img.Dispose();
`;
      await new Promise((resolve, reject) => {
        (0, import_node_child_process2.execFile)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", psCommand], (err, _stdout, stderr) => {
          if (err) {
            reject(new Error(`Clipboard error: ${stderr || err.message}`));
          } else {
            resolve();
          }
        });
      });
    } else if (platform === "darwin") {
      await new Promise((resolve, reject) => {
        (0, import_node_child_process2.execFile)(
          "osascript",
          ["-e", `set the clipboard to (read (POSIX file "${tempPath}") as \xABclass PNGf\xBB)`],
          (err, _stdout, stderr) => {
            if (err) {
              reject(new Error(`Clipboard error: ${stderr || err.message}`));
            } else {
              resolve();
            }
          }
        );
      });
    } else {
      await new Promise((resolve, reject) => {
        (0, import_node_child_process2.execFile)("xclip", ["-selection", "clipboard", "-t", "image/png", "-i", tempPath], (err) => {
          if (err) {
            (0, import_node_child_process2.execFile)("wl-copy", ["-t", "image/png"], { input: buffer }, (err2) => {
              if (err2) {
                reject(new Error("Please install xclip or wl-clipboard to copy images on Linux."));
              } else {
                resolve();
              }
            });
          } else {
            resolve();
          }
        });
      });
    }
  } finally {
    setTimeout(async () => {
      try {
        await import_promises.default.unlink(tempPath);
      } catch {
      }
    }, 2e3);
  }
}

// src/statusBar.ts
var vscode = __toESM(require("vscode"));
var AdbStatusBarManager = class {
  statusBarItem;
  activeDevice = null;
  pollInterval = null;
  isRefreshing = false;
  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = "adbsnap.devices";
    this.statusBarItem.text = "$(device-mobile) ADB: Initializing...";
    this.statusBarItem.tooltip = "ADBSnap: Click to select device or refresh";
    this.statusBarItem.show();
    this.refresh();
    this.pollInterval = setInterval(() => this.refresh(), 1e4);
  }
  async refresh() {
    if (this.isRefreshing) return [];
    this.isRefreshing = true;
    try {
      const devices = await androidDriver.listDevices();
      if (devices.length === 0) {
        this.activeDevice = null;
        this.statusBarItem.text = "$(device-mobile) ADB: No Device";
        this.statusBarItem.tooltip = "No ADB devices found. Click to refresh or pair wireless device.";
        this.statusBarItem.backgroundColor = void 0;
      } else {
        const currentStillAttached = devices.find((d) => d.id === this.activeDevice?.id);
        if (currentStillAttached) {
          this.activeDevice = currentStillAttached;
        } else {
          const firstReady = devices.find((d) => d.isAuthorized);
          this.activeDevice = firstReady || devices[0];
        }
        if (!this.activeDevice.isAuthorized) {
          this.statusBarItem.text = `$(alert) ${this.activeDevice.model} (Unauthorized)`;
          this.statusBarItem.tooltip = `Device ${this.activeDevice.id} requires USB debugging authorization on device screen.`;
          this.statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
        } else {
          const typeBadge = this.activeDevice.type === "wifi" ? "Wi-Fi" : this.activeDevice.type === "emulator" ? "Emu" : "USB";
          this.statusBarItem.text = `$(device-mobile) ${this.activeDevice.model} (${typeBadge})`;
          this.statusBarItem.tooltip = `Active Target: ${this.activeDevice.model} [${this.activeDevice.id}]
Click to switch devices.`;
          this.statusBarItem.backgroundColor = void 0;
        }
      }
      return devices;
    } catch {
      this.statusBarItem.text = "$(alert) ADB: Not Detected";
      this.statusBarItem.tooltip = "ADB command failed or not found. Check Android SDK or PATH settings.";
      this.statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
      return [];
    } finally {
      this.isRefreshing = false;
    }
  }
  getActiveDevice() {
    return this.activeDevice;
  }
  setActiveDevice(device) {
    this.activeDevice = device;
    const typeBadge = device.type === "wifi" ? "Wi-Fi" : device.type === "emulator" ? "Emu" : "USB";
    this.statusBarItem.text = `$(device-mobile) ${device.model} (${typeBadge})`;
    this.statusBarItem.tooltip = `Active Target: ${device.model} [${device.id}]
Click to switch devices.`;
    this.statusBarItem.backgroundColor = void 0;
  }
  dispose() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.statusBarItem.dispose();
  }
};

// src/cli.ts
var import_node_child_process3 = require("node:child_process");
var import_node_path3 = __toESM(require("node:path"));
var import_node_fs2 = __toESM(require("node:fs"));
function resolveCliRunner(extensionPath) {
  const localCli = import_node_path3.default.resolve(extensionPath, "..", "dist", "bin", "cli.js");
  if (import_node_fs2.default.existsSync(localCli)) {
    return {
      command: process.execPath,
      // node
      prefixArgs: [localCli],
      label: `node ${localCli}`
    };
  }
  const localSrcCli = import_node_path3.default.resolve(extensionPath, "..", "bin", "cli.ts");
  if (import_node_fs2.default.existsSync(localSrcCli)) {
    const tsxBin = import_node_path3.default.resolve(extensionPath, "..", "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
    if (import_node_fs2.default.existsSync(tsxBin)) {
      return {
        command: tsxBin,
        prefixArgs: [localSrcCli],
        label: `tsx ${localSrcCli}`
      };
    }
  }
  return {
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    prefixArgs: ["adbsnap"],
    label: "npx adbsnap"
  };
}
async function runAdbSnapCli(extensionPath, args, timeoutMs = 3e4) {
  const runner = resolveCliRunner(extensionPath);
  return new Promise((resolve) => {
    (0, import_node_child_process3.execFile)(
      runner.command,
      [...runner.prefixArgs, ...args],
      {
        timeout: timeoutMs,
        maxBuffer: 50 * 1024 * 1024,
        cwd: import_node_path3.default.resolve(extensionPath, ".."),
        env: { ...process.env, FORCE_COLOR: "0" }
        // Disable chalk colors in output
      },
      (err, stdout, stderr) => {
        resolve({
          stdout: stdout?.toString() || "",
          stderr: stderr?.toString() || "",
          exitCode: err ? err.code ?? 1 : 0
        });
      }
    );
  });
}
function getCliRunnerLabel(extensionPath) {
  return resolveCliRunner(extensionPath).label;
}

// src/views/devicesProvider.ts
var vscode2 = __toESM(require("vscode"));
var DeviceTreeItem = class extends vscode2.TreeItem {
  constructor(device, isActive) {
    super(device.model, vscode2.TreeItemCollapsibleState.None);
    this.device = device;
    this.isActive = isActive;
    const typeLabel = device.type === "wifi" ? "Wi-Fi" : device.type === "emulator" ? "Emulator" : "USB";
    this.description = `${device.id} \u2022 ${typeLabel}${isActive ? " (Active)" : ""}`;
    if (!device.isAuthorized) {
      this.tooltip = `Device: ${device.model} (${device.id})
Status: Unauthorized (Confirm USB debugging on phone)`;
      this.iconPath = new vscode2.ThemeIcon("alert", new vscode2.ThemeColor("errorForeground"));
      this.contextValue = "device-unauthorized";
    } else {
      this.tooltip = `Device: ${device.model} (${device.id})
Product: ${device.product}
Type: ${typeLabel}
Status: Ready`;
      this.iconPath = new vscode2.ThemeIcon(
        device.type === "wifi" ? "radio-tower" : "device-mobile",
        isActive ? new vscode2.ThemeColor("charts.green") : void 0
      );
      if (device.type === "wifi") {
        this.contextValue = isActive ? "device-wifi-active" : "device-wifi-ready";
      } else {
        this.contextValue = isActive ? "device-active" : "device-ready";
      }
    }
    this.command = {
      command: "adbsnap.setActiveDeviceFromTree",
      title: "Select Active Device",
      arguments: [device]
    };
  }
  device;
  isActive;
};
var DevicesTreeDataProvider = class {
  constructor(statusBarManager2) {
    this.statusBarManager = statusBarManager2;
  }
  statusBarManager;
  _onDidChangeTreeData = new vscode2.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  devices = [];
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element) {
    return element;
  }
  async getChildren() {
    try {
      this.devices = await androidDriver.listDevices();
      const activeDevice = this.statusBarManager.getActiveDevice();
      if (this.devices.length === 0) {
        return [];
      }
      return this.devices.map(
        (dev) => new DeviceTreeItem(dev, activeDevice?.id === dev.id)
      );
    } catch {
      return [];
    }
  }
  getDevices() {
    return this.devices;
  }
};

// src/views/capturesProvider.ts
var vscode3 = __toESM(require("vscode"));
var import_node_fs3 = __toESM(require("node:fs"));
var import_node_path4 = __toESM(require("node:path"));
var CaptureTreeItem = class extends vscode3.TreeItem {
  constructor(filePath, fileName, stats) {
    super(fileName, vscode3.TreeItemCollapsibleState.None);
    this.filePath = filePath;
    this.fileName = fileName;
    this.stats = stats;
    const sizeKb = (stats.size / 1024).toFixed(1);
    const sizeStr = stats.size > 1024 * 1024 ? `${(stats.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeKb} KB`;
    const dateStr = stats.mtime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    this.description = `${sizeStr} \u2022 ${dateStr}`;
    this.tooltip = `${fileName}
Size: ${sizeStr}
Saved: ${stats.mtime.toLocaleString()}`;
    const isZip = fileName.endsWith(".zip");
    this.iconPath = new vscode3.ThemeIcon(isZip ? "archive" : "file-media");
    this.contextValue = isZip ? "capture-zip" : "capture-image";
    this.command = {
      command: "vscode.open",
      title: "Open File",
      arguments: [vscode3.Uri.file(filePath)]
    };
  }
  filePath;
  fileName;
  stats;
};
var CapturesTreeDataProvider = class {
  constructor(getOutputDir) {
    this.getOutputDir = getOutputDir;
  }
  getOutputDir;
  _onDidChangeTreeData = new vscode3.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element) {
    return element;
  }
  async getChildren() {
    const outDir = this.getOutputDir();
    if (!import_node_fs3.default.existsSync(outDir)) {
      return [];
    }
    try {
      const entries = import_node_fs3.default.readdirSync(outDir, { withFileTypes: true });
      const items = [];
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith(".png") || entry.name.endsWith(".jpg") || entry.name.endsWith(".zip"))) {
          const fullPath = import_node_path4.default.join(outDir, entry.name);
          const stats = import_node_fs3.default.statSync(fullPath);
          items.push(new CaptureTreeItem(fullPath, entry.name, stats));
        } else if (entry.isDirectory() && entry.name.startsWith("export-")) {
          const subDir = import_node_path4.default.join(outDir, entry.name);
          const subStats = import_node_fs3.default.statSync(subDir);
          items.push(new CaptureTreeItem(subDir, `\u{1F4C1} ${entry.name}`, subStats));
        }
      }
      items.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);
      return items;
    } catch {
      return [];
    }
  }
};

// src/studio/studioWebview.ts
var vscode4 = __toESM(require("vscode"));
var import_node_path5 = __toESM(require("node:path"));
var import_promises2 = __toESM(require("node:fs/promises"));
var StudioWebviewManager = class _StudioWebviewManager {
  static currentPanel = null;
  static createOrShow(context, statusBarManager2, resolveOutputDir2, onCaptureSaved) {
    const column = vscode4.window.activeTextEditor ? vscode4.window.activeTextEditor.viewColumn : void 0;
    if (_StudioWebviewManager.currentPanel) {
      _StudioWebviewManager.currentPanel.reveal(column);
      return;
    }
    const panel = vscode4.window.createWebviewPanel(
      "adbsnapStudio",
      "ADBSnap Studio \u{1F3A8}",
      column || vscode4.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode4.Uri.file(context.extensionPath)]
      }
    );
    _StudioWebviewManager.currentPanel = panel;
    panel.webview.html = _StudioWebviewManager.getHtmlForWebview();
    panel.onDidDispose(() => {
      _StudioWebviewManager.currentPanel = null;
    });
    panel.webview.onDidReceiveMessage(async (message) => {
      const activeDevice = statusBarManager2.getActiveDevice();
      switch (message.command) {
        case "init": {
          const devices = await androidDriver.listDevices();
          panel.webview.postMessage({
            type: "state",
            devices,
            activeDeviceId: activeDevice?.id || null
          });
          break;
        }
        case "refreshDevices": {
          const devices = await statusBarManager2.refresh();
          panel.webview.postMessage({
            type: "state",
            devices,
            activeDeviceId: statusBarManager2.getActiveDevice()?.id || null
          });
          break;
        }
        case "capture": {
          if (!activeDevice || !activeDevice.isAuthorized) {
            vscode4.window.showErrorMessage("ADBSnap: No authorized device available to capture.");
            panel.webview.postMessage({ type: "captureError", message: "Device not ready" });
            return;
          }
          try {
            panel.webview.postMessage({ type: "busy", isBusy: true, message: "Capturing from device..." });
            const outDir = resolveOutputDir2();
            await import_promises2.default.mkdir(outDir, { recursive: true });
            const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
            const tempFile = import_node_path5.default.join(outDir, `adbsnap-temp-${timestamp}.png`);
            const cliArgs = [
              "snap",
              "--frame",
              message.frame || "iphone-16-pro",
              "--theme",
              message.theme || "aurora",
              "--device",
              activeDevice.id,
              "--out",
              tempFile
            ];
            if (message.title) cliArgs.push("--title", message.title);
            if (message.subtitle) cliArgs.push("--subtitle", message.subtitle);
            const result = await runAdbSnapCli(context.extensionPath, cliArgs, 35e3);
            if (result.exitCode !== 0) {
              throw new Error(result.stderr || result.stdout || "Capture failed");
            }
            const imageBuffer = await import_promises2.default.readFile(tempFile);
            const base64Data = imageBuffer.toString("base64");
            panel.webview.postMessage({
              type: "previewImage",
              dataUrl: `data:image/png;base64,${base64Data}`,
              filePath: tempFile
            });
            if (onCaptureSaved) onCaptureSaved();
          } catch (err) {
            vscode4.window.showErrorMessage(`Capture failed: ${err.message || err}`);
            panel.webview.postMessage({ type: "captureError", message: err.message || String(err) });
          } finally {
            panel.webview.postMessage({ type: "busy", isBusy: false });
          }
          break;
        }
        case "copyToClipboard": {
          if (!message.filePath) {
            vscode4.window.showWarningMessage("ADBSnap: Please capture an image first before copying.");
            return;
          }
          try {
            const buf = await import_promises2.default.readFile(message.filePath);
            await copyImageBufferToClipboard(buf);
            vscode4.window.showInformationMessage("\u{1F4F8} ADBSnap: Framed graphic copied to clipboard!");
          } catch (err) {
            vscode4.window.showErrorMessage(`Copy failed: ${err.message || err}`);
          }
          break;
        }
        case "saveAsset": {
          if (!message.filePath) {
            vscode4.window.showWarningMessage("ADBSnap: Please capture an image first.");
            return;
          }
          vscode4.window.showInformationMessage(`\u{1F4F8} Asset saved: ${import_node_path5.default.basename(message.filePath)}`);
          break;
        }
      }
    });
  }
  static getHtmlForWebview() {
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
      <h2>\u{1F4F8} ADBSnap Studio</h2>
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
        <span id="btnText">\u{1F4F8} Capture Live Device</span>
      </button>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button class="btn btn-secondary" id="copyBtn">\u{1F4CB} Copy</button>
        <button class="btn btn-secondary" id="saveBtn">\u{1F4BE} Save Asset</button>
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
            btnText.textContent = '\u{1F4F8} Capture Live Device';
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
          btnText.textContent = '\u{1F4F8} Capture Live Device';
          captureBtn.disabled = false;
          break;
      }
    });
  </script>
</body>
</html>`;
  }
};

// src/extension.ts
var statusBarManager;
var outputChannel;
var devicesProvider;
var capturesProvider;
function activate(context) {
  outputChannel = vscode5.window.createOutputChannel("ADBSnap");
  statusBarManager = new AdbStatusBarManager();
  context.subscriptions.push(statusBarManager, outputChannel);
  const config = vscode5.workspace.getConfiguration("adbsnap");
  const customAdb = config.get("customAdbPath");
  if (customAdb && customAdb.trim().length > 0) {
    process.env.ADB_PATH = customAdb.trim();
  }
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.snap", async () => {
      await handleSnapCommand(context, { copyToClipboard: false });
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.snapClipboard", async () => {
      await handleSnapCommand(context, { copyToClipboard: true });
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.snapRaw", async () => {
      await handleSnapRawCommand(context);
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.devices", async () => {
      await handleSelectDeviceCommand();
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.wifi", async () => {
      await handleWifiCommand();
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.disconnectWifi", async (item) => {
      await handleDisconnectWifiCommand(item);
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.doctor", async () => {
      await handleDoctorCommand(context);
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.export", async () => {
      await handleExportCommand(context);
    })
  );
  devicesProvider = new DevicesTreeDataProvider(statusBarManager);
  capturesProvider = new CapturesTreeDataProvider(() => resolveOutputDir());
  context.subscriptions.push(
    vscode5.window.registerTreeDataProvider("adbsnap.devicesView", devicesProvider),
    vscode5.window.registerTreeDataProvider("adbsnap.recentCapturesView", capturesProvider)
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.openStudio", () => {
      StudioWebviewManager.createOrShow(
        context,
        statusBarManager,
        resolveOutputDir,
        () => capturesProvider.refresh()
      );
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.refreshDevices", async () => {
      await statusBarManager.refresh();
      devicesProvider.refresh();
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.refreshCaptures", () => {
      capturesProvider.refresh();
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.setActiveDeviceFromTree", (device) => {
      if (device) {
        statusBarManager.setActiveDevice(device);
        devicesProvider.refresh();
      }
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.snapDeviceFromTree", async (item) => {
      if (item && item.device) {
        statusBarManager.setActiveDevice(item.device);
        devicesProvider.refresh();
        await handleSnapCommand(context, { copyToClipboard: false });
      }
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.revealCapture", (item) => {
      if (item && item.filePath) {
        vscode5.commands.executeCommand("revealFileInOS", vscode5.Uri.file(item.filePath));
      }
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.copyCapture", async (item) => {
      if (item && item.filePath) {
        try {
          const buf = await import_promises3.default.readFile(item.filePath);
          await copyImageBufferToClipboard(buf);
          vscode5.window.showInformationMessage(`\u{1F4F8} Copied ${item.fileName} to clipboard!`);
        } catch (err) {
          vscode5.window.showErrorMessage(`Failed to copy: ${err.message || err}`);
        }
      }
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.deleteCapture", async (item) => {
      if (item && item.filePath) {
        const confirm = await vscode5.window.showWarningMessage(
          `Delete "${item.fileName}"?`,
          { modal: true },
          "Delete"
        );
        if (confirm === "Delete") {
          try {
            await import_promises3.default.rm(item.filePath, { recursive: true, force: true });
            capturesProvider.refresh();
            vscode5.window.showInformationMessage(`Deleted ${item.fileName}`);
          } catch (err) {
            vscode5.window.showErrorMessage(`Failed to delete: ${err.message || err}`);
          }
        }
      }
    })
  );
}
function deactivate() {
  if (statusBarManager) {
    statusBarManager.dispose();
  }
}
function resolveOutputDir() {
  const config = vscode5.workspace.getConfiguration("adbsnap");
  let outDir = config.get("outputDirectory") || "${workspaceFolder}/output";
  const workspaceFolders = vscode5.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    outDir = outDir.replace("${workspaceFolder}", workspaceFolders[0].uri.fsPath);
  } else if (outDir.includes("${workspaceFolder}")) {
    const os3 = require("node:os");
    const desktopPath = import_node_path6.default.join(os3.homedir(), "Desktop");
    const fallbackRoot = import_promises3.default.stat(desktopPath).then(() => desktopPath).catch(() => os3.homedir());
    const home = os3.homedir();
    const desktop = import_node_path6.default.join(home, "Desktop");
    let baseDir;
    try {
      require("node:fs").accessSync(desktop);
      baseDir = desktop;
    } catch {
      baseDir = home;
    }
    outDir = import_node_path6.default.join(baseDir, "ADBSnap");
  }
  return import_node_path6.default.resolve(outDir);
}
async function handleSnapCommand(context, options) {
  const device = statusBarManager.getActiveDevice();
  if (!device) {
    vscode5.window.showWarningMessage("ADBSnap: No connected ADB device found. Please attach a device or emulator.");
    return;
  }
  if (!device.isAuthorized) {
    vscode5.window.showErrorMessage(`ADBSnap: Device "${device.model}" is unauthorized. Please accept the USB debugging prompt on the device.`);
    return;
  }
  await vscode5.window.withProgress(
    {
      location: vscode5.ProgressLocation.Notification,
      title: options.copyToClipboard ? "ADBSnap: Snapping to Clipboard..." : "ADBSnap: Capturing & Framing...",
      cancellable: false
    },
    async () => {
      try {
        const config = vscode5.workspace.getConfiguration("adbsnap");
        const theme = config.get("defaultTheme") || "aurora";
        const frame = config.get("defaultFrame") || "iphone-16-pro";
        const outDir = resolveOutputDir();
        await import_promises3.default.mkdir(outDir, { recursive: true });
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const fileName = `adbsnap-${frame}-${theme}-${timestamp}.png`;
        const filePath = import_node_path6.default.join(outDir, fileName);
        const cliArgs = [
          "snap",
          "--frame",
          frame,
          "--theme",
          theme,
          "--device",
          device.id,
          "--out",
          filePath
        ];
        const result = await runAdbSnapCli(context.extensionPath, cliArgs, 3e4);
        if (result.exitCode !== 0) {
          const errorMsg = result.stderr || result.stdout || "Unknown CLI error";
          throw new Error(errorMsg.trim());
        }
        if (options.copyToClipboard) {
          const imgBuffer = await import_promises3.default.readFile(filePath);
          await copyImageBufferToClipboard(Buffer.from(imgBuffer));
          vscode5.window.showInformationMessage("\u{1F4F8} ADBSnap: Framed screenshot copied to clipboard!");
          if (capturesProvider) {
            capturesProvider.refresh();
          }
          const action = await vscode5.window.showInformationMessage(
            `\u{1F4F8} Saved screenshot to ${fileName}`,
            "Open Image",
            "Reveal in Explorer"
          );
          if (action === "Open Image") {
            await vscode5.commands.executeCommand("vscode.open", vscode5.Uri.file(filePath));
          } else if (action === "Reveal in Explorer") {
            await vscode5.commands.executeCommand("revealFileInOS", vscode5.Uri.file(filePath));
          }
        }
      } catch (err) {
        vscode5.window.showErrorMessage(`ADBSnap Capture Failed: ${err.message || err}`);
      }
    }
  );
}
async function handleSnapRawCommand(context) {
  const device = statusBarManager.getActiveDevice();
  if (!device || !device.isAuthorized) {
    vscode5.window.showWarningMessage("ADBSnap: No authorized device found.");
    return;
  }
  await vscode5.window.withProgress(
    {
      location: vscode5.ProgressLocation.Notification,
      title: "ADBSnap: Capturing Raw Screen...",
      cancellable: false
    },
    async () => {
      try {
        const outDir = resolveOutputDir();
        await import_promises3.default.mkdir(outDir, { recursive: true });
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const fileName = `raw-snap-${timestamp}.png`;
        const filePath = import_node_path6.default.join(outDir, fileName);
        const cliArgs = [
          "snap",
          "--raw",
          "--device",
          device.id,
          "--out",
          filePath
        ];
        const result = await runAdbSnapCli(context.extensionPath, cliArgs, 15e3);
        if (result.exitCode !== 0) {
          const errorMsg = result.stderr || result.stdout || "Unknown CLI error";
          throw new Error(errorMsg.trim());
        }
        if (capturesProvider) {
          capturesProvider.refresh();
        }
        const action = await vscode5.window.showInformationMessage(
          `\u{1F4F8} Saved raw screen to ${fileName}`,
          "Open Image",
          "Reveal in Explorer"
        );
        if (action === "Open Image") {
          await vscode5.commands.executeCommand("vscode.open", vscode5.Uri.file(filePath));
        } else if (action === "Reveal in Explorer") {
          await vscode5.commands.executeCommand("revealFileInOS", vscode5.Uri.file(filePath));
        }
      } catch (err) {
        vscode5.window.showErrorMessage(`ADBSnap Raw Capture Failed: ${err.message || err}`);
      }
    }
  );
}
async function handleSelectDeviceCommand() {
  const devices = await statusBarManager.refresh();
  const items = [];
  if (devices.length > 0) {
    const active = statusBarManager.getActiveDevice();
    for (const d of devices) {
      const isCurrent = active?.id === d.id;
      const typeLabel = d.type === "wifi" ? "Wi-Fi" : d.type === "emulator" ? "Emulator" : "USB";
      const statusIcon = d.isAuthorized ? "$(check)" : "$(alert)";
      items.push({
        label: `${statusIcon} ${d.model} (${typeLabel}) ${isCurrent ? "\u2022 Active" : ""}`,
        description: d.id,
        detail: d.isAuthorized ? `Status: Ready (${d.product})` : "Status: Unauthorized - approve USB debugging on device",
        device: d
      });
    }
  } else {
    items.push({
      label: "$(warning) No devices detected",
      description: "Ensure USB debugging is enabled on your phone"
    });
  }
  items.push({ label: "", kind: vscode5.QuickPickItemKind.Separator });
  items.push({
    label: "$(refresh) Refresh Connected Devices",
    description: "Re-scan USB and Wi-Fi ADB devices",
    action: "refresh"
  });
  items.push({
    label: "$(radio-tower) Switch USB Device to Wireless (WiFi)",
    description: "Set up wireless debugging over local network",
    action: "wifi"
  });
  items.push({
    label: "$(plug) Turn Off Wi-Fi Mode (Revert to USB)",
    description: "Disconnect wireless ADB and reset device connection to USB",
    action: "disconnectWifi"
  });
  const selected = await vscode5.window.showQuickPick(items, {
    placeHolder: "Select active Android device or action"
  });
  if (!selected) return;
  if (selected.action === "refresh") {
    await statusBarManager.refresh();
    vscode5.window.showInformationMessage("ADBSnap: Device list refreshed.");
  } else if (selected.action === "wifi") {
    await handleWifiCommand();
  } else if (selected.action === "disconnectWifi") {
    await handleDisconnectWifiCommand();
  } else if (selected.device) {
    statusBarManager.setActiveDevice(selected.device);
    vscode5.window.showInformationMessage(`ADBSnap: Active device set to "${selected.device.model}".`);
  }
}
async function handleWifiCommand() {
  const devices = await androidDriver.listDevices();
  const usbDevices = devices.filter((d) => d.type === "usb" && d.isAuthorized);
  if (usbDevices.length === 0) {
    vscode5.window.showWarningMessage("ADBSnap: No authorized USB device found. Please connect your phone via USB first to enable wireless mode.");
    return;
  }
  let targetId = usbDevices[0].id;
  if (usbDevices.length > 1) {
    const picked = await vscode5.window.showQuickPick(
      usbDevices.map((d) => ({ label: d.model, description: d.id })),
      { placeHolder: "Select USB device to switch to Wireless" }
    );
    if (!picked) return;
    targetId = picked.description;
  }
  await vscode5.window.withProgress(
    {
      location: vscode5.ProgressLocation.Notification,
      title: "ADBSnap: Switching device to Wireless ADB...",
      cancellable: false
    },
    async () => {
      try {
        const address = await androidDriver.enableWireless(targetId);
        await statusBarManager.refresh();
        if (devicesProvider) {
          devicesProvider.refresh();
        }
        vscode5.window.showInformationMessage(`\u{1F389} ADBSnap: Connected wirelessly to ${address}! You can now disconnect the USB cable.`);
      } catch (err) {
        vscode5.window.showErrorMessage(`Wireless Setup Failed: ${err.message || err}`);
      }
    }
  );
}
async function handleDisconnectWifiCommand(targetDevice) {
  const dev = targetDevice && "device" in targetDevice ? targetDevice.device : targetDevice;
  const deviceId = dev?.id || statusBarManager.getActiveDevice()?.id;
  await vscode5.window.withProgress(
    {
      location: vscode5.ProgressLocation.Notification,
      title: "ADBSnap: Reverting ADB to USB mode...",
      cancellable: false
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
        vscode5.window.showInformationMessage("\u{1F50C} ADBSnap: Wi-Fi mode turned off. Switched back to USB mode.");
      } catch (err) {
        vscode5.window.showErrorMessage(`Disconnect Wi-Fi Failed: ${err.message || err}`);
      }
    }
  );
}
async function handleDoctorCommand(context) {
  outputChannel.clear();
  outputChannel.show(true);
  outputChannel.appendLine("========================================");
  outputChannel.appendLine("  \u{1FA7A} ADBSnap Environment Doctor");
  outputChannel.appendLine("========================================");
  outputChannel.appendLine(`\u2022 Node Version : ${process.version}`);
  outputChannel.appendLine(`\u2022 Platform     : ${process.platform} (${process.arch})`);
  let adbPath = "adb";
  try {
    adbPath = resolveAdbPath();
    outputChannel.appendLine(`\u2022 ADB Path     : ${adbPath}`);
  } catch (err) {
    outputChannel.appendLine(`\u2022 ADB Path     : FAILED (${err.message})`);
  }
  const cliLabel = getCliRunnerLabel(context.extensionPath);
  outputChannel.appendLine(`\u2022 CLI Runner   : ${cliLabel}`);
  outputChannel.appendLine("\n--- Connected Devices ---");
  try {
    const devices = await androidDriver.listDevices();
    if (devices.length === 0) {
      outputChannel.appendLine("No attached Android devices detected.");
    } else {
      devices.forEach((d, index) => {
        outputChannel.appendLine(
          `[${index + 1}] [${d.type.toUpperCase()}] ${d.model} (${d.id}) -> ${d.isAuthorized ? "READY" : "UNAUTHORIZED"}`
        );
      });
    }
  } catch (err) {
    outputChannel.appendLine(`Device scan failed: ${err.message}`);
  }
  outputChannel.appendLine("========================================\n");
}
async function handleExportCommand(context) {
  const device = statusBarManager.getActiveDevice();
  if (!device) {
    vscode5.window.showWarningMessage("ADBSnap: No connected ADB device found. Please attach a device or emulator.");
    return;
  }
  if (!device.isAuthorized) {
    vscode5.window.showErrorMessage(`ADBSnap: Device "${device.model}" is unauthorized. Please accept the USB debugging prompt on the device.`);
    return;
  }
  const storePick = await vscode5.window.showQuickPick(
    [
      { label: "$(package) All Stores (App Store + Google Play)", description: '4 sizes: 6.9", 6.7", 6.5" + Play Store', value: "all" },
      { label: "$(device-mobile) Apple App Store Only", description: '3 sizes: 6.9", 6.7", 6.5"', value: "apple" },
      { label: "$(rocket) Google Play Store Only", description: "1 size: Play Store standard", value: "google" }
    ],
    { placeHolder: "Select store targets for export" }
  );
  if (!storePick) return;
  const title = await vscode5.window.showInputBox({
    prompt: "Headline text for the showcase (leave empty to skip)",
    placeHolder: "e.g. Track Your Daily Habits"
  });
  const subtitle = title ? await vscode5.window.showInputBox({
    prompt: "Subtitle text (leave empty to skip)",
    placeHolder: "e.g. Simple. Fast. Beautiful."
  }) : void 0;
  await vscode5.window.withProgress(
    {
      location: vscode5.ProgressLocation.Notification,
      title: `ADBSnap: Exporting ${storePick.value === "all" ? "All Stores" : storePick.value === "apple" ? "App Store" : "Play Store"} assets...`,
      cancellable: false
    },
    async () => {
      try {
        const config = vscode5.workspace.getConfiguration("adbsnap");
        const theme = config.get("defaultTheme") || "aurora";
        const frame = config.get("defaultFrame") || "iphone-16-pro";
        const outDir = resolveOutputDir();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const exportDir = import_node_path6.default.join(outDir, `export-${theme}-${timestamp}`);
        const cliArgs = [
          "export",
          "--frame",
          frame,
          "--theme",
          theme,
          "--store",
          storePick.value,
          "--device",
          device.id,
          "--out",
          exportDir,
          "--zip"
        ];
        if (title) {
          cliArgs.push("--title", title);
        }
        if (subtitle) {
          cliArgs.push("--subtitle", subtitle);
        }
        const result = await runAdbSnapCli(context.extensionPath, cliArgs, 6e4);
        if (result.exitCode !== 0) {
          const errorMsg = result.stderr || result.stdout || "Unknown CLI error";
          throw new Error(errorMsg.trim());
        }
        if (capturesProvider) {
          capturesProvider.refresh();
        }
        const action = await vscode5.window.showInformationMessage(
          `\u{1F4E6} Store asset pack exported to ${import_node_path6.default.basename(exportDir)}/`,
          "Reveal in Explorer"
        );
        if (action === "Reveal in Explorer") {
          await vscode5.commands.executeCommand("revealFileInOS", vscode5.Uri.file(exportDir));
        }
      } catch (err) {
        vscode5.window.showErrorMessage(`ADBSnap Export Failed: ${err.message || err}`);
      }
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
