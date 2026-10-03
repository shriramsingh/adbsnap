# ADBSnap — Mobile Screenshot & Asset Studio

> Capture Android and iOS screens, style device mockups, and prepare App Store / Google Play assets from VS Code.

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/shriramsingh.adbsnap.svg?style=flat-square&color=blue&label=VS%20Code)](https://marketplace.visualstudio.com/items?itemName=shriramsingh.adbsnap)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://github.com/shriramsingh/adbsnap/blob/main/LICENSE)

ADBSnap for VS Code captures connected Android devices and, on macOS, iOS simulators and paired iPhones/iPads. Frame screenshots with vector device bezels, customize the canvas in the embedded Studio, and export store-ready image packs. iOS uses Apple's Xcode tools; it does not use ADB.

## Platform support

| Capability | Android | iOS Simulator (macOS) | Physical iPhone/iPad (macOS) |
| :--- | :--- | :--- | :--- |
| Device discovery and raw/framed capture | ADB | Xcode `simctl` | Xcode `devicectl` |
| Studio preview, styling, and store export | Yes | Yes | Yes |
| Wireless device controls | ADB Wi-Fi | Not applicable | Pair through Apple's Xcode tools |
| Automatic screen exploration | CLI / full Studio | XCTest Auto Explorer via CLI / full Studio | XCTest Auto Explorer via CLI / full Studio; signing required |

The VS Code extension provides device discovery, capture, the embedded asset Studio, and store export. Screen-exploration commands are not exposed in the VS Code extension: use the ADBSnap CLI (`adbsnap explore` for Android and `adbsnap explore-ios` for iOS) or the full ADBSnap Studio launched with `adbsnap studio`.

## Features

### Capture and device management
- **Quick Capture (Framed)** — `Ctrl+Alt+S` (`Cmd+Alt+S` on macOS) captures the active screen, applies a device frame, and saves it to the configured output directory.
- **Capture & Copy to Clipboard** — `Ctrl+Alt+C` copies the framed capture for pasting into issues, pull requests, chat, or documentation.
- **Capture Raw Screenshot** — Save screen pixels without a bezel or marketing canvas.
- **Connected Devices View** — See Android USB/Wi-Fi/emulators and iOS simulators/paired devices, their connection type, and authorization state; choose the active target.
- **Recent Captures Gallery** — Open captures, copy them, reveal them in the file manager, or remove them.

### Asset Studio and exports
- Open the embedded interactive Studio from the Activity Bar palette icon or `ADBSnap: Open Asset Studio`.
- Adjust device bezels, backdrop themes, typography, alignment, and layout with live preview.
- Collect, reorder, and style multiple screens; export App Store and Google Play asset packs as ZIP files.
- Create animated stories from screens captured into the Studio filmstrip.

### Android-only tools
- Switch a USB-connected Android device to wireless ADB and disconnect a wireless session.
- Run Android diagnostics (`ADBSnap: Run ADB Doctor Diagnostics`). The Android tab crawler is available from the CLI/full Studio, not the VS Code extension.

## Getting started

### Android

1. Install Android SDK Platform-Tools and make `adb` available on `PATH` (or set `adbsnap.customAdbPath`).
2. Enable USB debugging on the device, connect it, unlock it, and accept the RSA authorization prompt. Android emulators are also supported.
3. Run `ADBSnap: Refresh Devices`, select the active device, then use Quick Capture or open the Studio.

For Android wireless debugging, use the extension's wireless commands or Android's Wireless Debugging pairing flow. These controls apply to Android only.

### iOS (macOS only)

1. Install Xcode, open it once, accept its license, and ensure Xcode's command-line tools are selected. `xcrun simctl` and `xcrun devicectl` must be available.
2. For a simulator, install an iOS Simulator runtime and boot the simulator.
3. For a physical iPhone/iPad, connect and unlock it, then accept the Trust This Computer/pairing prompts. Confirm that it appears in `xcrun devicectl list devices`.
4. Run `ADBSnap: Refresh Devices` and select the iOS target. Quick Capture and raw capture do not require signing or an Apple Developer Program membership once the device is paired.

Choose an iPhone or iPad bezel in Studio for the mockup. The bezel is presentation framing; it does not alter the raw screenshot.

### App exploration (CLI / full Studio)

App exploration is available through the published CLI or the full Studio (`adbsnap studio`), not as a VS Code extension command. Android uses the existing tab crawler; iOS uses XCTest/XCUITest. Install the CLI if needed:

```bash
npm install -g adbsnap
adbsnap devices

# Simulator: app must already be installed; use its bundle identifier
adbsnap explore-ios --bundle com.example.myapp --device "<simulator ID>" --zip

# Physical device: requires Xcode signing configuration
adbsnap explore-ios --bundle com.example.myapp \
  --device "<iOS device ID>" --team "<10-character Team ID>" --zip
```

In the full Studio, click **Auto-Crawl**, select an installed app in the iOS app picker, and start the run. The demo app is installable automatically on simulators only.

For a physical iPhone/iPad, pair and trust it, enable **Developer Mode** (Settings > Privacy & Security > Developer Mode; a restart may be required), sign in to an Apple account in Xcode, and provide the account's 10-character Team ID. Xcode automatically signs ADBSnap's temporary UI-test runner and may contact Apple to create/update a provisioning profile. A free Personal Team may work for local runs but is subject to Apple's provisioning and capability restrictions; signing is required for physical XCTest, not for screenshots. Follow Xcode's error output if signing or Developer Mode is not ready.

**What to expect:** the first exploration may take several minutes while Xcode builds the runner. XCTest launches and may terminate/relaunch the selected app while replaying routes; do not run during unsaved work or sensitive in-app operations. It captures tab roots and follows accessible, labelled navigation buttons up to two levels deep, with a maximum of 20 screens and 30 navigation attempts.

**Limitations:** this is a conservative accessibility-based explorer, not a general-purpose test recorder. It does not fill forms, tap arbitrary controls, follow external links, authenticate, or understand app-specific flows. Common destructive/transactional labels are skipped, but review the limitations before using it on apps with important data. Controls must be exposed to XCTest. Physical-device XCTest is implemented but has not yet been validated on a connected iPhone/iPad; simulator automation and mocked device inventory parsing are covered by CI.

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Shortcut | Description |
| :--- | :--- | :--- |
| `ADBSnap: Quick Capture (Framed)` | `Ctrl+Alt+S` | Capture and frame the active device screen |
| `ADBSnap: Capture & Copy to Clipboard` | `Ctrl+Alt+C` | Capture, frame, and copy |
| `ADBSnap: Capture Raw Screenshot` | — | Save unframed device pixels |
| `ADBSnap: Open Asset Studio` | — | Open the interactive Studio tab |
| `ADBSnap: Export Store Asset Pack (ZIP)` | — | Generate store-resolution assets |
| `ADBSnap: Select Active Device` | — | Choose the target device |
| `ADBSnap: Refresh Connected Devices` | — | Refresh device discovery |
| `ADBSnap: Switch to Wireless ADB (WiFi)` | — | Enable Android wireless ADB |
| `ADBSnap: Turn Off Wi-Fi Mode (Revert to USB)` | — | Disconnect Android wireless ADB |
| `ADBSnap: Run ADB Doctor Diagnostics` | — | Diagnose Android ADB setup |

## Settings

Configure in **Settings > Extensions > ADBSnap**:

```json
{
  "adbsnap.defaultTheme": "aurora",
  "adbsnap.defaultFrame": "iphone-16-pro",
  "adbsnap.outputDirectory": "${workspaceFolder}/output",
  "adbsnap.customAdbPath": ""
}
```

`adbsnap.customAdbPath` is Android-only. iOS tooling is resolved from the selected Xcode installation and its `xcrun` command.

For the full CLI and platform guide, see the [ADBSnap README](https://github.com/shriramsingh/adbsnap#readme). Report problems at [GitHub Issues](https://github.com/shriramsingh/adbsnap/issues).

## License

MIT © [Shriram Singh](https://github.com/shriramsingh)
