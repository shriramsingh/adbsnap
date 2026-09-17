# ADBSnap — Mobile Screenshot & Asset Studio

> **Instant 4K mobile screenshot capture, vector device bezels, embedded asset studio & multi-store export — directly inside VS Code.**

[![VS Code Marketplace](https://img.shields.io/badge/marketplace-v0.2.1-blue.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=shriramsingh.adbsnap)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://github.com/shriramsingh/adbsnap/blob/main/LICENSE)

Stop context-switching between your code editor, emulator windows, and Figma templates. **ADBSnap for VS Code** captures your attached Android phone or emulator via ADB, wraps it into vector-crisp bezels (iPhone 16 Pro, Google Pixel 9 Pro), applies studio-grade gradient backdrops with smart typography, and exports ready-to-upload graphics right from your editor.

---

## ⚡ Features

### 📸 Instant Capture & Clipboard
- **Quick Capture (Framed)** — Press `Ctrl+Alt+S` (`Cmd+Alt+S` on macOS) to capture, frame into a 4K showcase mockup, and save to your project's `./output/` folder in under a second.
- **Snap to Clipboard** — Press `Ctrl+Alt+C` to capture and copy the framed graphic straight to your OS clipboard. Paste directly into GitHub Pull Requests, Jira tickets, Slack, or documentation.
- **Raw Screenshot** — Need unedited device pixels? One click captures clean PNG buffers without borders or framing.

### 🎨 Embedded Visual Asset Studio
- Click the **palette icon 🎨** in the sidebar or run `ADBSnap: Open Asset Studio`.
- **Live Canvas Preview** — Real-time interactive stage showing your mockup.
- **Hardware Frames** — Toggle between iPhone 16 Pro (with Dynamic Island), Google Pixel 9 Pro, and Modern Minimalist chassis.
- **Studio Backdrops** — 6 curated gradients (`Aurora`, `Studio Light`, `Sunset`, `Midnight`, `Fresh Mint`, `Royal`).
- **Dynamic Typography** — Add custom headlines and subtitles with automatic contrast adjustment.

### 📱 Activity Bar Sidebar & Views
- **Connected Devices View** — Live tree view of all USB, Wi-Fi, and emulator devices with real-time health indicators (Active, Ready, Unauthorized).
- **1-Click Actions** — Snap screenshots, switch targets, or toggle wireless mode directly from the tree view.
- **Recent Captures Gallery** — Browse all recently generated graphics and export packs. Open in editor, copy to clipboard, reveal in OS file manager, or delete with one click.

### 📶 Wireless ADB Management
- **Enable Wireless** — Put any USB-connected device into TCP/IP wireless mode (`adbsnap wifi`).
- **Turn Off Wi-Fi Mode** — Revert cleanly back to USB mode and close listening ports with one click (`adbsnap.disconnectWifi`).

### 📦 Multi-Store Asset Bundler
- Run `ADBSnap: Export Store Asset Pack (ZIP)`.
- Automatically outputs all required **Apple App Store** (6.9", 6.7", 6.5") and **Google Play** dimensions packaged into a ready-to-upload `.zip` archive.

---

## 🛠️ Commands Reference

Access via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) or the sidebar:

| Command | Shortcut | Description |
| :--- | :--- | :--- |
| `ADBSnap: Quick Capture (Framed)` | `Ctrl+Alt+S` | Capture & frame active screen into 4K graphic |
| `ADBSnap: Capture & Copy to Clipboard` | `Ctrl+Alt+C` | Capture, frame & copy directly to clipboard |
| `ADBSnap: Capture Raw Screenshot` | — | Save clean unedited screen buffer |
| `ADBSnap: Open Asset Studio` | — | Open the interactive visual preview studio tab |
| `ADBSnap: Export Store Asset Pack (ZIP)` | — | Generate all App Store & Play Store resolutions |
| `ADBSnap: Select Active Device` | — | QuickPick menu to switch target device |
| `ADBSnap: Switch to Wireless ADB (WiFi)` | — | One-click TCP/IP wireless pairing |
| `ADBSnap: Turn Off Wi-Fi Mode (Revert to USB)` | — | Disconnect wireless session & reset to USB |
| `ADBSnap: Run ADB Doctor Diagnostics` | — | Verify ADB paths, devices, and permissions |

---

## ⚙️ Settings (`settings.json`)

Configure your preferences under `Settings` $\rightarrow$ `Extensions` $\rightarrow$ `ADBSnap`:

```json
{
  "adbsnap.defaultTheme": "aurora",
  "adbsnap.defaultFrame": "iphone-16-pro",
  "adbsnap.outputDirectory": "${workspaceFolder}/output",
  "adbsnap.customAdbPath": ""
}
```

| Setting | Default | Options |
| :--- | :--- | :--- |
| `adbsnap.defaultTheme` | `aurora` | `aurora`, `studioLight`, `freshMint`, `sunset`, `midnight`, `royal`, `cleanDark` |
| `adbsnap.defaultFrame` | `iphone-16-pro` | `iphone-16-pro`, `pixel-9-pro`, `minimal` |
| `adbsnap.outputDirectory` | `${workspaceFolder}/output` | Custom save directory (falls back to Desktop if no workspace) |
| `adbsnap.customAdbPath` | `""` | Optional manual path to `adb` executable |

---

## 📦 Requirements

1. **Android SDK Platform-Tools (ADB):** Must be available in your system `PATH` or configured via `adbsnap.customAdbPath`.
2. **ADBSnap CLI (recommended):**
   ```bash
   npm install -g adbsnap
   ```
3. An Android device or emulator with **USB Debugging enabled**.

---

## 📄 License

MIT © [Shriram Singh](https://github.com/shriramsingh)
