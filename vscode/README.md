# ADBSnap — Mobile Screenshot & Asset Studio

> **Instant 4K mobile screenshot capture, vector device bezels & store asset studio — directly inside VS Code.**

## ⚡ Features

- 📸 **Quick Capture (Framed)** — One shortcut (`Ctrl+Alt+S`) captures your live Android device, wraps it in a 4K iPhone 16 Pro or Pixel 9 Pro bezel with studio-grade gradient backdrops, and saves it instantly.
- 📋 **Snap to Clipboard** — `Ctrl+Alt+C` captures and copies the framed screenshot directly to your OS clipboard — paste into GitHub PRs, Jira, Slack, or Docs instantly.
- 📱 **Live Device Status Bar** — See your connected Android device (USB/Wi-Fi/Emulator) in the VS Code status bar at all times.
- 🔄 **One-Click Device Switching** — Click the status bar to switch between multiple connected devices.
- 📶 **Wireless ADB Setup** — Switch from USB to wireless debugging with a single command.
- 🩺 **ADB Doctor** — Diagnose your Android SDK, ADB path, and device authorization status.

## 🛠️ Commands

Open Command Palette (`Ctrl+Shift+P`) and type `ADBSnap`:

| Command | Shortcut | Description |
| :--- | :--- | :--- |
| `ADBSnap: Quick Capture (Framed)` | `Ctrl+Alt+S` | Capture & frame with 4K bezel + gradient |
| `ADBSnap: Capture & Copy to Clipboard` | `Ctrl+Alt+C` | Capture, frame & copy to clipboard |
| `ADBSnap: Capture Raw Screenshot` | — | Save clean unframed device screen |
| `ADBSnap: Select Active Device` | — | Switch between connected devices |
| `ADBSnap: Switch to Wireless ADB (WiFi)` | — | One-click wireless pairing |
| `ADBSnap: Run ADB Doctor Diagnostics` | — | Environment & device health check |

## ⚙️ Settings

| Setting | Default | Description |
| :--- | :--- | :--- |
| `adbsnap.defaultTheme` | `aurora` | Gradient preset (`aurora`, `studioLight`, `freshMint`, `sunset`, `midnight`, `royal`, `cleanDark`) |
| `adbsnap.defaultFrame` | `iphone-16-pro` | Device bezel (`iphone-16-pro`, `pixel-9-pro`, `minimal`) |
| `adbsnap.outputDirectory` | `${workspaceFolder}/output` | Where screenshots are saved |
| `adbsnap.customAdbPath` | *(auto-detect)* | Custom path to `adb` binary |

## 📦 Requirements

- **ADB** must be installed and available (Android SDK Platform-Tools)
- **adbsnap CLI** must be installed globally:
  ```bash
  npm install -g adbsnap
  ```
- An Android device or emulator connected via USB or Wi-Fi with **USB Debugging enabled**

## 📄 License

MIT © [Shriram Singh](https://github.com/shriramsingh)
