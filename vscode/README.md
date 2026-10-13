# ADBSnap — Mobile Screenshot & Asset Studio

> Capture Android and iOS screens, style device mockups, and prepare App Store / Google Play assets from VS Code.

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/shriramsingh.adbsnap.svg?style=flat-square&color=blue&label=VS%20Code)](https://marketplace.visualstudio.com/items?itemName=shriramsingh.adbsnap)
[![Website](https://img.shields.io/badge/website-live-success.svg?style=flat-square)](https://shriramsingh.github.io/adbsnap/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://github.com/shriramsingh/adbsnap/blob/main/LICENSE)

---

### 🌐 [Official Website & Live Showcase ↗](https://shriramsingh.github.io/adbsnap/) &bull; 📦 [NPM Package ↗](https://www.npmjs.com/package/adbsnap) &bull; 🐙 [GitHub Repository ↗](https://github.com/shriramsingh/adbsnap)

---

ADBSnap for VS Code captures connected Android devices and, on macOS, iOS simulators and paired iPhones/iPads. Frame screenshots with vector device bezels, customize the canvas in the embedded Studio, and export store-ready image packs. iOS uses Apple's Xcode tools; it does not use ADB.

## Platform support

| Capability | Android | iOS Simulator (macOS) | Physical iPhone/iPad (macOS) |
| :--- | :--- | :--- | :--- |
| Device discovery and raw/framed capture | ADB | Xcode `simctl` | Xcode `devicectl` |
| Studio preview, styling, and store export | Yes | Yes | Yes |
| Wireless device controls | ADB Wi-Fi | Not applicable | Pair through Apple's Xcode tools |
| Automatic screen exploration | CLI / full Studio | XCTest Auto Explorer via CLI / full Studio | XCTest Auto Explorer via CLI / full Studio; signing required |

The VS Code extension provides device discovery, capture, markdown document insertion, autonomous app exploration, app lifecycle controls, the embedded asset Studio, and multi-store asset pack export.

## Features

### Capture and device management
- **Quick Capture (Framed)** — `Ctrl+Alt+S` (`Cmd+Alt+S` on macOS) captures the active screen, applies a device frame, and saves it to the configured output directory.
- **Capture & Copy to Clipboard** — `Ctrl+Alt+C` copies the framed capture for pasting into issues, pull requests, chat, or documentation.
- **Capture and Insert into Document** — Snaps active screen and instantly writes `![ADBSnap](./output/...)` markdown syntax at your cursor position in any active document.
- **Capture Raw Screenshot** — Save screen pixels without a bezel or marketing canvas.
- **Connected Devices View** — See Android USB/Wi-Fi/emulators and iOS simulators/paired devices, their connection type, and authorization state; choose the active target with 1 click.
- **Auto-Reconnect & Wi-Fi Pairing** — Connect directly via IP (`adbsnap.connectIp`), pair Android 11+ devices with 6-digit PIN code (`adbsnap.pairWifi`), or 1-click reconnect to offline Wi-Fi phones.
- **Recent Captures Gallery** — Open captures in VS Code or Asset Studio, copy them, reveal them in OS file explorer, or remove them. Supports PNG, WebP, AVIF, JPEG, and ZIP.

### Asset Studio and exports
- Open the embedded interactive Studio from the Activity Bar palette icon or `ADBSnap: Open Asset Studio`.
- Adjust 15+ device bezels (iPhone 16 Pro Max 6.9", Pixel 9 Pro Fold 8", Galaxy S25 Ultra, iPad Pro 13" M4, etc.), 16 gradient backdrop themes, typography, and duo-split/overlap layouts with live preview.
- Collect, reorder, and style multiple screens; export App Store and Google Play asset packs as ZIP files.

### App exploration & lifecycle automation
- **Autonomous Android Tab Crawler** (`adbsnap.explore`) — Hands-free crawling and capture of bottom navigation tabs.
- **Autonomous iOS UI Explorer** (`adbsnap.exploreIos`) — Hands-free XCTest traversal of tab roots and accessible view hierarchies on macOS.
- **Instant App Data Reset** (`adbsnap.resetAppData`) — Execute `adb shell pm clear` to wipe auth tokens and cache in <100ms, returning apps to fresh onboarding state.
- **Relaunch Mobile App** (`adbsnap.relaunchApp`) — Cleanly force-stop and restart the active foreground application.

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Shortcut | Description |
| :--- | :--- | :--- |
| `ADBSnap: Quick Capture (Framed)` | `Ctrl+Alt+S` | Capture and frame the active device screen |
| `ADBSnap: Capture & Copy to Clipboard` | `Ctrl+Alt+C` | Capture, frame, and copy to system clipboard |
| `ADBSnap: Capture and Insert into Document` | — | Capture and insert `![ADBSnap](path)` markdown tag at cursor |
| `ADBSnap: Capture Raw Screenshot` | — | Save unframed device pixels |
| `ADBSnap: Open Asset Studio` | — | Open the interactive Studio tab |
| `ADBSnap: Change Default Bezel Frame` | — | QuickPick: Switch default bezel (iPhone 16 Pro Max, Pixel Fold, etc.) |
| `ADBSnap: Change Default Canvas Theme` | — | QuickPick: Switch default backdrop gradient (Aurora, Cyberpunk, etc.) |
| `ADBSnap: Change Default Export Format` | — | QuickPick: Switch output format (PNG, WebP, AVIF, JPEG) |
| `ADBSnap: Change Default Aspect Ratio` | — | QuickPick: Switch canvas aspect ratio (Portrait 9:19.5, Landscape 16:9, Square 1:1) |
| `ADBSnap: Toggle Android Demo Mode` | — | QuickPick: Enable/disable status bar 9:41 AM, 100% battery, no notifications |
| `ADBSnap: Explore & Capture Android App Tabs` | — | Autonomous bottom-tab crawler |
| `ADBSnap: Explore & Capture iOS App Views (XCTest)`| — | Autonomous iOS UI explorer (macOS) |
| `ADBSnap: Reset App Data (Logout / Clear Cache)` | — | Instant `pm clear` application reset |
| `ADBSnap: Relaunch Mobile App` | — | Terminate and restart active foreground application |
| `ADBSnap: Export Store Asset Pack (ZIP)` | — | Generate store-resolution assets |
| `ADBSnap: Select Active Device` | — | Choose the target device |
| `ADBSnap: Refresh Connected Devices` | — | Refresh device discovery |
| `ADBSnap: Connect Device via Wi-Fi IP` | — | Direct IP/Port wireless connection |
| `ADBSnap: Pair Wireless Device (Android 11+ Code)` | — | 6-digit wireless pairing code modal |
| `ADBSnap: Switch to Wireless ADB (WiFi)` | — | Enable Android wireless ADB |
| `ADBSnap: Turn Off Wi-Fi Mode (Revert to USB)` | — | Disconnect Android wireless ADB |
| `ADBSnap: Run ADB Doctor Diagnostics` | — | Diagnose Android ADB setup |

## Settings

Configure in **Settings > Extensions > ADBSnap**:

```json
{
  "adbsnap.defaultTheme": "aurora",
  "adbsnap.defaultFrame": "iphone-16-pro",
  "adbsnap.defaultFormat": "png",
  "adbsnap.defaultAspectRatio": "portrait",
  "adbsnap.outputDirectory": "${workspaceFolder}/output",
  "adbsnap.customAdbPath": ""
}
```

`adbsnap.customAdbPath` is Android-only. iOS tooling is resolved from the selected Xcode installation and its `xcrun` command.

For the full CLI and platform guide, see the [ADBSnap README](https://github.com/shriramsingh/adbsnap#readme). Report problems at [GitHub Issues](https://github.com/shriramsingh/adbsnap/issues).

## License

MIT © [Shriram Singh](https://github.com/shriramsingh)
