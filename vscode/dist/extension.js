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
var vscode6 = __toESM(require("vscode"));
var import_node_path7 = __toESM(require("node:path"));
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
  SCREENCAP_RAW: ["exec-out", "screencap"],
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
      if (id.includes(":") || id.includes("._tcp") || id.includes("_adb-tls-") || id.includes("._adb.") || id.includes("tls-connect")) {
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
    devices.sort((a, b) => {
      if (a.isAuthorized !== b.isAuthorized) return a.isAuthorized ? -1 : 1;
      const rank = (type) => {
        if (type === "usb") return 0;
        if (type === "wifi") return 1;
        if (type === "emulator") return 2;
        return 3;
      };
      return rank(a.type) - rank(b.type);
    });
    return devices;
  }
  /**
   * Captures raw screenshot directly into a memory Buffer via high-speed raw framebuffer streaming.
   * Bypasses device-side CPU PNG compression with automatic fallback to standard `screencap -p`.
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
    const adbBinary = resolveAdbPath();
    try {
      const rawArgs = targetId ? ["-s", targetId, ...ADB_COMMANDS.SCREENCAP_RAW] : ADB_COMMANDS.SCREENCAP_RAW;
      const rawBuffer = await new Promise((resolve, reject) => {
        (0, import_node_child_process.execFile)(
          adbBinary,
          rawArgs,
          {
            encoding: "buffer",
            maxBuffer: 50 * 1024 * 1024,
            timeout: CONFIG.DEFAULT_TIMEOUT_MS
          },
          (err, stdout, stderr) => {
            if (err) return reject(err);
            if (!stdout || stdout.length < 16) return reject(new Error("Invalid raw screencap buffer"));
            resolve(stdout);
          }
        );
      });
      const width = rawBuffer.readUInt32LE(0);
      const height = rawBuffer.readUInt32LE(4);
      const format = rawBuffer.readUInt32LE(8);
      const sharpModule = await import("sharp").catch(() => null);
      if (sharpModule) {
        const sharp = sharpModule.default || sharpModule;
        if (width > 0 && height > 0 && (format === 1 || format === 2 || format === 3 || format === 5)) {
          const expectedBytes = 16 + width * height * 4;
          if (rawBuffer.length >= expectedBytes) {
            const pixelData = rawBuffer.subarray(16, expectedBytes);
            return await sharp(pixelData, {
              raw: {
                width,
                height,
                channels: 4
              }
            }).png({ compressionLevel: 6 }).toBuffer();
          }
        }
      }
    } catch {
    }
    const fallbackArgs = targetId ? ["-s", targetId, ...ADB_COMMANDS.SCREENCAP] : ADB_COMMANDS.SCREENCAP;
    return new Promise((resolve, reject) => {
      (0, import_node_child_process.execFile)(
        adbBinary,
        fallbackArgs,
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
   * Extracts the internal local Wi-Fi IP address of an attached device with multi-layer fallbacks.
   */
  async getDeviceIp(deviceId) {
    try {
      const output = await this.exec(["-s", deviceId, ...ADB_COMMANDS.WLAN_IP]);
      const match = output.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
      if (match && match[1] && !match[1].startsWith("127.")) {
        return match[1];
      }
    } catch {
    }
    try {
      const routeOutput = await this.exec(["-s", deviceId, "shell", "ip", "route"]);
      const routeMatch = routeOutput.match(/src\s+(\d+\.\d+\.\d+\.\d+)/);
      if (routeMatch && routeMatch[1] && !routeMatch[1].startsWith("127.")) {
        return routeMatch[1];
      }
    } catch {
    }
    try {
      const addrOutput = await this.exec(["-s", deviceId, "shell", "ip", "-f", "inet", "addr"]);
      const lines = addrOutput.split("\n");
      for (const line of lines) {
        const m = line.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
        if (m && m[1] && !m[1].startsWith("127.")) {
          return m[1];
        }
      }
    } catch {
    }
    try {
      const propOutput = await this.exec(["-s", deviceId, "shell", "getprop", "dhcp.wlan0.ipaddress"]);
      const trimmed = propOutput.trim();
      if (/^\d+\.\d+\.\d+\.\d+$/.test(trimmed)) {
        return trimmed;
      }
    } catch {
    }
    throw new Error(`Unable to determine Wi-Fi IP address for device ${deviceId}. Please verify that your phone is connected to your Wi-Fi network.`);
  }
  /**
   * 1-Click Switch: Puts USB-connected device in TCP mode, finds its IP, and connects over Wi-Fi.
   */
  async enableWireless(deviceId, port = CONFIG.DEFAULT_PORT) {
    const ip = await this.getDeviceIp(deviceId);
    await this.exec(["-s", deviceId, ...ADB_COMMANDS.TCP_IP(port)]);
    await new Promise((r) => setTimeout(r, 800));
    const connectOutput = await this.exec(ADB_COMMANDS.CONNECT(ip, port));
    if (!connectOutput.includes("connected to") && !connectOutput.includes("already connected")) {
      throw new Error(`Failed to connect over Wi-Fi to ${ip}:${port}: ${connectOutput}`);
    }
    return `${ip}:${port}`;
  }
  /**
   * Disconnects a wireless ADB session and resets device connection back to USB mode.
   */
  async disableWireless(deviceId) {
    const isWireless = deviceId && (deviceId.includes(":") || deviceId.includes("._tcp") || deviceId.includes("_adb-tls-") || deviceId.includes("tls-connect"));
    if (isWireless) {
      try {
        return await this.exec(["disconnect", deviceId]);
      } catch {
        return "disconnected";
      }
    }
    const prefix = deviceId ? ["-s", deviceId] : [];
    return await this.exec([...prefix, "usb"]);
  }
  /**
   * Connects directly to an existing wireless device endpoint (IP:Port).
   */
  async connectWifi(ip, port = CONFIG.DEFAULT_PORT) {
    try {
      const output = await this.exec(ADB_COMMANDS.CONNECT(ip, port));
      if (output.includes("connected to") || output.includes("already connected")) {
        return { success: true, message: output };
      }
      return { success: false, message: output || "Failed to connect" };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }
  /**
   * Pairs an Android 11+ device using pairing code and pairing port.
   */
  async pairWifi(ip, port, code) {
    try {
      const output = await this.exec(ADB_COMMANDS.PAIR(ip, port, code));
      if (output.includes("Successfully paired") || output.includes("already paired")) {
        return { success: true, message: output };
      }
      return { success: false, message: output || "Pairing failed" };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
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
  /**
   * Toggles Android SystemUI Demo Mode (pristine 9:41 AM, 100% battery, full wifi, no notifications).
   */
  async setDemoMode(enable, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    if (enable) {
      await this.exec([...prefix, "shell", "settings", "put", "global", "sysui_demo_allowed", "1"]);
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "enter"]);
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "clock", "-e", "hhmm", "0941"]);
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "battery", "-e", "level", "100", "-e", "plugged", "false"]);
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "network", "-e", "wifi", "show", "-e", "level", "4", "-e", "fully", "true"]);
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "network", "-e", "mobile", "show", "-e", "datatype", "false", "-e", "level", "4"]);
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "notifications", "-e", "visible", "false"]);
    } else {
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "exit"]);
    }
  }
  /**
   * Records a high-definition MP4 clip directly from the mobile screen using adb screenrecord.
   */
  async recordVideo(seconds = 5, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    const remotePath = "/sdcard/adbsnap_temp_rec.mp4";
    const localTmp = import_node_path.default.join(import_node_os.default.tmpdir(), `adbsnap-rec-${Date.now()}.mp4`);
    try {
      await this.exec([...prefix, "shell", "rm", "-f", remotePath]);
    } catch {
    }
    const duration = Math.min(Math.max(seconds, 1), 30);
    await this.exec(
      [...prefix, "shell", "screenrecord", "--time-limit", String(duration), remotePath],
      (duration + 10) * 1e3
    );
    await this.exec([...prefix, "pull", remotePath, localTmp], 3e4);
    const buffer = import_node_fs.default.readFileSync(localTmp);
    try {
      import_node_fs.default.unlinkSync(localTmp);
    } catch {
    }
    try {
      await this.exec([...prefix, "shell", "rm", "-f", remotePath]);
    } catch {
    }
    return buffer;
  }
  /**
   * Dispatches a native hardware keyevent (e.g. Back = 4, Home = 3, Recents = 187, Power = 26).
   */
  async sendKeyEvent(keyCode, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    await this.exec([...prefix, "shell", "input", "keyevent", String(keyCode)]);
  }
  /**
   * Injects text into active focused input field on device with special character escaping.
   */
  async inputText(text, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    const sanitized = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\s/g, "%s").replace(/&/g, "\\&").replace(/\|/g, "\\|").replace(/\$/g, "\\$").replace(/`/g, "\\`");
    await this.exec([...prefix, "shell", "input", "text", sanitized]);
  }
  /**
   * Dispatches an Android intent to open a deep link or URI in the default application.
   */
  async openDeepLink(uri, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    await this.exec([...prefix, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", uri]);
  }
  /**
   * Captures the last N lines of fatal exception / error logcat traces.
   */
  async getLogcatErrors(lines = 50, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    try {
      const output = await this.exec([...prefix, "shell", "logcat", "-d", "-t", String(lines), "*:E"]);
      return output.trim();
    } catch (err) {
      return `Failed to fetch logcat: ${err.message || err}`;
    }
  }
};
var androidDriver = new AndroidDriver();

// ../lib/ios.ts
var import_node_child_process2 = require("node:child_process");
var import_promises = __toESM(require("node:fs/promises"), 1);
var import_node_os2 = __toESM(require("node:os"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);
var runCommand = (command, args, options = {}) => new Promise((resolve, reject) => {
  (0, import_node_child_process2.execFile)(command, args, options, (error, stdout, stderr) => {
    if (error) {
      reject(new Error(stderr.trim() || error.message));
      return;
    }
    resolve({ stdout, stderr });
  });
});
var IOSDriver = class {
  constructor(execute = runCommand) {
    this.execute = execute;
  }
  execute;
  platform = "ios";
  /**
   * Verifies whether Xcode's simulator tooling is available on this host.
   */
  async isAvailable() {
    if (process.platform !== "darwin") return false;
    try {
      await this.execute("xcrun", ["simctl", "help"]);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Lists booted simulators and connected physical iOS devices on macOS.
   */
  async listDevices() {
    if (process.platform !== "darwin") return [];
    const [simulators, physicalDevices] = await Promise.all([
      this.listSimulators(),
      this.listPhysicalDevices()
    ]);
    return [...simulators, ...physicalDevices];
  }
  async listSimulators() {
    let stdout;
    try {
      ({ stdout } = await this.execute("xcrun", ["simctl", "list", "devices", "booted", "--json"]));
    } catch {
      return [];
    }
    const parsed = JSON.parse(stdout);
    return Object.values(parsed.devices ?? {}).flat().filter((device) => device.state === "Booted").map((device) => ({
      id: device.udid,
      platform: "ios",
      type: "emulator",
      model: device.name || "iOS Simulator",
      product: device.deviceTypeIdentifier || "iPhone",
      isAuthorized: true,
      rawStatus: device.state
    }));
  }
  async listPhysicalDevices() {
    const { stdout } = await this.execute("xcrun", [
      "devicectl",
      "--quiet",
      "list",
      "devices",
      "--json-output",
      "-"
    ]);
    const parsed = JSON.parse(stdout);
    return (parsed.result?.devices ?? []).filter((device) => device.properties?.hardware?.reality?.toLowerCase() === "physical").filter((device) => device.properties?.connection?.state?.toLowerCase() === "connected").map((device) => {
      const hardware = device.properties?.hardware;
      const connection = device.properties?.connection;
      const pairingState = connection?.pairingState?.toLowerCase() ?? "unknown";
      const state = connection?.state ?? "unknown";
      return {
        id: device.identifier || hardware?.udid || "",
        platform: "ios",
        type: this.connectionType(connection?.transportType),
        model: hardware?.marketingName || device.properties?.state?.name || "iOS Device",
        product: hardware?.productType || hardware?.deviceType || "iPhone",
        isAuthorized: pairingState === "paired",
        rawStatus: `${state}; pairing ${pairingState}`
      };
    }).filter((device) => device.id.length > 0);
  }
  connectionType(transportType) {
    const transport = transportType?.toLowerCase();
    return transport && ["wifi", "wireless", "network", "remote"].includes(transport) ? "wifi" : "usb";
  }
  /**
   * Captures a screenshot from a booted simulator or connected physical iOS device.
   */
  async captureScreenshot(deviceId) {
    if (process.platform !== "darwin") {
      throw new Error("iOS screenshot capture requires macOS with Xcode installed and configured.");
    }
    const devices = await this.listDevices();
    const device = deviceId ? devices.find((candidate) => candidate.id === deviceId) : devices.find((candidate) => candidate.isAuthorized);
    if (!device) {
      throw new Error(
        deviceId ? `No available iOS simulator or paired device found with identifier "${deviceId}".` : "No booted iOS simulator or connected, paired iOS device found."
      );
    }
    if (!device.isAuthorized) {
      throw new Error(`iOS device "${device.model}" is not paired with this Mac.`);
    }
    const tmpDir = await import_promises.default.mkdtemp(import_node_path2.default.join(import_node_os2.default.tmpdir(), "adbsnap-ios-"));
    const tmpFile = import_node_path2.default.join(tmpDir, "capture.png");
    try {
      if (device.type === "emulator") {
        await this.execute(
          "xcrun",
          ["simctl", "io", device.id, "screenshot", tmpFile],
          { timeout: 12e4, maxBuffer: 50 * 1024 * 1024 }
        );
      } else {
        await this.execute(
          "xcrun",
          [
            "devicectl",
            "device",
            "capture",
            "screenshot",
            "--device",
            device.id,
            "--destination",
            tmpFile,
            "--quiet"
          ],
          { timeout: 12e4, maxBuffer: 50 * 1024 * 1024 }
        );
      }
      const screenshot = await import_promises.default.readFile(tmpFile);
      if (screenshot.length === 0) {
        throw new Error(`Received empty screenshot from iOS device "${device.model}".`);
      }
      return screenshot;
    } finally {
      await import_promises.default.rm(tmpDir, { recursive: true, force: true });
    }
  }
};
var iosDriver = new IOSDriver();

// ../lib/devices.ts
async function listAllDevices() {
  const [androidDevices, iosDevices] = await Promise.all([
    androidDriver.listDevices().catch(() => []),
    iosDriver.listDevices().catch(() => [])
  ]);
  return [...androidDevices, ...iosDevices];
}

// ../lib/crawler.ts
function escapeAdbText(text) {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/ /g, "%s").replace(/&/g, "\\&").replace(/</g, "\\<").replace(/>/g, "\\>").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/;/g, "\\;").replace(/\|/g, "\\|").replace(/\$/g, "\\$");
}
function parseBounds(raw) {
  const m = raw.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!m) {
    return { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }
  const x1 = parseInt(m[1], 10);
  const y1 = parseInt(m[2], 10);
  const x2 = parseInt(m[3], 10);
  const y2 = parseInt(m[4], 10);
  return {
    x1,
    y1,
    x2,
    y2,
    width: x2 - x1,
    height: y2 - y1,
    centerX: Math.round((x1 + x2) / 2),
    centerY: Math.round((y1 + y2) / 2)
  };
}
function parseHierarchyXml(xmlContent) {
  const hierarchyMatch = xmlContent.match(/<hierarchy[^>]*>([\s\S]*?)<\/hierarchy>/i);
  if (!hierarchyMatch) {
    throw new Error("No valid <hierarchy> tag found in UI automator output.");
  }
  const innerXml = hierarchyMatch[1];
  const tagRegex = /<node\b([^>]*?)(\/?)>|<\/node>/gi;
  const attrRegex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
  const root = [];
  const flat = [];
  const stack = [];
  let match;
  while ((match = tagRegex.exec(innerXml)) !== null) {
    const fullTag = match[0];
    const rawAttrs = match[1];
    const isSelfClosing = match[2] === "/";
    if (fullTag.startsWith("</")) {
      stack.pop();
      continue;
    }
    const attrs = {};
    let attrMatch;
    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }
    const bounds = parseBounds(attrs["bounds"] || "");
    const node = {
      index: parseInt(attrs["index"] || "0", 10),
      text: attrs["text"] || "",
      resourceId: attrs["resource-id"] || "",
      className: attrs["class"] || "",
      packageName: attrs["package"] || "",
      contentDesc: attrs["content-desc"] || "",
      bounds,
      clickable: attrs["clickable"] === "true",
      enabled: attrs["enabled"] === "true",
      focused: attrs["focused"] === "true",
      scrollable: attrs["scrollable"] === "true",
      password: attrs["password"] === "true",
      selected: attrs["selected"] === "true",
      children: []
    };
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node);
    } else {
      root.push(node);
    }
    flat.push(node);
    if (!isSelfClosing) {
      stack.push(node);
    }
  }
  return { root, flat };
}
function findNodes(flat, selector) {
  return flat.filter((node) => {
    if (selector.clickable !== void 0 && node.clickable !== selector.clickable) {
      return false;
    }
    if (selector.className && node.className !== selector.className) {
      return false;
    }
    if (selector.text !== void 0) {
      if (typeof selector.text === "string") {
        const query = selector.text.toLowerCase();
        if (!node.text.toLowerCase().includes(query)) return false;
      } else if (!selector.text.test(node.text)) {
        return false;
      }
    }
    if (selector.resourceId !== void 0) {
      if (typeof selector.resourceId === "string") {
        const query = selector.resourceId.toLowerCase();
        if (!node.resourceId.toLowerCase().includes(query)) return false;
      } else if (!selector.resourceId.test(node.resourceId)) {
        return false;
      }
    }
    if (selector.contentDesc !== void 0) {
      if (typeof selector.contentDesc === "string") {
        const query = selector.contentDesc.toLowerCase();
        if (!node.contentDesc.toLowerCase().includes(query)) return false;
      } else if (!selector.contentDesc.test(node.contentDesc)) {
        return false;
      }
    }
    return true;
  });
}
function findNode(flat, selector) {
  const results = findNodes(flat, selector);
  return results[0];
}
function findNavigationTabs(flat) {
  if (flat.length === 0) return [];
  const maxY = Math.max(...flat.map((n) => n.bounds.y2));
  const bottomThreshold = maxY * 0.72;
  const bottomNodes = flat.filter((n) => {
    const isBottom = n.bounds.centerY >= bottomThreshold;
    const hasLabel = Boolean(n.text.trim() || n.contentDesc.trim());
    return isBottom && hasLabel;
  });
  if (bottomNodes.length === 0) return [];
  const rows = /* @__PURE__ */ new Map();
  for (const node of bottomNodes) {
    let matchedRowKey = null;
    for (const key of rows.keys()) {
      if (Math.abs(key - node.bounds.centerY) <= 50) {
        matchedRowKey = key;
        break;
      }
    }
    if (matchedRowKey !== null) {
      rows.get(matchedRowKey).push(node);
    } else {
      rows.set(node.bounds.centerY, [node]);
    }
  }
  let bestRow = [];
  for (const row of rows.values()) {
    if (row.length >= 2 && row.length <= 8) {
      if (row.length > bestRow.length) {
        bestRow = row;
      }
    }
  }
  if (bestRow.length === 0) return [];
  bestRow.sort((a, b) => a.bounds.centerX - b.bounds.centerX);
  const uniqueTabs = [];
  for (const node of bestRow) {
    const title = (node.text || node.contentDesc || `Tab ${uniqueTabs.length + 1}`).trim();
    const isDuplicate = uniqueTabs.some(
      (t) => Math.abs(t.bounds.centerX - node.bounds.centerX) < 60 || t.title.toLowerCase() === title.toLowerCase()
    );
    if (!isDuplicate) {
      uniqueTabs.push({
        title,
        bounds: node.bounds,
        node
      });
    }
  }
  return uniqueTabs;
}
var UiCrawler = class {
  /**
   * Dumps and parses active screen UI hierarchy into structured nodes.
   */
  async dumpHierarchy(deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    const rawOutput = await androidDriver.exec([...prefix, ...ADB_COMMANDS.UIAUTOMATOR_DUMP]);
    return parseHierarchyXml(rawOutput);
  }
  /**
   * Simulates a screen tap at exact pixel coordinates.
   */
  async tap(x, y, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    await androidDriver.exec([...prefix, ...ADB_COMMANDS.INPUT_TAP(x, y)]);
  }
  /**
   * Types text into the currently focused input field.
   */
  async typeText(text, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    const escaped = escapeAdbText(text);
    await androidDriver.exec([...prefix, ...ADB_COMMANDS.INPUT_TEXT(escaped)]);
  }
  /**
   * Dispatches a key event (e.g. 66 for Enter, 4 for Back).
   */
  async pressKey(keyCode, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    await androidDriver.exec([...prefix, ...ADB_COMMANDS.INPUT_KEY(keyCode)]);
  }
  /**
   * Simulates a swipe motion between two coordinates.
   */
  async swipe(x1, y1, x2, y2, durationMs = 300, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    await androidDriver.exec([...prefix, ...ADB_COMMANDS.INPUT_SWIPE(x1, y1, x2, y2, durationMs)]);
  }
  /**
   * Finds an element on the active screen and taps its center coordinates.
   */
  async tapElement(selector, deviceId) {
    const { flat } = await this.dumpHierarchy(deviceId);
    const target = findNode(flat, selector);
    if (!target) {
      const summary = flat.filter((n) => n.text || n.contentDesc || n.resourceId).slice(0, 10).map((n) => `"${n.text || n.contentDesc || n.resourceId}"`).join(", ");
      throw new Error(
        `Element matching ${JSON.stringify(selector)} not found. Sample elements on screen: [${summary}]`
      );
    }
    await this.tap(target.bounds.centerX, target.bounds.centerY, deviceId);
    return target;
  }
  /**
   * Focuses an element (e.g. EditText) by tapping it, pauses, and types text.
   */
  async tapAndType(selector, text, deviceId, focusDelayMs = 300) {
    const node = await this.tapElement(selector, deviceId);
    if (focusDelayMs > 0) {
      await new Promise((r) => setTimeout(r, focusDelayMs));
    }
    await this.typeText(text, deviceId);
    return node;
  }
  /**
   * Repeatedly inspects the UI hierarchy until animations/spinners stabilize.
   */
  async waitForLayoutSettle(timeoutMs = 4e3, checkIntervalMs = 400, deviceId) {
    const startTime = performance.now();
    let previousCount = -1;
    while (performance.now() - startTime < timeoutMs) {
      try {
        const { flat } = await this.dumpHierarchy(deviceId);
        if (flat.length === previousCount && flat.length > 5) {
          return;
        }
        previousCount = flat.length;
      } catch {
      }
      await new Promise((r) => setTimeout(r, checkIntervalMs));
    }
  }
  /**
   * Discovers bottom navigation tabs and sequentially clicks each tab,
   * waiting for the screen to settle and capturing pristine screenshot buffers.
   */
  async crawlTabs(deviceId, onProgress) {
    const { flat } = await this.dumpHierarchy(deviceId);
    const tabs = findNavigationTabs(flat);
    if (tabs.length === 0) {
      throw new Error("No bottom navigation tab bar detected on the active screen.");
    }
    const results = [];
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      if (onProgress) onProgress(tab, i, tabs.length);
      const start = performance.now();
      await this.tap(tab.bounds.centerX, tab.bounds.centerY, deviceId);
      await new Promise((r) => setTimeout(r, 600));
      const screenshotBuffer = await androidDriver.captureScreenshot(deviceId);
      const elapsedMs = Math.round(performance.now() - start);
      results.push({
        tabIndex: i + 1,
        title: tab.title,
        screenshotBuffer,
        elapsedMs
      });
    }
    return results;
  }
  /**
   * Auto-detects login input fields and injects credentials to solve the empty-screen problem.
   */
  async autoLogin(credentials, deviceId) {
    if (!credentials.username && !credentials.password) return false;
    const { flat } = await this.dumpHierarchy(deviceId);
    const userField = flat.find(
      (n) => (n.className.includes("EditText") || n.clickable) && !n.password && (n.text.toLowerCase().includes("email") || n.text.toLowerCase().includes("user") || n.resourceId.toLowerCase().includes("email") || n.resourceId.toLowerCase().includes("user"))
    );
    const passField = flat.find(
      (n) => n.password || n.className.includes("EditText") && (n.text.toLowerCase().includes("pass") || n.resourceId.toLowerCase().includes("pass"))
    );
    let typed = false;
    if (userField && credentials.username) {
      await this.tap(userField.bounds.centerX, userField.bounds.centerY, deviceId);
      await new Promise((r) => setTimeout(r, 200));
      await this.typeText(credentials.username, deviceId);
      typed = true;
    }
    if (passField && credentials.password) {
      await this.tap(passField.bounds.centerX, passField.bounds.centerY, deviceId);
      await new Promise((r) => setTimeout(r, 200));
      await this.typeText(credentials.password, deviceId);
      typed = true;
    }
    if (typed) {
      const submitBtn = flat.find(
        (n) => n.clickable && (n.text.toLowerCase().includes("sign in") || n.text.toLowerCase().includes("log in") || n.text.toLowerCase().includes("login") || n.text.toLowerCase().includes("continue"))
      );
      if (submitBtn) {
        await new Promise((r) => setTimeout(r, 300));
        await this.tap(submitBtn.bounds.centerX, submitBtn.bounds.centerY, deviceId);
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
    return typed;
  }
};
var uiCrawler = new UiCrawler();

// src/clipboard.ts
var import_promises2 = __toESM(require("node:fs/promises"));
var import_node_path3 = __toESM(require("node:path"));
var import_node_os3 = __toESM(require("node:os"));
var import_node_child_process3 = require("node:child_process");
async function copyImageBufferToClipboard(buffer) {
  const tempPath = import_node_path3.default.join(import_node_os3.default.tmpdir(), `adbsnap-clip-${Date.now()}.png`);
  await import_promises2.default.writeFile(tempPath, buffer);
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
        (0, import_node_child_process3.execFile)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", psCommand], (err, _stdout, stderr) => {
          if (err) {
            reject(new Error(`Clipboard error: ${stderr || err.message}`));
          } else {
            resolve();
          }
        });
      });
    } else if (platform === "darwin") {
      await new Promise((resolve, reject) => {
        (0, import_node_child_process3.execFile)(
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
        (0, import_node_child_process3.execFile)("xclip", ["-selection", "clipboard", "-t", "image/png", "-i", tempPath], (err) => {
          if (err) {
            (0, import_node_child_process3.execFile)("wl-copy", ["-t", "image/png"], { input: buffer }, (err2) => {
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
        await import_promises2.default.unlink(tempPath);
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
  // Auto-reconnect state
  lastWirelessEndpoint = null;
  isAutoReconnecting = false;
  reconnectAttempts = 0;
  maxAutoReconnectAttempts = 4;
  onDidDeviceChange = new vscode.EventEmitter();
  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = "adbsnap.openMenu";
    this.statusBarItem.text = "$(device-mobile) ADBSnap: Initializing...";
    this.statusBarItem.tooltip = "ADBSnap: Click to open Mobile Command Center";
    this.statusBarItem.show();
    this.refresh();
    this.pollInterval = setInterval(() => this.refresh(), 8e3);
  }
  setLastWirelessEndpoint(endpoint) {
    this.lastWirelessEndpoint = endpoint;
    if (endpoint) {
      this.reconnectAttempts = 0;
    }
  }
  getLastWirelessEndpoint() {
    return this.lastWirelessEndpoint;
  }
  async refresh() {
    if (this.isRefreshing) return [];
    this.isRefreshing = true;
    try {
      const devices = await listAllDevices();
      if (devices.length === 0 && this.lastWirelessEndpoint && !this.isAutoReconnecting && this.reconnectAttempts < this.maxAutoReconnectAttempts) {
        this.attemptAutoReconnect(false);
      }
      if (devices.length === 0) {
        if (!this.isAutoReconnecting) {
          this.activeDevice = null;
          if (this.lastWirelessEndpoint) {
            this.statusBarItem.text = `$(sync) Reconnect ${this.lastWirelessEndpoint}`;
            this.statusBarItem.tooltip = `Wi-Fi device (${this.lastWirelessEndpoint}) is disconnected.
Click to reconnect.`;
            this.statusBarItem.command = "adbsnap.reconnectDevice";
          } else {
            this.statusBarItem.text = "$(device-mobile) No Device";
            this.statusBarItem.tooltip = "No mobile devices found. Click to open Command Center or connect over Wi-Fi.";
            this.statusBarItem.command = "adbsnap.openMenu";
          }
          this.statusBarItem.backgroundColor = void 0;
          this.onDidDeviceChange.fire(null);
        }
      } else {
        const currentStillAttached = devices.find((d) => d.id === this.activeDevice?.id);
        if (currentStillAttached) {
          this.activeDevice = currentStillAttached;
        } else {
          const firstReady = devices.find((d) => d.isAuthorized);
          this.activeDevice = firstReady || devices[0];
        }
        if (this.activeDevice?.type === "wifi" && this.activeDevice.id.includes(":")) {
          this.lastWirelessEndpoint = this.activeDevice.id;
          this.reconnectAttempts = 0;
        }
        if (!this.activeDevice.isAuthorized) {
          this.statusBarItem.text = `$(alert) ${this.activeDevice.model} (Unauthorized)`;
          this.statusBarItem.tooltip = this.activeDevice.platform === "ios" ? `Device ${this.activeDevice.id} must be paired and trusted with this Mac.` : `Device ${this.activeDevice.id} requires USB debugging authorization on the device screen.`;
          this.statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
        } else {
          const typeBadge = this.activeDevice.platform === "ios" ? this.activeDevice.type === "emulator" ? "iOS Sim" : "iOS" : this.activeDevice.type === "wifi" ? "Wi-Fi" : this.activeDevice.type === "emulator" ? "Emu" : "USB";
          this.statusBarItem.text = `$(device-mobile) ${this.activeDevice.model} (${typeBadge})`;
          this.statusBarItem.tooltip = `Active Target: ${this.activeDevice.model} [${this.activeDevice.id}]
Click to switch devices.`;
          this.statusBarItem.backgroundColor = void 0;
        }
        this.onDidDeviceChange.fire(this.activeDevice);
      }
      return devices;
    } catch {
      this.statusBarItem.text = "$(alert) Device Scan Failed";
      this.statusBarItem.tooltip = "Device discovery failed. Check ADB and Xcode command-line tool configuration.";
      this.statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
      return [];
    } finally {
      this.isRefreshing = false;
    }
  }
  /**
   * Attempts automatic background reconnection to the last known Wi-Fi device.
   */
  async attemptAutoReconnect(manual = false) {
    if (!this.lastWirelessEndpoint || this.isAutoReconnecting) return false;
    this.isAutoReconnecting = true;
    const endpoint = this.lastWirelessEndpoint;
    const [ip, portStr] = endpoint.split(":");
    const port = portStr ? Number(portStr) : 5555;
    this.statusBarItem.text = `$(sync~spin) Reconnecting ${endpoint}...`;
    this.statusBarItem.tooltip = `Attempting wireless reconnect to ${endpoint} (Attempt ${this.reconnectAttempts + 1}/${this.maxAutoReconnectAttempts})`;
    this.statusBarItem.backgroundColor = void 0;
    try {
      const res = await androidDriver.connectWifi(ip, port);
      if (res.success) {
        this.reconnectAttempts = 0;
        this.isAutoReconnecting = false;
        await this.refresh();
        vscode.window.showInformationMessage(`\u{1F4F6} ADBSnap: Reconnected to wireless device (${endpoint})!`);
        return true;
      } else {
        this.reconnectAttempts++;
        if (manual) {
          vscode.window.showWarningMessage(`\u274C Wireless reconnect failed for ${endpoint}: ${res.message}`);
        }
      }
    } catch (err) {
      this.reconnectAttempts++;
      if (manual) {
        vscode.window.showErrorMessage(`\u274C Wireless reconnect error: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      this.isAutoReconnecting = false;
    }
    return false;
  }
  getActiveDevice() {
    return this.activeDevice;
  }
  setActiveDevice(device) {
    this.activeDevice = device;
    if (device.type === "wifi" && device.id.includes(":")) {
      this.lastWirelessEndpoint = device.id;
      this.reconnectAttempts = 0;
    }
    const typeBadge = device.platform === "ios" ? device.type === "emulator" ? "iOS Sim" : "iOS" : device.type === "wifi" ? "Wi-Fi" : device.type === "emulator" ? "Emu" : "USB";
    this.statusBarItem.text = `$(device-mobile) ${device.model} (${typeBadge})`;
    this.statusBarItem.tooltip = `Active Target: ${device.model} [${device.id}]
Click to switch devices.`;
    this.statusBarItem.backgroundColor = void 0;
    this.onDidDeviceChange.fire(device);
  }
  dispose() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.statusBarItem.dispose();
    this.onDidDeviceChange.dispose();
  }
};

// src/cli.ts
var import_node_child_process4 = require("node:child_process");
var import_node_path4 = __toESM(require("node:path"));
var import_node_fs2 = __toESM(require("node:fs"));
function resolveNodeBinary() {
  if (process.execPath && /node(?:\.exe)?$/i.test(process.execPath)) {
    return process.execPath;
  }
  if (process.platform === "win32") {
    try {
      const out = (0, import_node_child_process4.execSync)("where.exe node", { encoding: "utf-8", timeout: 3e3 });
      const firstLine = out.split(/\r?\n/).find((l) => l.trim().length > 0);
      if (firstLine && import_node_fs2.default.existsSync(firstLine.trim())) {
        return firstLine.trim();
      }
    } catch {
    }
    const candidates = [
      process.env.PROGRAMFILES ? import_node_path4.default.join(process.env.PROGRAMFILES, "nodejs", "node.exe") : "",
      process.env["PROGRAMFILES(X86)"] ? import_node_path4.default.join(process.env["PROGRAMFILES(X86)"], "nodejs", "node.exe") : "",
      process.env.LOCALAPPDATA ? import_node_path4.default.join(process.env.LOCALAPPDATA, "Programs", "nodejs", "node.exe") : "",
      "C:\\nvm4w\\nodejs\\node.exe"
    ].filter(Boolean);
    for (const c of candidates) {
      if (import_node_fs2.default.existsSync(c)) return c;
    }
  } else {
    try {
      const out = (0, import_node_child_process4.execSync)("which node", { encoding: "utf-8", timeout: 3e3 });
      const line = out.trim();
      if (line && import_node_fs2.default.existsSync(line)) {
        return line;
      }
    } catch {
    }
  }
  return "node";
}
function resolveCliRunner(extensionPath) {
  const bundledCli = import_node_path4.default.resolve(extensionPath, "dist", "bin", "cli.js");
  if (import_node_fs2.default.existsSync(bundledCli)) {
    return {
      command: resolveNodeBinary(),
      prefixArgs: [bundledCli],
      label: `node ${bundledCli}`,
      shell: false
    };
  }
  const localCli = import_node_path4.default.resolve(extensionPath, "..", "dist", "bin", "cli.js");
  if (import_node_fs2.default.existsSync(localCli)) {
    return {
      command: resolveNodeBinary(),
      prefixArgs: [localCli],
      label: `node ${localCli}`,
      shell: false
    };
  }
  const localSrcCli = import_node_path4.default.resolve(extensionPath, "..", "bin", "cli.ts");
  if (import_node_fs2.default.existsSync(localSrcCli)) {
    const tsxBin = import_node_path4.default.resolve(extensionPath, "..", "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
    if (import_node_fs2.default.existsSync(tsxBin)) {
      return {
        command: tsxBin,
        prefixArgs: [localSrcCli],
        label: `tsx ${localSrcCli}`,
        shell: process.platform === "win32"
      };
    }
  }
  const isWin = process.platform === "win32";
  return {
    command: isWin ? "npx.cmd" : "npx",
    prefixArgs: ["adbsnap"],
    label: "npx adbsnap",
    shell: isWin
  };
}
async function runAdbSnapCli(extensionPath, args, timeoutMs = 3e4) {
  const runner = resolveCliRunner(extensionPath);
  const cwd = import_node_fs2.default.existsSync(import_node_path4.default.resolve(extensionPath, "..", "package.json")) ? import_node_path4.default.resolve(extensionPath, "..") : extensionPath;
  return new Promise((resolve) => {
    (0, import_node_child_process4.execFile)(
      runner.command,
      [...runner.prefixArgs, ...args],
      {
        timeout: timeoutMs,
        maxBuffer: 50 * 1024 * 1024,
        cwd,
        shell: runner.shell || process.platform === "win32" && (runner.command.endsWith(".cmd") || runner.command.endsWith(".bat")),
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
    const typeLabel = device.platform === "ios" ? device.type === "emulator" ? "iOS Simulator" : `iOS ${device.type === "wifi" ? "Wi-Fi" : "Device"}` : device.type === "wifi" ? "Wi-Fi" : device.type === "emulator" ? "Emulator" : "USB";
    this.description = `${device.id} \u2022 ${typeLabel}${isActive ? " (Active)" : ""}`;
    if (!device.isAuthorized) {
      const authorizationHelp = device.platform === "ios" ? "Pair and trust this Mac on the device" : "Confirm USB debugging on the phone";
      this.tooltip = `Device: ${device.model} (${device.id})
Status: Unauthorized (${authorizationHelp})`;
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
var DisconnectedDeviceTreeItem = class extends vscode2.TreeItem {
  constructor(endpoint) {
    super(`Android Device (${endpoint})`, vscode2.TreeItemCollapsibleState.None);
    this.endpoint = endpoint;
    this.description = `${endpoint} \u2022 Wi-Fi (Offline - Click to Reconnect)`;
    this.tooltip = `Known wireless device at ${endpoint}.
Click to reconnect over Wi-Fi.`;
    this.iconPath = new vscode2.ThemeIcon("radio-tower", new vscode2.ThemeColor("disabledForeground"));
    this.contextValue = "device-wifi-offline";
    this.command = {
      command: "adbsnap.reconnectDevice",
      title: "Reconnect Wireless Device",
      arguments: [endpoint]
    };
  }
  endpoint;
};
var DevicesTreeDataProvider = class {
  constructor(statusBarManager2) {
    this.statusBarManager = statusBarManager2;
    statusBarManager2.onDidDeviceChange.event(() => {
      this.refresh();
    });
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
      this.devices = await listAllDevices();
      const activeDevice = this.statusBarManager.getActiveDevice();
      const items = [];
      for (const dev of this.devices) {
        items.push(new DeviceTreeItem(dev, activeDevice?.id === dev.id));
      }
      const lastEndpoint = this.statusBarManager.getLastWirelessEndpoint();
      if (lastEndpoint && !this.devices.some((d) => d.id === lastEndpoint)) {
        items.push(new DisconnectedDeviceTreeItem(lastEndpoint));
      }
      return items;
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
var import_node_path5 = __toESM(require("node:path"));
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
        const ext = import_node_path5.default.extname(entry.name).toLowerCase();
        if (entry.isFile() && [".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".zip"].includes(ext)) {
          const fullPath = import_node_path5.default.join(outDir, entry.name);
          const stats = import_node_fs3.default.statSync(fullPath);
          items.push(new CaptureTreeItem(fullPath, entry.name, stats));
        } else if (entry.isDirectory() && entry.name.startsWith("export-")) {
          const subDir = import_node_path5.default.join(outDir, entry.name);
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

// src/views/controlCenterProvider.ts
var vscode4 = __toESM(require("vscode"));
var ControlCenterViewProvider = class {
  constructor(context, statusBarManager2, resolveOutputDir2) {
    this.context = context;
    this.statusBarManager = statusBarManager2;
    this.resolveOutputDir = resolveOutputDir2;
  }
  context;
  statusBarManager;
  resolveOutputDir;
  static viewType = "adbsnap.controlCenterView";
  _view;
  resolveWebviewView(webviewView, _context, _token) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode4.Uri.file(this.context.extensionPath)]
    };
    webviewView.webview.html = this.getHtmlContent();
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refresh();
      }
    });
    webviewView.onDidDispose(() => {
      this._view = void 0;
    });
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "snap":
          await vscode4.commands.executeCommand("adbsnap.snap");
          break;
        case "snapAs":
          await vscode4.commands.executeCommand("adbsnap.snapAs");
          break;
        case "snapClipboard":
          await vscode4.commands.executeCommand("adbsnap.snapClipboard");
          break;
        case "recordScreen":
          await vscode4.commands.executeCommand("adbsnap.recordScreen");
          break;
        case "explore":
          await vscode4.commands.executeCommand("adbsnap.explore");
          break;
        case "openStudio":
          await vscode4.commands.executeCommand("adbsnap.openStudio");
          break;
        case "reconnect":
          await vscode4.commands.executeCommand("adbsnap.reconnectDevice", message.endpoint);
          break;
        case "connectIp":
          await vscode4.commands.executeCommand("adbsnap.connectIp");
          break;
        case "wifi":
          await vscode4.commands.executeCommand("adbsnap.wifi");
          break;
        case "disconnectWifi":
          await vscode4.commands.executeCommand("adbsnap.disconnectWifi");
          break;
        case "devices":
          await vscode4.commands.executeCommand("adbsnap.devices");
          break;
        case "key":
          await vscode4.commands.executeCommand(`adbsnap.key${message.key}`);
          break;
        case "selectOutputDir":
          await vscode4.commands.executeCommand("adbsnap.selectOutputDir");
          break;
        case "revealOutputDir":
          await vscode4.commands.executeCommand("revealFileInOS", vscode4.Uri.file(this.resolveOutputDir()));
          break;
        case "updateSetting": {
          const config = vscode4.workspace.getConfiguration("adbsnap");
          await config.update(message.key, message.value, vscode4.ConfigurationTarget.Global);
          this.refresh();
          break;
        }
      }
    });
    this.refresh();
  }
  refresh() {
    if (!this._view) return;
    const state = this.getCurrentState();
    this._view.webview.postMessage({ type: "updateState", state });
  }
  getCurrentState() {
    const active = this.statusBarManager.getActiveDevice();
    const config = vscode4.workspace.getConfiguration("adbsnap");
    const recentWifi = this.context.globalState.get("adbsnap.recentWifiEndpoints") || [];
    const lastWifi = this.statusBarManager.getLastWirelessEndpoint() || this.context.globalState.get("adbsnap.lastWifiEndpoint") || null;
    return {
      activeDevice: active ? {
        id: active.id,
        model: active.model,
        platform: active.platform,
        type: active.type,
        isAuthorized: active.isAuthorized
      } : null,
      recentWifiEndpoints: recentWifi,
      lastWifiEndpoint: lastWifi,
      settings: {
        defaultTheme: config.get("defaultTheme") || "aurora",
        defaultFrame: config.get("defaultFrame") || "iphone-16-pro",
        defaultFormat: config.get("defaultFormat") || "png",
        defaultAspectRatio: config.get("defaultAspectRatio") || "portrait",
        outputDirectory: this.resolveOutputDir()
      }
    };
  }
  getHtmlContent() {
    const initialState = JSON.stringify(this.getCurrentState());
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https:; script-src 'unsafe-inline' https:; img-src 'self' data: https:;">
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
      <button class="btn-sec" style="flex: 1;" onclick="send('devices')">\u{1F4F1} Devices</button>
      <button class="btn-sec" style="flex: 1;" onclick="send('connectIp')">\u{1F4F6} Wi-Fi IP</button>
    </div>
  </div>

  <!-- QUICK CAPTURE ACTIONS -->
  <div class="section-title">Quick Actions</div>
  <div class="action-grid">
    <button class="btn-primary" onclick="send('snap')">\u{1F4F8} Quick Snap</button>
    <button class="btn-sec" onclick="send('snapClipboard')">\u{1F4CB} To Clipboard</button>
    <button class="btn-sec" onclick="send('snapAs')">\u{1F4BE} Snap As...</button>
    <button class="btn-sec" onclick="send('explore')">\u{1F577}\uFE0F Crawl Tabs</button>
  </div>
  <div class="btn-row" style="margin-bottom: 8px;">
    <button class="btn-sec" style="flex: 1;" onclick="send('recordScreen')">\u{1F3A5} Record Screen</button>
    <button class="studio-btn" style="flex: 1.2;" onclick="send('openStudio')">\u{1F3A8} Asset Studio</button>
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
        <option value="aurora">Electric Aurora (Indigo \u2794 Cyan \u2794 Emerald)</option>
        <option value="studioLight">Apple Studio Light</option>
        <option value="freshMint">Fresh Mint (Teal \u2794 Emerald)</option>
        <option value="sunset">Warm Sunset (Rose \u2794 Amber)</option>
        <option value="midnight">Deep Midnight</option>
        <option value="royal">Royal Orchid (Violet \u2794 Fuchsia)</option>
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
          <option value="portrait">\u{1F4F1} Portrait 9:19.5</option>
          <option value="landscape">\u{1F5A5}\uFE0F Landscape 16:9</option>
          <option value="square">\u{1F532} Square 1:1</option>
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
        <button class="btn-sec" style="padding: 2px 5px;" onclick="send('selectOutputDir')">\u{1F4C1} Change</button>
        <button class="btn-sec" style="padding: 2px 5px;" onclick="send('revealOutputDir')">\u2197 Open</button>
      </div>
    </div>
  </div>

  <!-- REMOTE HARDWARE CONTROLLER -->
  <div class="section-title">Remote Phone Controls</div>
  <div class="remote-grid">
    <button class="btn-sec remote-btn" onclick="send('key', { key: 'Back' })">
      <span>\u25C0</span>
      <span>Back</span>
    </button>
    <button class="btn-sec remote-btn" onclick="send('key', { key: 'Home' })">
      <span>\u{1F518}</span>
      <span>Home</span>
    </button>
    <button class="btn-sec remote-btn" onclick="send('key', { key: 'Recents' })">
      <span>\u{1F532}</span>
      <span>Recents</span>
    </button>
    <button class="btn-sec remote-btn" onclick="send('key', { key: 'Power' })">
      <span>\u{1F512}</span>
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
        sub.innerText = dev.id + (dev.isAuthorized ? ' \u2022 Ready' : ' \u2022 Unauthorized');
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
              \u{1F504} Reconnect to \${lastWifi}
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
};

// src/studio/studioWebview.ts
var vscode5 = __toESM(require("vscode"));
var import_node_path6 = __toESM(require("node:path"));
var import_node_net = __toESM(require("node:net"));
var import_node_child_process5 = require("node:child_process");
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = import_node_net.default.createServer().once("error", () => resolve(false)).once("listening", () => {
      tester.once("close", () => resolve(true)).close();
    }).listen(port, "127.0.0.1");
  });
}
async function findAvailablePort(startPort) {
  let port = startPort;
  while (!await isPortAvailable(port)) {
    port++;
    if (port > startPort + 50) break;
  }
  return port;
}
async function waitForStudioServer(port, timeoutMs = 7e3) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/devices`, {
        signal: AbortSignal.timeout(500)
      });
      if (res.ok) return true;
    } catch {
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}
var StudioWebviewManager = class _StudioWebviewManager {
  static currentPanel = null;
  static studioProcess = null;
  static activePort = null;
  static isStarting = false;
  static async createOrShow(context, statusBarManager2, resolveOutputDir2, onCaptureSaved) {
    const column = vscode5.window.activeTextEditor ? vscode5.window.activeTextEditor.viewColumn : void 0;
    if (_StudioWebviewManager.currentPanel) {
      _StudioWebviewManager.currentPanel.reveal(column);
      return;
    }
    const panel = vscode5.window.createWebviewPanel(
      "adbsnapStudio",
      "ADBSnap Studio \u{1F3A8}",
      column || vscode5.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode5.Uri.file(context.extensionPath)]
      }
    );
    _StudioWebviewManager.currentPanel = panel;
    panel.webview.html = _StudioWebviewManager.getLoadingHtml();
    panel.onDidDispose(() => {
      _StudioWebviewManager.currentPanel = null;
    });
    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "openExternal" && message.url) {
        vscode5.env.openExternal(vscode5.Uri.parse(message.url));
      } else if (message.command === "reload") {
        if (_StudioWebviewManager.activePort) {
          panel.webview.html = _StudioWebviewManager.getStudioIframeHtml(_StudioWebviewManager.activePort);
        }
      }
    });
    try {
      const port = await _StudioWebviewManager.ensureStudioServer(context);
      _StudioWebviewManager.activePort = port;
      panel.webview.html = _StudioWebviewManager.getStudioIframeHtml(port);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      panel.webview.html = _StudioWebviewManager.getErrorHtml(errMsg);
    }
  }
  /**
   * Ensures the local ADBSnap studio server is alive and returns the listening port.
   */
  static async ensureStudioServer(context) {
    if (_StudioWebviewManager.activePort) {
      const alive = await waitForStudioServer(_StudioWebviewManager.activePort, 800);
      if (alive) return _StudioWebviewManager.activePort;
    }
    if (await waitForStudioServer(3e3, 400)) {
      _StudioWebviewManager.activePort = 3e3;
      return 3e3;
    }
    const targetPort = await findAvailablePort(3300);
    const bundledCli = import_node_path6.default.resolve(context.extensionPath, "dist", "bin", "cli.js");
    const localCli = import_node_path6.default.resolve(context.extensionPath, "..", "dist", "bin", "cli.js");
    const localSrcCli = import_node_path6.default.resolve(context.extensionPath, "..", "bin", "cli.ts");
    const rootDir = await fileExists(import_node_path6.default.resolve(context.extensionPath, "..", "package.json")) ? import_node_path6.default.resolve(context.extensionPath, "..") : context.extensionPath;
    const nodeBin = resolveNodeBinary();
    let cmd = nodeBin;
    let args = [];
    if (await fileExists(bundledCli)) {
      cmd = nodeBin;
      args = [bundledCli, "studio", "--port", String(targetPort), "--no-open"];
    } else if (await fileExists(localCli)) {
      cmd = nodeBin;
      args = [localCli, "studio", "--port", String(targetPort), "--no-open"];
    } else if (await fileExists(localSrcCli)) {
      const tsxBin = import_node_path6.default.resolve(rootDir, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
      cmd = tsxBin;
      args = [localSrcCli, "studio", "--port", String(targetPort), "--no-open"];
    } else {
      cmd = process.platform === "win32" ? "npx.cmd" : "npx";
      args = ["adbsnap", "studio", "--port", String(targetPort), "--no-open"];
    }
    if (_StudioWebviewManager.studioProcess) {
      try {
        _StudioWebviewManager.studioProcess.kill();
      } catch {
      }
      _StudioWebviewManager.studioProcess = null;
    }
    const child = (0, import_node_child_process5.spawn)(cmd, args, {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0" },
      windowsHide: true,
      shell: process.platform === "win32" && (cmd.endsWith(".cmd") || cmd.endsWith(".bat"))
    });
    _StudioWebviewManager.studioProcess = child;
    child.on("error", (err) => {
      console.error("ADBSnap Studio server process error:", err);
    });
    child.on("exit", () => {
      if (_StudioWebviewManager.studioProcess === child) {
        _StudioWebviewManager.studioProcess = null;
        _StudioWebviewManager.activePort = null;
      }
    });
    const isUp = await waitForStudioServer(targetPort, 8e3);
    if (!isUp) {
      throw new Error(`Studio server failed to start on port ${targetPort} within 8 seconds.`);
    }
    return targetPort;
  }
  /**
   * Generates the VS Code Webview HTML containing the full React 19 Studio.
   */
  static getStudioIframeHtml(port) {
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
        <span>\u{1F504}</span> Reload
      </button>
      <button class="btn" onclick="openInBrowser()" title="Open studio in your full desktop browser">
        <span>\u{1F310}</span> Open in Browser
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
  </script>
</body>
</html>`;
  }
  static getLoadingHtml() {
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
  static getErrorHtml(error) {
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
  static dispose() {
    if (_StudioWebviewManager.studioProcess) {
      try {
        _StudioWebviewManager.studioProcess.kill();
      } catch {
      }
      _StudioWebviewManager.studioProcess = null;
    }
    _StudioWebviewManager.activePort = null;
    if (_StudioWebviewManager.currentPanel) {
      _StudioWebviewManager.currentPanel.dispose();
      _StudioWebviewManager.currentPanel = null;
    }
  }
};
async function fileExists(p) {
  try {
    const fs7 = await import("node:fs/promises");
    await fs7.access(p);
    return true;
  } catch {
    return false;
  }
}

// src/extension.ts
var statusBarManager;
var outputChannel;
var devicesProvider;
var capturesProvider;
var controlCenterProvider;
function activate(context) {
  outputChannel = vscode6.window.createOutputChannel("ADBSnap");
  statusBarManager = new AdbStatusBarManager();
  context.subscriptions.push(statusBarManager, outputChannel);
  const config = vscode6.workspace.getConfiguration("adbsnap");
  const customAdb = config.get("customAdbPath");
  if (customAdb && customAdb.trim().length > 0) {
    process.env.ADB_PATH = customAdb.trim();
  }
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.snap", async () => {
      await handleSnapCommand(context, { copyToClipboard: false });
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.snapClipboard", async () => {
      await handleSnapCommand(context, { copyToClipboard: true });
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.snapRaw", async () => {
      await handleSnapRawCommand(context);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.devices", async () => {
      await handleSelectDeviceCommand();
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.wifi", async () => {
      await handleWifiCommand();
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.disconnectWifi", async (item) => {
      await handleDisconnectWifiCommand(context, item);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.connectIp", async () => {
      await handleConnectIpCommand(context);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.pairWifi", async () => {
      await handlePairWifiCommand(context);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.reconnectDevice", async (item) => {
      await handleReconnectCommand(context, item);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.doctor", async () => {
      await handleDoctorCommand(context);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.export", async () => {
      await handleExportCommand(context);
    })
  );
  devicesProvider = new DevicesTreeDataProvider(statusBarManager);
  capturesProvider = new CapturesTreeDataProvider(() => resolveOutputDir());
  controlCenterProvider = new ControlCenterViewProvider(
    context,
    statusBarManager,
    resolveOutputDir
  );
  context.subscriptions.push(
    vscode6.window.registerWebviewViewProvider(
      ControlCenterViewProvider.viewType,
      controlCenterProvider
    ),
    vscode6.window.registerTreeDataProvider("adbsnap.devicesView", devicesProvider),
    vscode6.window.registerTreeDataProvider("adbsnap.recentCapturesView", capturesProvider)
  );
  statusBarManager.onDidDeviceChange.event(() => {
    controlCenterProvider.refresh();
  });
  context.subscriptions.push(
    vscode6.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("adbsnap")) {
        controlCenterProvider.refresh();
      }
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.openStudio", () => {
      StudioWebviewManager.createOrShow(
        context,
        statusBarManager,
        resolveOutputDir,
        () => capturesProvider.refresh()
      );
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.refreshDevices", async () => {
      await statusBarManager.refresh();
      devicesProvider.refresh();
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.refreshCaptures", () => {
      capturesProvider.refresh();
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.setActiveDeviceFromTree", (device) => {
      if (device) {
        statusBarManager.setActiveDevice(device);
        devicesProvider.refresh();
      }
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.snapDeviceFromTree", async (item) => {
      if (item && item.device) {
        statusBarManager.setActiveDevice(item.device);
        devicesProvider.refresh();
        await handleSnapCommand(context, { copyToClipboard: false });
      }
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.revealCapture", (item) => {
      if (item && item.filePath) {
        vscode6.commands.executeCommand("revealFileInOS", vscode6.Uri.file(item.filePath));
      }
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.copyCapture", async (item) => {
      if (item && item.filePath) {
        try {
          const buf = await import_promises3.default.readFile(item.filePath);
          await copyImageBufferToClipboard(buf);
          vscode6.window.showInformationMessage(`\u{1F4F8} Copied ${item.fileName} to clipboard!`);
        } catch (err) {
          vscode6.window.showErrorMessage(`Failed to copy: ${err.message || err}`);
        }
      }
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.deleteCapture", async (item) => {
      if (item && item.filePath) {
        const confirm = await vscode6.window.showWarningMessage(
          `Delete "${item.fileName}"?`,
          { modal: true },
          "Delete"
        );
        if (confirm === "Delete") {
          try {
            await import_promises3.default.rm(item.filePath, { recursive: true, force: true });
            capturesProvider.refresh();
            vscode6.window.showInformationMessage(`Deleted ${item.fileName}`);
          } catch (err) {
            vscode6.window.showErrorMessage(`Failed to delete: ${err.message || err}`);
          }
        }
      }
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.openCaptureInStudio", (_item) => {
      StudioWebviewManager.createOrShow(
        context,
        statusBarManager,
        resolveOutputDir,
        () => capturesProvider.refresh()
      );
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.insertMarkdown", async () => {
      await handleInsertMarkdownCommand(context);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.selectFrame", async () => {
      await handleSelectFrameCommand();
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.selectTheme", async () => {
      await handleSelectThemeCommand();
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.selectFormat", async () => {
      await handleSelectFormatCommand();
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.selectAspectRatio", async () => {
      await handleSelectAspectRatioCommand();
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.toggleDemoMode", async () => {
      await handleToggleDemoModeCommand(context);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.explore", async () => {
      await handleExploreCommand(context);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.exploreIos", async () => {
      await handleExploreIosCommand(context);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.resetAppData", async () => {
      await handleResetAppDataCommand(context);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.relaunchApp", async () => {
      await handleRelaunchAppCommand(context);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.openMenu", async () => {
      await handleOpenMenuCommand(context);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.keyHome", () => handleSendKeyEventCommand(3, "Home")),
    vscode6.commands.registerCommand("adbsnap.keyBack", () => handleSendKeyEventCommand(4, "Back")),
    vscode6.commands.registerCommand("adbsnap.keyRecents", () => handleSendKeyEventCommand(187, "Recents")),
    vscode6.commands.registerCommand("adbsnap.keyPower", () => handleSendKeyEventCommand(26, "Power"))
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.sendText", async () => {
      await handleSendTextCommand();
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.openDeepLink", async () => {
      await handleOpenDeepLinkCommand();
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.recordScreen", async () => {
      await handleRecordScreenCommand(context);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.bugReport", async () => {
      await handleBugReportCommand(context);
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.selectOutputDir", async () => {
      await handleSelectOutputDirCommand();
    })
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("adbsnap.snapAs", async () => {
      await handleSnapAsCommand(context);
    })
  );
  registerMarkdownHoverProvider(context);
  const savedWifi = context.globalState.get("adbsnap.lastWifiEndpoint");
  if (savedWifi) {
    statusBarManager.setLastWirelessEndpoint(savedWifi);
    setTimeout(async () => {
      const active = statusBarManager.getActiveDevice();
      if (!active || !active.isAuthorized) {
        await statusBarManager.attemptAutoReconnect();
        devicesProvider.refresh();
      }
    }, 2e3);
  }
}
function deactivate() {
  StudioWebviewManager.dispose();
  if (statusBarManager) {
    statusBarManager.dispose();
  }
}
function resolveOutputDir() {
  const config = vscode6.workspace.getConfiguration("adbsnap");
  let outDir = config.get("outputDirectory") || "${workspaceFolder}/output";
  const workspaceFolders = vscode6.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    outDir = outDir.replace("${workspaceFolder}", workspaceFolders[0].uri.fsPath);
  } else if (outDir.includes("${workspaceFolder}")) {
    const os4 = require("node:os");
    const desktopPath = import_node_path7.default.join(os4.homedir(), "Desktop");
    const fallbackRoot = import_promises3.default.stat(desktopPath).then(() => desktopPath).catch(() => os4.homedir());
    const home = os4.homedir();
    const desktop = import_node_path7.default.join(home, "Desktop");
    let baseDir;
    try {
      require("node:fs").accessSync(desktop);
      baseDir = desktop;
    } catch {
      baseDir = home;
    }
    outDir = import_node_path7.default.join(baseDir, "ADBSnap");
  }
  return import_node_path7.default.resolve(outDir);
}
async function handleSnapCommand(context, options) {
  const device = statusBarManager.getActiveDevice();
  if (!device) {
    vscode6.window.showWarningMessage("ADBSnap: No connected ADB device found. Please attach a device or emulator.");
    return null;
  }
  if (!device.isAuthorized) {
    vscode6.window.showErrorMessage(`ADBSnap: Device "${device.model}" is unauthorized. Please accept the USB debugging prompt on the device.`);
    return null;
  }
  let resultOutput = null;
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: options.copyToClipboard ? "ADBSnap: Snapping to Clipboard..." : "ADBSnap: Capturing & Framing...",
      cancellable: false
    },
    async () => {
      try {
        const config = vscode6.workspace.getConfiguration("adbsnap");
        const theme = config.get("defaultTheme") || "aurora";
        const frame = config.get("defaultFrame") || "iphone-16-pro";
        const format = config.get("defaultFormat") || "png";
        const aspect = config.get("defaultAspectRatio") || "portrait";
        const ext = format === "jpeg" ? "jpg" : format;
        const outDir = resolveOutputDir();
        await import_promises3.default.mkdir(outDir, { recursive: true });
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const fileName = `adbsnap-${frame}-${theme}-${aspect}-${timestamp}.${ext}`;
        const filePath = import_node_path7.default.join(outDir, fileName);
        const cliArgs = [
          "snap",
          "--frame",
          frame,
          "--theme",
          theme,
          "--format",
          format,
          "--aspect",
          aspect,
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
        resultOutput = { filePath, fileName };
        if (options.copyToClipboard) {
          const imgBuffer = await import_promises3.default.readFile(filePath);
          await copyImageBufferToClipboard(Buffer.from(imgBuffer));
          vscode6.window.showInformationMessage("\u{1F4F8} ADBSnap: Framed screenshot copied to clipboard!");
        }
        if (capturesProvider) {
          capturesProvider.refresh();
        }
        if (!options.returnResult) {
          const action = await vscode6.window.showInformationMessage(
            `\u{1F4F8} Saved screenshot to ${fileName}`,
            "Open Image",
            "Reveal in Explorer"
          );
          if (action === "Open Image") {
            await vscode6.commands.executeCommand("vscode.open", vscode6.Uri.file(filePath));
          } else if (action === "Reveal in Explorer") {
            await vscode6.commands.executeCommand("revealFileInOS", vscode6.Uri.file(filePath));
          }
        }
        await checkAndPromptReview(context);
      } catch (err) {
        vscode6.window.showErrorMessage(`ADBSnap Capture Failed: ${err.message || err}`);
      }
    }
  );
  return resultOutput;
}
async function handleSnapAsCommand(context) {
  const device = statusBarManager.getActiveDevice();
  if (!device || !device.isAuthorized) {
    vscode6.window.showWarningMessage("ADBSnap: Please connect and authorize an active device first.");
    return;
  }
  const config = vscode6.workspace.getConfiguration("adbsnap");
  const format = config.get("defaultFormat") || "png";
  const ext = format === "jpeg" ? "jpg" : format;
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const defaultName = `adbsnap-custom-${timestamp}`;
  const nameInput = await vscode6.window.showInputBox({
    title: "ADBSnap: Quick Capture As...",
    prompt: `Enter file name (without .${ext})`,
    value: defaultName,
    validateInput: (v) => !v || !v.trim() ? "File name cannot be empty" : null
  });
  if (!nameInput) return;
  const cleanBaseName = nameInput.trim().replace(/\.[^/.]+$/, "");
  const customFileName = `${cleanBaseName}.${ext}`;
  const currentDir = resolveOutputDir();
  const folderChoice = await vscode6.window.showQuickPick(
    [
      { label: `$(folder) Current Folder`, description: currentDir, useCurrent: true },
      { label: `$(folder-opened) Browse for different folder...`, useCurrent: false }
    ],
    { placeHolder: "Select destination folder for this capture" }
  );
  if (!folderChoice) return;
  let targetDir = currentDir;
  if (!folderChoice.useCurrent) {
    const picked = await vscode6.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      title: "Select Destination Folder for this Capture"
    });
    if (!picked || picked.length === 0) return;
    targetDir = picked[0].fsPath;
  }
  await import_promises3.default.mkdir(targetDir, { recursive: true });
  const targetFilePath = import_node_path7.default.join(targetDir, customFileName);
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: `ADBSnap: Saving "${customFileName}"...`,
      cancellable: false
    },
    async () => {
      try {
        const theme = config.get("defaultTheme") || "aurora";
        const frame = config.get("defaultFrame") || "iphone-16-pro";
        const aspect = config.get("defaultAspectRatio") || "portrait";
        const cliArgs = [
          "snap",
          "--device",
          device.id,
          "--theme",
          theme,
          "--frame",
          frame,
          "--aspect-ratio",
          aspect,
          "--format",
          format,
          "--out",
          targetFilePath
        ];
        const result = await runAdbSnapCli(context.extensionPath, cliArgs, 3e4);
        if (result.exitCode !== 0) {
          throw new Error(result.stderr || result.stdout || "Capture failed");
        }
        if (capturesProvider) capturesProvider.refresh();
        const action = await vscode6.window.showInformationMessage(
          `\u{1F4F8} Saved: ${customFileName}`,
          "Reveal in Explorer",
          "Copy Path"
        );
        if (action === "Reveal in Explorer") {
          vscode6.commands.executeCommand("revealFileInOS", vscode6.Uri.file(targetFilePath));
        } else if (action === "Copy Path") {
          await vscode6.env.clipboard.writeText(targetFilePath);
        }
      } catch (err) {
        vscode6.window.showErrorMessage(`Capture failed: ${err.message || err}`);
      }
    }
  );
}
async function handleSelectOutputDirCommand() {
  const currentDir = resolveOutputDir();
  const options = {
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    defaultUri: vscode6.Uri.file(currentDir),
    openLabel: "Select Output Folder",
    title: "Choose ADBSnap Screenshot & Export Directory"
  };
  const selectedUri = await vscode6.window.showOpenDialog(options);
  if (!selectedUri || selectedUri.length === 0) {
    return;
  }
  const chosenPath = selectedUri[0].fsPath;
  const config = vscode6.workspace.getConfiguration("adbsnap");
  const workspaceFolders = vscode6.workspace.workspaceFolders;
  let targetScope = vscode6.ConfigurationTarget.Global;
  let savePathValue = chosenPath;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const wsRoot = workspaceFolders[0].uri.fsPath;
    if (chosenPath.startsWith(wsRoot)) {
      const relative = import_node_path7.default.relative(wsRoot, chosenPath);
      savePathValue = relative ? `\${workspaceFolder}/${relative.replace(/\\/g, "/")}` : "${workspaceFolder}";
      targetScope = vscode6.ConfigurationTarget.Workspace;
    } else {
      const scopePick = await vscode6.window.showQuickPick(
        [
          { label: "This Workspace only", scope: vscode6.ConfigurationTarget.Workspace },
          { label: "Globally (All Workspaces & Projects)", scope: vscode6.ConfigurationTarget.Global }
        ],
        { placeHolder: "Save folder setting for this workspace or globally?" }
      );
      if (!scopePick) return;
      targetScope = scopePick.scope;
    }
  }
  await config.update("outputDirectory", savePathValue, targetScope);
  if (capturesProvider) {
    capturesProvider.refresh();
  }
  const action = await vscode6.window.showInformationMessage(
    `\u{1F4C1} ADBSnap: Output folder set to "${chosenPath}"`,
    "Reveal in Explorer",
    "Open Studio"
  );
  if (action === "Reveal in Explorer") {
    vscode6.commands.executeCommand("revealFileInOS", vscode6.Uri.file(chosenPath));
  } else if (action === "Open Studio") {
    vscode6.commands.executeCommand("adbsnap.openStudio");
  }
}
async function handleSnapRawCommand(context) {
  const device = statusBarManager.getActiveDevice();
  if (!device || !device.isAuthorized) {
    vscode6.window.showWarningMessage("ADBSnap: No authorized device found.");
    return;
  }
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: "ADBSnap: Capturing Raw Screen...",
      cancellable: false
    },
    async () => {
      try {
        const outDir = resolveOutputDir();
        await import_promises3.default.mkdir(outDir, { recursive: true });
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const fileName = `raw-snap-${timestamp}.png`;
        const filePath = import_node_path7.default.join(outDir, fileName);
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
        const action = await vscode6.window.showInformationMessage(
          `\u{1F4F8} Saved raw screen to ${fileName}`,
          "Open Image",
          "Reveal in Explorer"
        );
        if (action === "Open Image") {
          await vscode6.commands.executeCommand("vscode.open", vscode6.Uri.file(filePath));
        } else if (action === "Reveal in Explorer") {
          await vscode6.commands.executeCommand("revealFileInOS", vscode6.Uri.file(filePath));
        }
        await checkAndPromptReview(context);
      } catch (err) {
        vscode6.window.showErrorMessage(`ADBSnap Raw Capture Failed: ${err.message || err}`);
      }
    }
  );
}
async function checkAndPromptReview(context) {
  const HAS_RATED_KEY = "adbsnap.hasRatedOrDismissed";
  const SNAP_COUNT_KEY = "adbsnap.successfulSnapCount";
  if (context.globalState.get(HAS_RATED_KEY)) {
    return;
  }
  const currentCount = (context.globalState.get(SNAP_COUNT_KEY) || 0) + 1;
  await context.globalState.update(SNAP_COUNT_KEY, currentCount);
  if (currentCount === 5) {
    const response = await vscode6.window.showInformationMessage(
      "\u2B50 Enjoying ADBSnap? Leaving a 5-star review on the Marketplace helps support open-source development!",
      "Leave a Review",
      "Maybe Later",
      "Don't Ask Again"
    );
    if (response === "Leave a Review") {
      await context.globalState.update(HAS_RATED_KEY, true);
      vscode6.env.openExternal(
        vscode6.Uri.parse("https://marketplace.visualstudio.com/items?itemName=shriramsingh.adbsnap&ssr=false#review-details")
      );
    } else if (response === "Don't Ask Again") {
      await context.globalState.update(HAS_RATED_KEY, true);
    }
  }
}
async function handleSelectDeviceCommand() {
  const devices = await statusBarManager.refresh();
  const items = [];
  if (devices.length > 0) {
    const active = statusBarManager.getActiveDevice();
    for (const d of devices) {
      const isCurrent = active?.id === d.id;
      const typeLabel = d.platform === "ios" ? d.type === "emulator" ? "iOS Simulator" : `iOS ${d.type === "wifi" ? "Wi-Fi" : "Device"}` : d.type === "wifi" ? "Wi-Fi" : d.type === "emulator" ? "Emulator" : "USB";
      const statusIcon = d.isAuthorized ? "$(check)" : "$(alert)";
      items.push({
        label: `${statusIcon} ${d.model} (${typeLabel}) ${isCurrent ? "\u2022 Active" : ""}`,
        description: d.id,
        detail: d.isAuthorized ? `Status: Ready (${d.product})` : d.platform === "ios" ? "Status: Not paired - unlock the device and trust this Mac" : "Status: Unauthorized - approve USB debugging on device",
        device: d
      });
    }
  } else {
    items.push({
      label: "$(warning) No devices detected",
      description: "Connect an Android device or pair an iOS device with this Mac"
    });
  }
  items.push({ label: "", kind: vscode6.QuickPickItemKind.Separator });
  items.push({
    label: "$(refresh) Refresh Connected Devices",
    description: "Re-scan USB and Wi-Fi ADB devices",
    action: "refresh"
  });
  items.push({
    label: "$(broadcast) Connect Device via Wi-Fi IP",
    description: "Direct connect to phone IP (e.g. 192.168.1.45:5555)",
    action: "connectIp"
  });
  items.push({
    label: "$(key) Pair Wireless Device (Android 11+)",
    description: "Pair with 6-digit Wi-Fi pairing code and port from developer options",
    action: "pairWifi"
  });
  const offlineEp = statusBarManager.getLastWirelessEndpoint();
  if (offlineEp && !devices.some((d) => d.id === offlineEp)) {
    items.push({
      label: `$(sync) Reconnect to ${offlineEp}`,
      description: "Attempt reconnect to last known wireless endpoint",
      action: "reconnect"
    });
  }
  items.push({
    label: "$(radio-tower) Switch USB Device to Wireless (WiFi)",
    description: "Set up wireless debugging over local network from USB",
    action: "wifi"
  });
  items.push({
    label: "$(plug) Turn Off Wi-Fi Mode (Revert to USB)",
    description: "Disconnect wireless ADB and reset device connection to USB",
    action: "disconnectWifi"
  });
  const selected = await vscode6.window.showQuickPick(items, {
    placeHolder: "Select active Android device or action"
  });
  if (!selected) return;
  if (selected.action === "refresh") {
    await statusBarManager.refresh();
    vscode6.window.showInformationMessage("ADBSnap: Device list refreshed.");
  } else if (selected.action === "connectIp") {
    await handleConnectIpCommand();
  } else if (selected.action === "pairWifi") {
    await handlePairWifiCommand();
  } else if (selected.action === "reconnect") {
    await handleReconnectCommand();
  } else if (selected.action === "wifi") {
    await handleWifiCommand();
  } else if (selected.action === "disconnectWifi") {
    await handleDisconnectWifiCommand();
  } else if (selected.device) {
    statusBarManager.setActiveDevice(selected.device);
    vscode6.window.showInformationMessage(`ADBSnap: Active device set to "${selected.device.model}".`);
  }
}
function rememberWifiEndpoint(context, endpoint) {
  statusBarManager.setLastWirelessEndpoint(endpoint);
  if (context) {
    const list = context.globalState.get("adbsnap.recentWifiEndpoints") || [];
    const updated = [endpoint, ...list.filter((e) => e !== endpoint)].slice(0, 10);
    context.globalState.update("adbsnap.recentWifiEndpoints", updated);
    context.globalState.update("adbsnap.lastWifiEndpoint", endpoint);
  }
  if (controlCenterProvider) {
    controlCenterProvider.refresh();
  }
}
async function handleWifiCommand(context) {
  const devices = await listAllDevices();
  const usbDevices = devices.filter((d) => d.platform === "android" && d.type === "usb" && d.isAuthorized);
  if (usbDevices.length === 0) {
    vscode6.window.showWarningMessage('ADBSnap: No authorized USB device found. Connect phone via USB or use "Connect via Wi-Fi IP".');
    return;
  }
  let targetId = usbDevices[0].id;
  if (usbDevices.length > 1) {
    const picked = await vscode6.window.showQuickPick(
      usbDevices.map((d) => ({ label: d.model, description: d.id })),
      { placeHolder: "Select USB device to switch to Wireless" }
    );
    if (!picked) return;
    targetId = picked.description;
  }
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: "ADBSnap: Switching device to Wireless ADB...",
      cancellable: false
    },
    async () => {
      try {
        const address = await androidDriver.enableWireless(targetId);
        rememberWifiEndpoint(context, address);
        await statusBarManager.refresh();
        if (devicesProvider) {
          devicesProvider.refresh();
        }
        vscode6.window.showInformationMessage(`\u{1F389} ADBSnap: Connected wirelessly to ${address}! You can now disconnect the USB cable.`);
      } catch (err) {
        vscode6.window.showErrorMessage(`Wireless Setup Failed: ${err.message || err}`);
      }
    }
  );
}
async function handleConnectIpCommand(context) {
  const defaultVal = statusBarManager.getLastWirelessEndpoint() || "192.168.1.";
  const input = await vscode6.window.showInputBox({
    title: "Connect Android Device by Wi-Fi IP",
    prompt: "Enter device IP and optional port (e.g. 192.168.1.45 or 192.168.1.45:5555)",
    value: defaultVal,
    ignoreFocusOut: true
  });
  if (!input || !input.trim()) return;
  const raw = input.trim();
  const [ip, portStr] = raw.includes(":") ? raw.split(":") : [raw, "5555"];
  const port = portStr ? Number(portStr) : 5555;
  const endpoint = `${ip}:${port}`;
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: `ADBSnap: Connecting to ${endpoint}...`,
      cancellable: false
    },
    async () => {
      try {
        const res = await androidDriver.connectWifi(ip, port);
        if (res.success) {
          rememberWifiEndpoint(context, endpoint);
          await statusBarManager.refresh();
          if (devicesProvider) devicesProvider.refresh();
          vscode6.window.showInformationMessage(`\u{1F4F6} Connected to Android device at ${endpoint}!`);
        } else {
          vscode6.window.showErrorMessage(`\u274C Connection failed: ${res.message}`);
        }
      } catch (err) {
        vscode6.window.showErrorMessage(`Connection error: ${err.message || err}`);
      }
    }
  );
}
async function handlePairWifiCommand(context) {
  const ipPort = await vscode6.window.showInputBox({
    title: "Wireless Pairing (Step 1/2: IP & Pairing Port)",
    prompt: "Enter IP and 5-digit Pairing Port shown under Developer Options > Wireless debugging > Pair with code",
    placeHolder: "192.168.1.45:37851",
    ignoreFocusOut: true
  });
  if (!ipPort || !ipPort.includes(":")) {
    if (ipPort) vscode6.window.showErrorMessage("Please specify both IP and Pairing Port (format: 192.168.1.X:PORT)");
    return;
  }
  const [ip, portStr] = ipPort.trim().split(":");
  const port = Number(portStr);
  const code = await vscode6.window.showInputBox({
    title: "Wireless Pairing (Step 2/2: 6-Digit Code)",
    prompt: `Enter the 6-digit Wi-Fi pairing code displayed on your phone for ${ip}:${port}`,
    placeHolder: "123456",
    ignoreFocusOut: true
  });
  if (!code || !code.trim()) return;
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: `ADBSnap: Pairing with ${ip}:${port}...`,
      cancellable: false
    },
    async () => {
      try {
        const pairRes = await androidDriver.pairWifi(ip.trim(), port, code.trim());
        if (pairRes.success) {
          vscode6.window.showInformationMessage(`\u{1F389} Paired successfully with ${ip}! Connecting link...`);
          await new Promise((r) => setTimeout(r, 1200));
          const connRes = await androidDriver.connectWifi(ip.trim(), 5555);
          const fullEndpoint = `${ip.trim()}:5555`;
          rememberWifiEndpoint(context, fullEndpoint);
          await statusBarManager.refresh();
          if (devicesProvider) devicesProvider.refresh();
          if (connRes.success) {
            vscode6.window.showInformationMessage(`\u{1F4F6} Wirelessly connected to ${fullEndpoint}!`);
          }
        } else {
          vscode6.window.showErrorMessage(`\u274C Pairing failed: ${pairRes.message}`);
        }
      } catch (err) {
        vscode6.window.showErrorMessage(`Pairing error: ${err.message || err}`);
      }
    }
  );
}
async function handleReconnectCommand(context, target) {
  let endpoint = typeof target === "string" ? target : target?.endpoint || target?.device?.id;
  if (!endpoint && context) {
    const recent = context.globalState.get("adbsnap.recentWifiEndpoints") || [];
    const lastEp = statusBarManager.getLastWirelessEndpoint() || context.globalState.get("adbsnap.lastWifiEndpoint");
    if (recent.length === 1) {
      endpoint = recent[0];
    } else if (recent.length > 1) {
      const picks = recent.map((ep) => ({
        label: `$(radio-tower) ${ep}`,
        description: ep === lastEp ? "(Most Recent)" : "",
        endpoint: ep
      }));
      picks.push({
        label: "$(plus) Connect to New IP...",
        description: "",
        endpoint: "NEW"
      });
      const chosen = await vscode6.window.showQuickPick(picks, {
        placeHolder: "Select wireless device to reconnect"
      });
      if (!chosen) return;
      if (chosen.endpoint === "NEW") {
        await handleConnectIpCommand(context);
        return;
      }
      endpoint = chosen.endpoint;
    } else if (lastEp) {
      endpoint = lastEp;
    }
  }
  if (!endpoint || !endpoint.includes(":")) {
    endpoint = statusBarManager.getLastWirelessEndpoint();
    if (!endpoint) {
      await handleConnectIpCommand(context);
      return;
    }
  }
  const [ip, portStr] = endpoint.split(":");
  const port = portStr ? Number(portStr) : 5555;
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: `ADBSnap: Reconnecting to ${endpoint}...`,
      cancellable: false
    },
    async () => {
      try {
        const res = await androidDriver.connectWifi(ip, port);
        if (res.success) {
          rememberWifiEndpoint(context, endpoint);
          await statusBarManager.refresh();
          if (devicesProvider) devicesProvider.refresh();
          vscode6.window.showInformationMessage(`\u{1F4F6} Reconnected to ${endpoint}!`);
        } else {
          vscode6.window.showWarningMessage(`\u274C Reconnect to ${endpoint} failed: ${res.message}`);
        }
      } catch (err) {
        vscode6.window.showErrorMessage(`Reconnect error: ${err.message || err}`);
      }
    }
  );
}
async function handleDisconnectWifiCommand(context, targetDevice) {
  const dev = targetDevice && "device" in targetDevice ? targetDevice.device : targetDevice;
  const deviceId = dev?.id || statusBarManager.getActiveDevice()?.id;
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: "ADBSnap: Disconnecting Wi-Fi session...",
      cancellable: false
    },
    async () => {
      try {
        if (androidDriver.disableWireless) {
          await androidDriver.disableWireless(deviceId);
        }
        if (deviceId && deviceId.includes(":")) {
          rememberWifiEndpoint(context, deviceId);
        }
        await statusBarManager.refresh();
        if (devicesProvider) {
          devicesProvider.refresh();
        }
        if (controlCenterProvider) {
          controlCenterProvider.refresh();
        }
        vscode6.window.showInformationMessage(`\u{1F50C} Disconnected from ${deviceId || "device"}. (Click 'Reconnect' in ADBSnap anytime to restore Wi-Fi)`);
      } catch (err) {
        vscode6.window.showErrorMessage(`Disconnect Wi-Fi Failed: ${err.message || err}`);
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
    const devices = await listAllDevices();
    if (devices.length === 0) {
      outputChannel.appendLine("No attached mobile devices detected.");
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
    vscode6.window.showWarningMessage("ADBSnap: No connected ADB device found. Please attach a device or emulator.");
    return;
  }
  if (!device.isAuthorized) {
    vscode6.window.showErrorMessage(`ADBSnap: Device "${device.model}" is unauthorized. Please accept the USB debugging prompt on the device.`);
    return;
  }
  const storePick = await vscode6.window.showQuickPick(
    [
      { label: "$(package) All Stores (App Store + Google Play)", description: '4 sizes: 6.9", 6.7", 6.5" + Play Store', value: "all" },
      { label: "$(device-mobile) Apple App Store Only", description: '3 sizes: 6.9", 6.7", 6.5"', value: "apple" },
      { label: "$(rocket) Google Play Store Only", description: "1 size: Play Store standard", value: "google" }
    ],
    { placeHolder: "Select store targets for export" }
  );
  if (!storePick) return;
  const title = await vscode6.window.showInputBox({
    prompt: "Headline text for the showcase (leave empty to skip)",
    placeHolder: "e.g. Track Your Daily Habits"
  });
  const subtitle = title ? await vscode6.window.showInputBox({
    prompt: "Subtitle text (leave empty to skip)",
    placeHolder: "e.g. Simple. Fast. Beautiful."
  }) : void 0;
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: `ADBSnap: Exporting ${storePick.value === "all" ? "All Stores" : storePick.value === "apple" ? "App Store" : "Play Store"} assets...`,
      cancellable: false
    },
    async () => {
      try {
        const config = vscode6.workspace.getConfiguration("adbsnap");
        const theme = config.get("defaultTheme") || "aurora";
        const frame = config.get("defaultFrame") || "iphone-16-pro";
        const outDir = resolveOutputDir();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const exportDir = import_node_path7.default.join(outDir, `export-${theme}-${timestamp}`);
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
        const action = await vscode6.window.showInformationMessage(
          `\u{1F4E6} Store asset pack exported to ${import_node_path7.default.basename(exportDir)}/`,
          "Reveal in Explorer"
        );
        if (action === "Reveal in Explorer") {
          await vscode6.commands.executeCommand("revealFileInOS", vscode6.Uri.file(exportDir));
        }
      } catch (err) {
        vscode6.window.showErrorMessage(`ADBSnap Export Failed: ${err.message || err}`);
      }
    }
  );
}
async function handleInsertMarkdownCommand(context) {
  const editor = vscode6.window.activeTextEditor;
  if (!editor) {
    vscode6.window.showWarningMessage("ADBSnap: Please open a Markdown or text document first.");
    return;
  }
  const result = await handleSnapCommand(context, { copyToClipboard: false, returnResult: true });
  if (!result) return;
  const docDir = import_node_path7.default.dirname(editor.document.uri.fsPath);
  let relPath = import_node_path7.default.relative(docDir, result.filePath).replace(/\\/g, "/");
  if (!relPath.startsWith(".") && !relPath.startsWith("/")) {
    relPath = "./" + relPath;
  }
  const markdownSnippet = `![ADBSnap](${relPath})`;
  await editor.edit((editBuilder) => {
    editBuilder.insert(editor.selection.active, markdownSnippet);
  });
  vscode6.window.showInformationMessage(`\u{1F4F8} Inserted "${result.fileName}" into document!`);
}
async function handleSelectFrameCommand() {
  const config = vscode6.workspace.getConfiguration("adbsnap");
  const currentFrame = config.get("defaultFrame") || "iphone-16-pro";
  const frames = [
    { label: "iPhone 16 Pro Max", id: "iphone-16-pro-max", description: '6.9" Dynamic Island (2026 Flagship)' },
    { label: "iPhone 16 Pro", id: "iphone-16-pro", description: '6.3" Dynamic Island' },
    { label: "iPhone 16", id: "iphone-16", description: '6.1" Base Model' },
    { label: "iPhone 15 Pro", id: "iphone-15-pro", description: "Titanium chassis" },
    { label: "iPhone 14", id: "iphone-14", description: "Classic Notch Bezel" },
    { label: "Google Pixel 9 Pro Fold", id: "pixel-9-pro-fold", description: '8.0" Inner Foldable OLED' },
    { label: "Google Pixel 9 Pro", id: "pixel-9-pro", description: '6.3" Punch-Hole OLED' },
    { label: "Google Pixel 8", id: "pixel-8", description: "Compact Android flagship" },
    { label: "Samsung Galaxy S25 Ultra", id: "galaxy-s25-ultra", description: '6.8" Titanium chassis' },
    { label: "Samsung Galaxy S24 Ultra", id: "galaxy-s24-ultra", description: "Square profile titanium" },
    { label: "Samsung Galaxy S24", id: "galaxy-s24", description: "Compact dynamic AMOLED" },
    { label: 'Apple iPad Pro 13" M4', id: "ipad-pro-13", description: 'Ultra-thin 13" tablet' },
    { label: 'Android Tablet 10"', id: "android-tablet-10", description: '10.5" widescreen tablet' },
    { label: "Modern Minimalist", id: "minimal", description: "Clean universal floating frame" },
    { label: "Pure Floating Screen", id: "none", description: "No hardware bezel (Raw shadow only)" }
  ];
  const items = frames.map((f) => ({
    label: `${f.id === currentFrame ? "$(check) " : ""}${f.label}`,
    description: f.id,
    detail: f.description,
    id: f.id
  }));
  const pick = await vscode6.window.showQuickPick(items, {
    placeHolder: `Select default device bezel chassis (current: ${currentFrame})`
  });
  if (pick) {
    await config.update("defaultFrame", pick.id, vscode6.ConfigurationTarget.Global);
    vscode6.window.showInformationMessage(`\u{1F4F1} ADBSnap: Default bezel set to "${pick.label.replace("$(check) ", "")}" (${pick.id}).`);
  }
}
async function handleSelectThemeCommand() {
  const config = vscode6.workspace.getConfiguration("adbsnap");
  const currentTheme = config.get("defaultTheme") || "aurora";
  const themes = [
    { id: "aurora", label: "Electric Aurora", colors: "#4f46e5 \u2794 #06b6d4 \u2794 #10b981" },
    { id: "studioLight", label: "Apple Studio Light", colors: "#f8fafc \u2794 #f1f5f9 \u2794 #e2e8f0" },
    { id: "freshMint", label: "Fresh Mint", colors: "#0f766e \u2794 #059669 \u2794 #10b981" },
    { id: "sunset", label: "Warm Sunset", colors: "#f43f5e \u2794 #fb923c \u2794 #fbbf24" },
    { id: "midnight", label: "Deep Midnight", colors: "#090d16 \u2794 #1e1b4b \u2794 #312e81" },
    { id: "royal", label: "Royal Orchid", colors: "#7c3aed \u2794 #c026d3 \u2794 #f43f5e" },
    { id: "cleanDark", label: "Titanium Dark", colors: "#18181b \u2794 #27272a \u2794 #09090b" },
    { id: "fintech", label: "Fintech Emerald", colors: "#022c22 \u2794 #064e3b \u2794 #047857" },
    { id: "lavender", label: "Lavender Mist", colors: "#1e1b4b \u2794 #4c1d95 \u2794 #7c3aed" },
    { id: "cyberpunk", label: "Cyberpunk Neon", colors: "#09090b \u2794 #701a75 \u2794 #a21caf" },
    { id: "crimsonVoid", label: "Crimson Void", colors: "#18181b \u2794 #7f1d1d \u2794 #450a0a" },
    { id: "cobalt", label: "Cobalt Indigo", colors: "#030712 \u2794 #1e3a8a \u2794 #1e40af" },
    { id: "terracotta", label: "Warm Terracotta", colors: "#1c1917 \u2794 #78350f \u2794 #9a3412" },
    { id: "slateCarbon", label: "Carbon Matte", colors: "#090d16 \u2794 #1e293b \u2794 #334155" },
    { id: "pureWhite", label: "Studio Minimal White", colors: "#ffffff \u2794 #f8fafc" },
    { id: "none", label: "None (Raw / Transparent)", colors: "Transparent" }
  ];
  const items = themes.map((t) => ({
    label: `${t.id === currentTheme ? "$(check) " : ""}${t.label}`,
    description: t.id,
    detail: t.colors,
    id: t.id
  }));
  const pick = await vscode6.window.showQuickPick(items, {
    placeHolder: `Select default canvas backdrop gradient (current: ${currentTheme})`
  });
  if (pick) {
    await config.update("defaultTheme", pick.id, vscode6.ConfigurationTarget.Global);
    vscode6.window.showInformationMessage(`\u{1F3A8} ADBSnap: Default backdrop set to "${pick.label.replace("$(check) ", "")}" (${pick.id}).`);
  }
}
async function handleSelectFormatCommand() {
  const config = vscode6.workspace.getConfiguration("adbsnap");
  const currentFormat = config.get("defaultFormat") || "png";
  const formats = [
    { id: "png", label: "PNG (Lossless Standard)", detail: "Full fidelity, standard format for App Store & Google Play" },
    { id: "webp", label: "WebP (42% Smaller)", detail: "Super-fast load times, ideal for web portfolios and documentation" },
    { id: "avif", label: "AVIF (95% Smaller)", detail: "Next-gen compact format with superior HDR chroma reproduction" },
    { id: "jpeg", label: "JPEG (mozjpeg)", detail: "Universal compatibility for social media and legacy systems" }
  ];
  const items = formats.map((f) => ({
    label: `${f.id === currentFormat ? "$(check) " : ""}${f.label}`,
    description: f.id,
    detail: f.detail,
    id: f.id
  }));
  const pick = await vscode6.window.showQuickPick(items, {
    placeHolder: `Select screenshot format (current: ${currentFormat})`
  });
  if (pick) {
    await config.update("defaultFormat", pick.id, vscode6.ConfigurationTarget.Global);
    vscode6.window.showInformationMessage(`\u{1F4E6} ADBSnap: Export format set to "${pick.id.toUpperCase()}".`);
  }
}
async function handleSelectAspectRatioCommand() {
  const config = vscode6.workspace.getConfiguration("adbsnap");
  const currentAspect = config.get("defaultAspectRatio") || "portrait";
  const ratios = [
    { id: "portrait", label: "\u{1F4F1} Portrait 9:19.5 (1290\xD72796)", detail: "Apple App Store Connect & Google Play Console standard store mockup" },
    { id: "landscape", label: "\u{1F5A5}\uFE0F Landscape 16:9 (1920\xD71080)", detail: "Product Hunt, Twitter/X, and social banner presentation card" },
    { id: "square", label: "\u2B1B Square 1:1 (1080\xD71080)", detail: "Instagram, LinkedIn feed showcase, and square post preset" }
  ];
  const items = ratios.map((r) => ({
    label: `${r.id === currentAspect ? "$(check) " : ""}${r.label}`,
    description: r.id,
    detail: r.detail,
    id: r.id
  }));
  const pick = await vscode6.window.showQuickPick(items, {
    placeHolder: `Select canvas aspect ratio (current: ${currentAspect})`
  });
  if (pick) {
    await config.update("defaultAspectRatio", pick.id, vscode6.ConfigurationTarget.Global);
    vscode6.window.showInformationMessage(`\u{1F4D0} ADBSnap: Aspect ratio set to "${pick.label}".`);
  }
}
async function handleToggleDemoModeCommand(_context) {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== "android") {
    vscode6.window.showWarningMessage("ADBSnap: SystemUI Demo Mode requires an active Android device.");
    return;
  }
  const choices = [
    {
      id: "enable",
      label: "$(check) Enable Demo Mode",
      detail: "Pristine 9:41 AM clock, 100% battery, full Wi-Fi signal, and notifications hidden."
    },
    {
      id: "disable",
      label: "$(x) Disable Demo Mode",
      detail: "Exit demo mode and restore the real system status bar."
    }
  ];
  const pick = await vscode6.window.showQuickPick(choices, {
    placeHolder: `Configure SystemUI Demo Mode for ${device.model} (${device.id})`
  });
  if (!pick) return;
  const enable = pick.id === "enable";
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: enable ? "ADBSnap: Enabling Demo Mode..." : "ADBSnap: Disabling Demo Mode...",
      cancellable: false
    },
    async () => {
      try {
        await androidDriver.setDemoMode(enable, device.id);
        if (enable) {
          vscode6.window.showInformationMessage(`\u2728 Demo Mode ENABLED on ${device.model}! Status bar is now clean (9:41 AM, 100% battery).`);
        } else {
          vscode6.window.showInformationMessage(`\u{1F504} Demo Mode DISABLED on ${device.model}. Real status bar restored.`);
        }
      } catch (err) {
        vscode6.window.showErrorMessage(`Demo Mode Error: ${err.message || err}`);
      }
    }
  );
}
async function handleExploreCommand(context) {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== "android") {
    vscode6.window.showWarningMessage("ADBSnap: Tab Explorer requires an active Android device.");
    return;
  }
  const maxTabsInput = await vscode6.window.showInputBox({
    title: "ADBSnap: Explore Android App Tabs",
    prompt: "Maximum number of bottom navigation tabs to crawl and snap",
    value: "5",
    validateInput: (v) => !isNaN(Number(v)) && Number(v) > 0 ? null : "Please enter a valid positive number"
  });
  if (!maxTabsInput) return;
  const maxTabs = parseInt(maxTabsInput.trim(), 10);
  outputChannel.clear();
  outputChannel.show(true);
  outputChannel.appendLine(`\u{1F680} Starting Android Tab Crawler on device: ${device.id} (Max tabs: ${maxTabs})...`);
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: `ADBSnap: Crawling app tabs (${device.model})...`,
      cancellable: false
    },
    async (progress) => {
      try {
        const outDir = resolveOutputDir();
        await import_promises3.default.mkdir(outDir, { recursive: true });
        progress.report({ message: "Scanning screen hierarchy for bottom navigation tabs..." });
        outputChannel.appendLine("\u{1F50D} Scanning screen hierarchy for bottom navigation tabs...");
        const crawledTabs = await uiCrawler.crawlTabs(device.id, (tab, index, total) => {
          const msg = `[Tab ${index + 1}/${total}] Navigating to: "${tab.title}"`;
          progress.report({ message: msg });
          outputChannel.appendLine(`\u{1F449} ${msg}`);
        });
        const limitedTabs = crawledTabs.slice(0, maxTabs);
        outputChannel.appendLine(`\u{1F4F8} Discovered ${crawledTabs.length} tabs. Saving ${limitedTabs.length} screenshots to ${outDir}...`);
        for (let i = 0; i < limitedTabs.length; i++) {
          const tab = limitedTabs[i];
          const sanitizedTitle = tab.title.toLowerCase().replace(/[^a-z0-9]/g, "-") || "tab";
          const fileName = `tab-${String(i + 1).padStart(2, "0")}-${sanitizedTitle}.png`;
          const filePath = import_node_path7.default.join(outDir, fileName);
          await import_promises3.default.writeFile(filePath, tab.screenshotBuffer);
          outputChannel.appendLine(`  \u2714 Saved: ${fileName} (${Math.round(tab.screenshotBuffer.length / 1024)} KB)`);
        }
        if (capturesProvider) capturesProvider.refresh();
        const action = await vscode6.window.showInformationMessage(
          `\u{1F389} Successfully crawled and saved ${limitedTabs.length} tab screenshots!`,
          "Reveal in Explorer",
          "Open Studio"
        );
        if (action === "Reveal in Explorer") {
          vscode6.commands.executeCommand("revealFileInOS", vscode6.Uri.file(outDir));
        } else if (action === "Open Studio") {
          vscode6.commands.executeCommand("adbsnap.openStudio");
        }
      } catch (err) {
        outputChannel.appendLine(`\u274C Exploration failed: ${err.message || err}`);
        vscode6.window.showErrorMessage(`Exploration failed: ${err.message || err}`);
      }
    }
  );
}
async function handleExploreIosCommand(context) {
  const device = statusBarManager.getActiveDevice();
  const isMac = process.platform === "darwin";
  if (!isMac) {
    vscode6.window.showWarningMessage("ADBSnap: iOS UI Explorer requires macOS with Xcode command-line tools installed.");
    return;
  }
  const bundleInput = await vscode6.window.showInputBox({
    title: "ADBSnap: Autonomous iOS UI Explorer (XCTest)",
    prompt: "Bundle Identifier of the installed iOS app to explore",
    placeHolder: "e.g. com.example.myapp",
    ignoreFocusOut: true
  });
  if (!bundleInput || !bundleInput.trim()) return;
  const bundle = bundleInput.trim();
  let teamId;
  if (device && device.type !== "emulator") {
    const teamInput = await vscode6.window.showInputBox({
      title: "Apple Developer Team ID (Physical Device)",
      prompt: "10-character Team ID from developer.apple.com for signing the UI runner",
      placeHolder: "e.g. ABCDE12345"
    });
    if (teamInput && teamInput.trim()) teamId = teamInput.trim();
  }
  outputChannel.clear();
  outputChannel.show(true);
  outputChannel.appendLine(`\u{1F680} Starting iOS XCTest Auto Explorer for "${bundle}"...`);
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: `ADBSnap: Exploring iOS app ${bundle}...`,
      cancellable: false
    },
    async () => {
      try {
        const outDir = resolveOutputDir();
        const cliArgs = ["explore-ios", "--bundle", bundle, "--out", outDir, "--zip"];
        if (device?.id) cliArgs.push("--device", device.id);
        if (teamId) cliArgs.push("--team", teamId);
        const res = await runAdbSnapCli(context.extensionPath, cliArgs, 18e4);
        outputChannel.appendLine(res.stdout || "");
        if (res.stderr) outputChannel.appendLine(res.stderr);
        if (res.exitCode === 0) {
          if (capturesProvider) capturesProvider.refresh();
          vscode6.window.showInformationMessage("\u{1F389} iOS UI Exploration completed! Screenshots saved.");
        } else {
          vscode6.window.showErrorMessage(`iOS Explorer error: ${res.stderr || res.stdout}`);
        }
      } catch (err) {
        vscode6.window.showErrorMessage(`iOS Exploration failed: ${err.message || err}`);
      }
    }
  );
}
async function handleResetAppDataCommand(_context) {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== "android") {
    vscode6.window.showWarningMessage("ADBSnap: App Data Reset requires an active Android device.");
    return;
  }
  let defaultPkg = "";
  try {
    defaultPkg = await androidDriver.getForegroundApp(device.id) || "";
  } catch {
  }
  const pkg = await vscode6.window.showInputBox({
    title: "ADBSnap: Reset App Data (Logout / Clear Cache)",
    prompt: "Enter Android application package name to reset (pm clear)",
    value: defaultPkg,
    ignoreFocusOut: true
  });
  if (!pkg || !pkg.trim()) return;
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: `ADBSnap: Clearing app data for ${pkg.trim()}...`,
      cancellable: false
    },
    async () => {
      try {
        await androidDriver.resetAppData(pkg.trim(), device.id);
        vscode6.window.showInformationMessage(`\u{1F389} Successfully wiped data for "${pkg.trim()}"! App reset to pristine state.`);
      } catch (err) {
        vscode6.window.showErrorMessage(`Reset App Data Failed: ${err.message || err}`);
      }
    }
  );
}
async function handleRelaunchAppCommand(_context) {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== "android") {
    vscode6.window.showWarningMessage("ADBSnap: App Relaunch requires an active Android device.");
    return;
  }
  let defaultPkg = "";
  try {
    defaultPkg = await androidDriver.getForegroundApp(device.id) || "";
  } catch {
  }
  const pkg = await vscode6.window.showInputBox({
    title: "ADBSnap: Relaunch Mobile App",
    prompt: "Enter package name to terminate and restart",
    value: defaultPkg,
    ignoreFocusOut: true
  });
  if (!pkg || !pkg.trim()) return;
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: `ADBSnap: Relaunching ${pkg.trim()}...`,
      cancellable: false
    },
    async () => {
      try {
        await androidDriver.killApp(pkg.trim(), device.id);
        await new Promise((r) => setTimeout(r, 400));
        await androidDriver.launchApp(pkg.trim(), device.id);
        vscode6.window.showInformationMessage(`\u{1F680} Relaunched "${pkg.trim()}"!`);
      } catch (err) {
        vscode6.window.showErrorMessage(`Relaunch Failed: ${err.message || err}`);
      }
    }
  );
}
async function handleOpenMenuCommand(context) {
  const activeDevice = statusBarManager.getActiveDevice();
  const deviceLabel = activeDevice ? `${activeDevice.model} (${activeDevice.id}) [${activeDevice.platform.toUpperCase()} ${activeDevice.type.toUpperCase()}]` : "No active device connected";
  const items = [
    {
      label: `\u{1F4F1} Active Device: ${deviceLabel}`,
      description: activeDevice?.isAuthorized ? "$(check) READY" : "$(alert) UNAUTHORIZED",
      detail: "Click to select or switch active target device",
      action: () => vscode6.commands.executeCommand("adbsnap.devices")
    }
  ];
  const lastWifi = statusBarManager.getLastWirelessEndpoint() || context.globalState.get("adbsnap.lastWifiEndpoint");
  if (lastWifi && (!activeDevice || activeDevice.id !== lastWifi)) {
    items.push({
      label: `$(sync) Reconnect to ${lastWifi}`,
      description: "1-click reconnect to saved Wi-Fi phone",
      detail: "Restore wireless debugging link without retyping IP",
      action: () => vscode6.commands.executeCommand("adbsnap.reconnectDevice", lastWifi)
    });
  }
  items.push(
    { label: "", kind: vscode6.QuickPickItemKind.Separator },
    {
      label: "$(camera) Quick Capture (Framed)",
      description: "Ctrl+Alt+S",
      detail: "Capture and composite into active device frame and gradient theme",
      action: () => vscode6.commands.executeCommand("adbsnap.snap")
    },
    {
      label: "$(save-as) Quick Capture As...",
      detail: "Capture with custom file name and destination folder choice",
      action: () => vscode6.commands.executeCommand("adbsnap.snapAs")
    },
    {
      label: "$(copy) Capture & Copy to Clipboard",
      description: "Ctrl+Alt+C",
      detail: "Capture framed image and copy directly to system clipboard",
      action: () => vscode6.commands.executeCommand("adbsnap.snapClipboard")
    },
    {
      label: "$(markdown) Capture & Insert into Document",
      detail: "Capture screen and write ![ADBSnap](path) markdown tag at cursor position",
      action: () => vscode6.commands.executeCommand("adbsnap.insertMarkdown")
    },
    {
      label: "$(device-mobile) Capture Raw Screenshot",
      detail: "Save raw device pixel buffer without framing or backdrops",
      action: () => vscode6.commands.executeCommand("adbsnap.snapRaw")
    },
    {
      label: "$(record) Record Screen (MP4 / Video)",
      detail: "Record mobile screen video and composite inside 4K vector chassis",
      action: () => vscode6.commands.executeCommand("adbsnap.recordScreen")
    },
    {
      label: "$(bug) Capture Bug Report (Screenshot + Logcat)",
      detail: "Snap screen and bundle with recent crash exception logs into Markdown",
      action: () => vscode6.commands.executeCommand("adbsnap.bugReport")
    },
    { label: "", kind: vscode6.QuickPickItemKind.Separator },
    {
      label: "$(paintcan) Open Asset Studio",
      detail: "Open the visual WYSIWYG studio canvas in an embedded tab",
      action: () => vscode6.commands.executeCommand("adbsnap.openStudio")
    },
    {
      label: "$(edit) Send Selected Text to Phone",
      detail: "Type editor selection or input text into active phone input field",
      action: () => vscode6.commands.executeCommand("adbsnap.sendText")
    },
    {
      label: "$(link-external) Open Deep Link on Device",
      detail: "Open selected URL or deep-link URI intent on connected device",
      action: () => vscode6.commands.executeCommand("adbsnap.openDeepLink")
    },
    { label: "", kind: vscode6.QuickPickItemKind.Separator },
    {
      label: "$(arrow-left) Remote Key: Back",
      detail: "Dispatch hardware Back button (KEYCODE_BACK)",
      action: () => vscode6.commands.executeCommand("adbsnap.keyBack")
    },
    {
      label: "$(home) Remote Key: Home",
      detail: "Dispatch hardware Home button (KEYCODE_HOME)",
      action: () => vscode6.commands.executeCommand("adbsnap.keyHome")
    },
    {
      label: "$(versions) Remote Key: Recent Apps",
      detail: "Dispatch app switcher / recent tasks (KEYCODE_APP_SWITCH)",
      action: () => vscode6.commands.executeCommand("adbsnap.keyRecents")
    },
    {
      label: "$(lock) Remote Key: Power / Lock",
      detail: "Dispatch hardware Power key to lock or wake device (KEYCODE_POWER)",
      action: () => vscode6.commands.executeCommand("adbsnap.keyPower")
    },
    { label: "", kind: vscode6.QuickPickItemKind.Separator },
    {
      label: "$(screen-normal) Change Default Aspect Ratio",
      detail: "Switch canvas aspect ratio preset (Portrait 9:19.5, Landscape 16:9, Square 1:1)",
      action: () => vscode6.commands.executeCommand("adbsnap.selectAspectRatio")
    },
    {
      label: "$(device-mobile) Change Default Bezel Frame",
      detail: "Switch default chassis (iPhone 16 Pro Max, Pixel 9 Fold, Galaxy S25...)",
      action: () => vscode6.commands.executeCommand("adbsnap.selectFrame")
    },
    {
      label: "$(color-mode) Change Default Canvas Theme",
      detail: "Switch default backdrop gradient (Aurora, Studio Light, Sunset...)",
      action: () => vscode6.commands.executeCommand("adbsnap.selectTheme")
    },
    {
      label: "$(file-media) Change Default Export Format",
      detail: "Switch export format: PNG, WebP (42% smaller), AVIF (95% smaller), JPEG",
      action: () => vscode6.commands.executeCommand("adbsnap.selectFormat")
    },
    {
      label: "$(folder-opened) Select Output Folder...",
      description: resolveOutputDir(),
      detail: "Choose where captures, crawler assets, and store mockups are saved",
      action: () => vscode6.commands.executeCommand("adbsnap.selectOutputDir")
    },
    { label: "", kind: vscode6.QuickPickItemKind.Separator },
    {
      label: "$(radio-tower) Switch to Wireless ADB (WiFi)",
      detail: "1-click switch USB phone to wireless TCP/IP mode",
      action: () => vscode6.commands.executeCommand("adbsnap.wifi")
    },
    {
      label: "$(plug) Revert Wi-Fi to USB Mode",
      detail: "Disconnect wireless session and reset device port to USB",
      action: () => vscode6.commands.executeCommand("adbsnap.disconnectWifi")
    },
    {
      label: "$(key) Pair Wireless Device (Android 11+ PIN)",
      detail: "Pair device using 6-digit wireless debugging code and pairing port",
      action: () => vscode6.commands.executeCommand("adbsnap.pairWifi")
    },
    {
      label: "$(clock) Toggle Android SystemUI Demo Mode",
      detail: "Force status bar to clean 9:41 AM, 100% battery, no notification icons",
      action: () => vscode6.commands.executeCommand("adbsnap.toggleDemoMode")
    },
    {
      label: "$(clear-all) Reset App Data (pm clear)",
      detail: "Wipe tokens, database, and cache in <100ms for fresh onboarding test",
      action: () => vscode6.commands.executeCommand("adbsnap.resetAppData")
    },
    {
      label: "$(debug-restart) Relaunch Mobile App",
      detail: "Force-stop and restart active application from cold start",
      action: () => vscode6.commands.executeCommand("adbsnap.relaunchApp")
    },
    {
      label: "$(pulse) Run ADB Doctor Diagnostics",
      detail: "Check adb path, daemon state, and device authorization",
      action: () => vscode6.commands.executeCommand("adbsnap.doctor")
    }
  );
  const pick = await vscode6.window.showQuickPick(items, {
    placeHolder: "ADBSnap Mobile Command Center",
    matchOnDetail: true,
    matchOnDescription: true
  });
  if (pick && pick.action) {
    await pick.action();
  }
}
async function handleSendKeyEventCommand(keyCode, keyName) {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== "android") {
    vscode6.window.showWarningMessage(`ADBSnap: Remote ${keyName} key requires an active Android device.`);
    return;
  }
  try {
    await androidDriver.sendKeyEvent(keyCode, device.id);
    vscode6.window.setStatusBarMessage(`\u{1F4F1} Key ${keyName} dispatched to ${device.model}`, 2e3);
  } catch (err) {
    vscode6.window.showErrorMessage(`Failed to send key ${keyName}: ${err.message || err}`);
  }
}
async function handleSendTextCommand() {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== "android") {
    vscode6.window.showWarningMessage("ADBSnap: Send Text requires an active Android device.");
    return;
  }
  const editor = vscode6.window.activeTextEditor;
  let initialText = "";
  if (editor && !editor.selection.isEmpty) {
    initialText = editor.document.getText(editor.selection);
  }
  const text = await vscode6.window.showInputBox({
    title: "ADBSnap: Send Text to Phone",
    prompt: "Enter text to type into the focused input field on the device",
    value: initialText,
    ignoreFocusOut: true
  });
  if (!text) return;
  try {
    await androidDriver.inputText(text, device.id);
    vscode6.window.showInformationMessage(`\u2328\uFE0F Typed "${text.length > 25 ? text.slice(0, 25) + "..." : text}" onto ${device.model}!`);
  } catch (err) {
    vscode6.window.showErrorMessage(`Failed to type text: ${err.message || err}`);
  }
}
async function handleOpenDeepLinkCommand() {
  const device = statusBarManager.getActiveDevice();
  if (!device || device.platform !== "android") {
    vscode6.window.showWarningMessage("ADBSnap: Open Deep Link requires an active Android device.");
    return;
  }
  const editor = vscode6.window.activeTextEditor;
  let initialUri = "";
  if (editor && !editor.selection.isEmpty) {
    initialUri = editor.document.getText(editor.selection).trim();
  }
  const uri = await vscode6.window.showInputBox({
    title: "ADBSnap: Open Deep Link on Device",
    prompt: "Enter deep link URI or URL (e.g. myapp://checkout?id=123 or https://...)",
    value: initialUri,
    ignoreFocusOut: true
  });
  if (!uri || !uri.trim()) return;
  try {
    await androidDriver.openDeepLink(uri.trim(), device.id);
    vscode6.window.showInformationMessage(`\u{1F517} Dispatched intent for "${uri.trim()}" on ${device.model}!`);
  } catch (err) {
    vscode6.window.showErrorMessage(`Failed to open deep link: ${err.message || err}`);
  }
}
async function handleRecordScreenCommand(context) {
  const device = statusBarManager.getActiveDevice();
  if (!device) {
    vscode6.window.showWarningMessage("ADBSnap: Screen Recording requires a connected device.");
    return;
  }
  const durationPick = await vscode6.window.showQuickPick(
    [
      { id: "5", label: "5 seconds", detail: "Fast, compact demo clip (great for PRs and bug reports)" },
      { id: "10", label: "10 seconds (Recommended)", detail: "Standard user interaction walkthrough" },
      { id: "15", label: "15 seconds", detail: "Extended flow demonstration" }
    ],
    { placeHolder: "Select recording duration" }
  );
  if (!durationPick) return;
  const duration = durationPick.id;
  outputChannel.clear();
  outputChannel.show(true);
  outputChannel.appendLine(`\u{1F3A5} Starting screen recording on ${device.model} (${duration} seconds)...`);
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: `ADBSnap: \u{1F534} Recording screen on ${device.model} (${duration}s)... Please interact with the device.`,
      cancellable: false
    },
    async () => {
      try {
        const outDir = resolveOutputDir();
        await import_promises3.default.mkdir(outDir, { recursive: true });
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const outPath = import_node_path7.default.join(outDir, `record-${device.model.replace(/\s+/g, "-").toLowerCase()}-${timestamp}.mp4`);
        const cliArgs = [
          "record",
          "--duration",
          duration,
          "--device",
          device.id,
          "--out",
          outPath
        ];
        const res = await runAdbSnapCli(context.extensionPath, cliArgs, 6e4);
        outputChannel.appendLine(res.stdout || "");
        if (res.stderr) outputChannel.appendLine(res.stderr);
        if (res.exitCode === 0 && await import_promises3.default.stat(outPath).catch(() => null)) {
          if (capturesProvider) capturesProvider.refresh();
          const action = await vscode6.window.showInformationMessage(
            `\u{1F3AC} Screen recording saved: ${import_node_path7.default.basename(outPath)}`,
            "Open Video",
            "Reveal in Explorer"
          );
          if (action === "Open Video") {
            await vscode6.commands.executeCommand("vscode.open", vscode6.Uri.file(outPath));
          } else if (action === "Reveal in Explorer") {
            await vscode6.commands.executeCommand("revealFileInOS", vscode6.Uri.file(outPath));
          }
        } else {
          vscode6.window.showErrorMessage(`Screen recording failed: ${res.stderr || res.stdout}`);
        }
      } catch (err) {
        vscode6.window.showErrorMessage(`Recording error: ${err.message || err}`);
      }
    }
  );
}
async function handleBugReportCommand(context) {
  const device = statusBarManager.getActiveDevice();
  if (!device) {
    vscode6.window.showWarningMessage("ADBSnap: Bug Report capture requires a connected device.");
    return;
  }
  await vscode6.window.withProgress(
    {
      location: vscode6.ProgressLocation.Notification,
      title: "ADBSnap: Generating Bug Report (Screenshot + Logcat)...",
      cancellable: false
    },
    async () => {
      try {
        const snap = await handleSnapCommand(context, { copyToClipboard: false, returnResult: true });
        if (!snap) throw new Error("Failed to capture bug screenshot");
        let logcat = "Logcat not applicable for iOS.";
        if (device.platform === "android") {
          logcat = await androidDriver.getLogcatErrors(60, device.id);
          if (!logcat || logcat.trim().length === 0) {
            logcat = "No recent fatal exception logs detected in logcat (*:E).";
          }
        }
        const outDir = resolveOutputDir();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const mdFileName = `bug-report-${timestamp}.md`;
        const mdFilePath = import_node_path7.default.join(outDir, mdFileName);
        const markdownContent = `# \u{1F41B} Mobile Bug Report
**Device**: ${device.model} (\`${device.id}\`)  
**Platform**: ${device.platform.toUpperCase()} (${device.type})  
**Captured At**: ${(/* @__PURE__ */ new Date()).toLocaleString()}  

---

### \u{1F4F8} Visual Evidence
![Bug Screenshot](./${snap.fileName})

---

### \u{1F4A5} Recent Fatal Exceptions & Crash Logs
\`\`\`log
${logcat}
\`\`\`
`;
        await import_promises3.default.writeFile(mdFilePath, markdownContent, "utf-8");
        await vscode6.env.clipboard.writeText(markdownContent);
        if (capturesProvider) capturesProvider.refresh();
        const action = await vscode6.window.showInformationMessage(
          `\u{1F41B} Bug report created & copied to clipboard! (${mdFileName})`,
          "Open Markdown",
          "Reveal in Explorer"
        );
        if (action === "Open Markdown") {
          const doc = await vscode6.workspace.openTextDocument(mdFilePath);
          await vscode6.window.showTextDocument(doc);
        } else if (action === "Reveal in Explorer") {
          await vscode6.commands.executeCommand("revealFileInOS", vscode6.Uri.file(mdFilePath));
        }
      } catch (err) {
        vscode6.window.showErrorMessage(`Bug Report Failed: ${err.message || err}`);
      }
    }
  );
}
function registerMarkdownHoverProvider(context) {
  const provider = vscode6.languages.registerHoverProvider("markdown", {
    provideHover(document, position) {
      const lineText = document.lineAt(position.line).text;
      const regex = /!\[(.*?)\]\((.*?)\)/g;
      let match;
      while ((match = regex.exec(lineText)) !== null) {
        const linkStart = match.index;
        const linkEnd = match.index + match[0].length;
        if (position.character >= linkStart && position.character <= linkEnd) {
          const label = match[1] || "ADBSnap Image";
          const rawPath = match[2];
          const resolvedUri = rawPath.startsWith("http") ? rawPath : vscode6.Uri.file(import_node_path7.default.resolve(import_node_path7.default.dirname(document.uri.fsPath), rawPath));
          const hoverContent = new vscode6.MarkdownString();
          hoverContent.isTrusted = true;
          hoverContent.supportHtml = true;
          hoverContent.appendMarkdown(`**\u{1F4F8} ${label}**

`);
          hoverContent.appendMarkdown(`![](${resolvedUri.toString()}|width=280)

`);
          hoverContent.appendMarkdown(`[\u{1F3A8} Open Studio](command:adbsnap.openStudio) &nbsp;|&nbsp; [\u{1F4C2} Reveal Folder](command:revealFileInOS?${encodeURIComponent(JSON.stringify(resolvedUri))})`);
          return new vscode6.Hover(hoverContent, new vscode6.Range(position.line, linkStart, position.line, linkEnd));
        }
      }
      return null;
    }
  });
  context.subscriptions.push(provider);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
