# ADBSnap 📸

> **Automated Mobile Screenshot Capture, 4K Vector Device Framing & App Store / Google Play Asset Studio**

[![npm version](https://img.shields.io/npm/v/adbsnap.svg?style=flat-square)](https://www.npmjs.com/package/adbsnap)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/shriramsingh.adbsnap.svg?style=flat-square&color=blue&label=VS%20Code)](https://marketplace.visualstudio.com/items?itemName=shriramsingh.adbsnap)
[![Website](https://img.shields.io/badge/website-live-success.svg?style=flat-square)](https://shriramsingh.github.io/adbsnap/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg?style=flat-square)](https://github.com/shriramsingh/adbsnap)

Stop wrestling with manual Figma templates or low-res screenshot scripts. **ADBSnap** is the all-in-one Android & iOS screenshot and 4K device mockup tool available as an [NPM package](https://www.npmjs.com/package/adbsnap) and official [VS Code Marketplace extension](https://marketplace.visualstudio.com/items?itemName=shriramsingh.adbsnap). It captures Android devices and, on macOS, booted iOS simulators or paired physical iPhones and iPads, then frames screenshots with vector-sharp device bezels, studio-grade backdrops, and auto-wrapped typography for store-ready exports.

---

## 🚀 What's New in v1.3.0

- ⚡ **High-Speed Parallel Compositing & Chassis Caching**:
  - Pre-assembles phone chassis (screenshot + 4K bezel + drop shadow) once in host RAM and caches the composited buffer.
  - Multi-store export is fully parallelized across all store targets (`Promise.all`), slashing export duration from **>8.1s to ~2.5s** (over **3x speedup**).
  - Fixed aspect ratio crop calculations for non-standard banners (e.g. Google Play Feature Graphic 1024×500).
- 🚀 **Ultra-Fast Raw Framebuffer Screencap**:
  - Direct uncompressed RGBA capture stream via `adb exec-out screencap`, bypassing slow on-device PNG encoding.
  - Binary header parsing with Sharp in-memory conversion completes in **~52ms** with transparent fallback to `screencap -p`.
- ⚡ **Studio Fast-Preview & 60fps Responsiveness**:
  - Dedicated half-resolution preview endpoint (`format: 'preview'`, 645×1398), shrinking loopback Base64 payload by **83%** (~85 KB).
  - Tightened UI slider debounce to 120ms for smooth, instantaneous 60fps canvas feedback.
  - Fixed Studio directory resolution to serve pre-compiled assets from `dist/studio/` with clean universal `http://localhost:${port}` fallback.
- 🎨 **Next-Gen Image Formats (`--format=webp|avif|png|jpeg`)**:
  - Added support for cutting-edge formats across CLI and export pipelines.
  - **AVIF** delivers stunning quality at **7.3 KB (95% smaller than PNG)**; **WebP** produces **~86 KB (42% smaller)** assets ready for high-speed web distribution.
- 📱 **2026 Flagship Vector Bezels**:
  - Added **iPhone 16 Pro Max** (`iphone-16-pro-max`, 6.9" Super Retina XDR with Dynamic Island).
  - Added **Pixel 9 Pro Fold** (`pixel-9-pro-fold`, Inner 8" Foldable OLED display).
  - Added **Galaxy S25 Ultra** (`galaxy-s25-ultra`, 6.8" Dynamic AMOLED 2X titanium chassis with punch-hole).
- ✍️ **Flexible Multi-Line Typography & Positioning**:
  - Support for **Top**, **Bottom**, or **Both** text placement: place copy above the device, below the device, or split headlines on top with feature callouts on bottom.
  - Multi-line headline and subtitle formatting with explicit line breaks (`\n`) and dynamic font downscaling for 3+ lines.
  - Interactive Studio dashboard includes a 1-click position switcher (`[ ⬆ Top | ⬇ Bottom | ↕ Both ]`) and multi-line textareas with live 60fps fast-preview.
- 🍎 **iOS Simulator & Physical Device Support**:
  - Auto-detects booted iOS simulators through `xcrun simctl` and paired physical iPhones/iPads through `xcrun devicectl` on macOS.
  - Routes iOS screenshots through the same framing and App Store export pipelines used for Android captures.
  - Adds native XCTest Auto Explorer for simulator apps and paired physical iOS devices (physical runs require Xcode automatic signing and a Team ID).
  - Runs a macOS GitHub Actions smoke test for simulator capture and a mocked physical-device discovery/capture test.
- 🐛 **Studio Filmstrip Bug Fixes**:
  - Resolved event propagation blocking on filmstrip thumbnails (`pointer-events-none`), restoring instant single-screen deletion (`Trash2`) and reordering.

---

## 🚀 What's New in v1.2.1

- 🔄 **Unified Versioning & Automated Multi-Platform Release Engine**:
  - Synchronized versions across NPM (`adbsnap@1.2.1`), VS Code Marketplace extension, and CLI binary.
  - One-command automated dual-builder and packager (`npm run version:sync`).
- ⭐ **Community & Rating Prompts**:
  - Polite 5th-capture VS Code Marketplace review prompt and CLI GitHub star prompt.
- 🔍 **SEO & Discoverability Infrastructure**:
  - Added structured Schema.org JSON-LD, canonical indexing, robots.txt, and sitemap.xml to the official showcase site at [shriramsingh.github.io/adbsnap](https://shriramsingh.github.io/adbsnap/).

---

## 🚀 What's New in v1.2.0

- ⚡ **Zero-Dependency Native Studio Engine**:
  - Replaced heavy Next.js runtime with an ultra-lightweight, native Node HTTP server.
  - Reduced runtime dependencies to **only 3** (`sharp`, `archiver`, `gifenc`).
  - Studio boots in **< 15 milliseconds** with zero Webpack compilation delay.
- 🪟 **App Window Mode (Frameless Desktop App Experience)**:
  - `adbsnap studio` now automatically launches in a dedicated desktop window without a browser address bar or tabs.
  - Serves cleanly at `http://adbsnap.localhost:3000`.
- 💎 **100% Pre-compiled Original Studio UI**:
  - Full React 19 visual dashboard with all Lucide icons, glassmorphism, filmstrip, and animations pre-compiled at build time.
- 🚀 **Flawless `npx` Compatibility**:
  - Run `npx adbsnap studio` instantly from any directory with zero cache or loader issues.

---

## 🚀 What's New in v1.1.0

- 📶 **Comprehensive Wireless ADB Suite**:
  - **1-Click USB ↔ Wi-Fi Switch**: Automatically discover device IP, launch TCP/IP mode, and disconnect cables effortlessly.
  - **Android 11+ Pairing Modal**: Built-in 6-digit wireless debugging pairing with port discovery and mDNS ZeroConf.
  - **Dynamic USB Auto-Prioritization**: Automatically switches to lightning-fast USB mode the moment you plug a cable in, and falls back to Wi-Fi when unplugged.
  - **Interactive Transport Switcher**: Instant 1-click toggle between `[ 🔌 USB ▾ ]` and `[ 📶 Wi-Fi ▾ ]` without disconnecting.
- 🖼️ **"None (Raw Screenshot)" Canvas Theme**:
  - Export pristine, unedited 1:1 mobile screenshots with zero framing or backdrops.
  - Automatically dims and disables headline and typography controls for a focused workflow.
- 🎬 **Animated Story Maker**:
  - Turn multi-step screen flows into looping animated GIFs with customizable playback pace (500ms – 4000ms).
- 📱 **Smart App Detection & Package Copier**:
  - Humanized active application badge (e.g. `CoachConnect`, `Instagram`, `Chrome`) with 1-click package name copying to clipboard.
- 📐 **Expanded Device & Bezel Suite**:
  - Added **Frameless Floating Mockup** (`frameless`), **iPad Pro 13"**, **Android Tablet 11"**, **iPhone 16 Pro**, and **Google Pixel 9 Pro**.
  - Verified 2026 App Store (6.9", 6.7", 6.5") and Google Play specifications.
- 🎨 **Redesigned Studio Workspace**:
  - Space-optimized header, drag-and-drop external image upload, filmstrip reordering, and direct copy-to-clipboard (`Ctrl+C`).

---

## ⚡ Highlights

- 🚀 **Zero-Config Instant Capture:** Direct RAM streaming via ADB — no temporary device files left behind.
- 🍎 **Android + iOS Capture:** Android via ADB on supported desktop OSes; iOS simulators and paired physical iPhones/iPads via Xcode on macOS.
- 📱 **4K Vector Bezels:** Pixel-crisp iPhone 16 Pro (with Dynamic Island), Pixel 9 Pro, Tablets, and Frameless modes.
- 🎨 **Curated Studio Backdrops:** 8 presets (`aurora`, `studioLight`, `sunset`, `midnight`, `freshMint`, `royal`, `cleanDark`, `none`) or custom styles.
- ✍️ **Smart Typography:** Dynamic SVG headline and subtitle rendering with automatic text-wrapping and star rating badges.
- 📦 **Multi-Store Asset Export:** Generate all required App Store and Google Play sizes bundled into a single ZIP in one keystroke.
- 🤖 **Hands-Free Tab Crawler:** Automatically detect and crawl through bottom navigation tabs, capturing and framing each view hands-free.
- 🩺 **Built-in Doctor:** Diagnose ADB paths, device health, and USB authorization in seconds.
- 🖥️ **Dual CLI Binary:** Run as `adbsnap` or `snapshot`.

---

### 🧪 Automated Mobile QA with Plain English? Try PromptTest Studio

Need to automate end-to-end user journeys, test bottom navigation hubs, and catch visual regressions on Android?  
Check out **[PromptTest Studio](https://shriramsingh.github.io/prompttest-studio-site/)** — our zero-code visual desktop IDE for autonomous mobile testing:
- 📱 **Live Android Device Mirroring**: Low-latency screen interaction with click, drag, and hardware navigation.
- 🎯 **Visual Element Inspector**: Point and click to inspect native views with instant auto-generated plain-English assertions.
- 📸 **Visual Regression & Exclude Masks**: Pixel-level baseline comparisons with draggable exclude masks for dynamic content.
- 🚀 **100% Local-First & Air-Gapped**: Runs entirely on your machine over local ADB with zero cloud dependencies.

👉 **[Explore PromptTest Studio](https://shriramsingh.github.io/prompttest-studio-site/)** &bull; **[Download Windows App](https://shriramsingh.github.io/prompttest-studio-site/downloads.html)**

---

## 📦 Quick Start

### Launch Interactive Web Studio (Recommended)
```bash
npx adbsnap studio
```
Opens the visual studio dashboard directly in dedicated **App Window Mode** at `http://adbsnap.localhost:3000`.

### Run Instantly via `npx` (Headless Snap)
```bash
npx adbsnap snap
```

### Or Install Globally
```bash
npm install -g adbsnap
```

### Install in Visual Studio Code
Prefer an in-editor workflow? Install the official extension directly from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=shriramsingh.adbsnap):
```bash
code --install-extension shriramsingh.adbsnap
```

### Platform support at a glance

| Feature | Android device/emulator | iOS Simulator | Physical iPhone/iPad |
| :--- | :--- | :--- | :--- |
| Discover devices | Yes, using ADB | Yes, using Xcode `simctl` | Yes, using Xcode `devicectl` |
| Capture raw/framed screenshots | Yes | Yes | Yes |
| App Store / Google Play export | Yes | Yes | Yes |
| Studio live capture and styling | Yes | Yes | Yes |
| Android wireless ADB controls | Yes | Not applicable | Not applicable |
| Automatic app-screen exploration | Android tab crawler | XCTest Auto Explorer | XCTest Auto Explorer (signing required) |

The npm CLI and VS Code extension can be used on supported desktop operating systems for Android. **All iOS features require macOS and a working Xcode installation**; iOS commands are unavailable on Windows/Linux. Android uses Android SDK Platform-Tools (`adb`). iOS simulator discovery/capture uses `xcrun simctl`, while connected iPhones/iPads use Apple's `xcrun devicectl`.

For Android, install Android SDK Platform-Tools, ensure `adb` is on `PATH` (or configure `adbsnap.customAdbPath` in VS Code), enable USB debugging, unlock the device, and accept the on-device debugging authorization prompt. Android emulators and ADB wireless connections are also supported.

### iOS setup and screenshot capture (macOS)

1. Install Xcode, open it once, accept its license, and select the intended installation with `xcode-select` if more than one Xcode is installed. Confirm `xcrun simctl list devices` works.
2. **For a simulator:** install an iOS Simulator runtime in Xcode, boot a simulator, and keep it booted.
3. **For a physical iPhone/iPad:** connect it to the Mac, unlock it, accept the Trust This Computer prompt, and complete pairing. It should appear as connected/paired in `xcrun devicectl list devices`. A cable is the simplest first connection; wireless pairing is managed by Apple's Xcode tooling, not ADBSnap's Android Wi-Fi controls.
4. Run `npx adbsnap devices` (or `adbsnap devices` after installing the CLI) and copy the desired iOS device ID if more than one device is connected.

```bash
# Capture and frame from the active/first ready iOS device
npx adbsnap snap --frame iphone-16-pro

# Target a particular simulator/device explicitly
npx adbsnap snap --device "<iOS device ID>" --frame iphone-16-pro

# Export an App Store asset pack from the selected iPhone/iPad screen
npx adbsnap export --device "<iOS device ID>" --store apple --zip

# Open the full Studio workflow
npx adbsnap studio
```

Once pairing is established, **iOS screenshot capture does not require an Apple Developer Program membership or signing the app**. Captures are routed into the same framing, styling, and store-export pipeline as Android. Select an appropriate iPhone/iPad bezel when preparing store graphics; the selected bezel is a mockup and does not change the underlying screenshot.

**In VS Code:** install the ADBSnap extension, refresh Connected Devices, select the iOS simulator/device, then use Quick Capture or Capture Raw Screenshot. The extension provides capture and asset styling for iOS; use the npm CLI or full `adbsnap studio` app for automated screen exploration.

### iOS Auto Explorer (XCTest preview)

The iOS Auto Explorer uses Apple's XCTest/XCUITest, not a third-party automation library.

#### Explore an iOS Simulator app

1. Install/open Xcode, install an iOS Simulator runtime, then launch a simulator from Xcode or the Simulator app and leave it booted.
2. Install the app you want to explore in that simulator and launch it once if its first-run setup is needed. Find its bundle ID in the app's Xcode target settings or your app build configuration.
3. Run `npx adbsnap devices` to find the simulator ID. If several simulators are booted, use the ID of the intended one.
4. Either start `npx adbsnap studio`, click **Auto-Crawl**, choose the simulator app from the searchable picker, and click **Explore selected app**; or run the CLI command below. The ADBSnap demo app is available in Studio and can be installed automatically for simulator runs.

#### Explore a physical iPhone or iPad app

1. Connect and unlock the device, accept **Trust This Computer**, and complete Xcode pairing. Confirm it appears in `xcrun devicectl list devices` and `npx adbsnap devices`.
2. Enable **Developer Mode** on the device (Settings > Privacy & Security > Developer Mode); iOS may require a restart and a confirmation.
3. Install the app you want to explore on the device and note its bundle ID. Only apps already installed on the physical device are available; the ADBSnap demo app is simulator-only.
4. Sign in to an Apple account in Xcode (Xcode > Settings > Accounts), obtain the account's 10-character **Team ID**, then provide it in Studio's Team ID field or pass it with `--team`.
5. In Studio, select the connected phone/tablet, click **Auto-Crawl**, choose the installed app, enter the Team ID, and start. Or run the CLI command below.

Xcode uses automatic signing for ADBSnap's temporary UI-test runner and may contact Apple to create or refresh a provisioning profile. A free Personal Team may work for local testing, but account, provisioning, device, or app capability restrictions can prevent it; ADBSnap cannot bypass Apple's signing requirements. The Team ID is an identifier, not a password or signing certificate. Follow actionable Xcode signing or Developer Mode errors.

Alternatively, use the published CLI. You need the app's bundle identifier and the target device ID. The target app must already be installed:

```bash
# Explore an installed app on a booted simulator
npx adbsnap explore-ios --bundle com.example.myapp --device "<simulator ID>" --zip

# Explore an installed app on a paired physical device
npx adbsnap explore-ios --bundle com.example.myapp \
  --device "<iOS device ID>" --team "<10-character Apple Developer Team ID>" --zip
```

**What to expect:** the first run can take several minutes while Xcode builds the UI-test runner. XCTest launches the selected app and may terminate/relaunch it while replaying routes; do not run while the app has unsaved work or during a sensitive operation. It captures the initial screen/tab roots and follows a conservative set of accessible, labelled navigation controls (for example, Details or Settings), up to two navigation levels, 20 screens, and 30 navigation attempts.

**What it does not do:** this is not a full test recorder or general-purpose crawler. It does not fill forms, use arbitrary buttons, follow external links, log in, or understand app-specific workflows. Destructive/transactional labels are skipped, but no automation can guarantee that every app action is safe. Screens/controls must be exposed to XCTest accessibility. The physical-device path is implemented, but has not yet been verified on real hardware; simulator XCTest and mocked physical-device parsing are covered by the project's CI checks.

**Verification status:** Auto Explorer has been run and tested on an iOS Simulator. Physical iPhone/iPad XCTest execution has **not been verified on real hardware**; pairing, signing, provisioning, or device-specific behavior may need troubleshooting on the target Mac/device.

Android's `adbsnap explore`/`crawl` and wireless ADB commands remain Android-only; use `explore-ios` or Studio's iOS Auto-Crawl for iOS. The [iOS Simulator GitHub Actions workflow](.github/workflows/ios-simulator.yml) tests simulator capture and exploration on macOS. Hosted CI does not provide an attached physical iPhone/iPad.

To run the iOS CI checks locally on a Mac with an installed iOS Simulator runtime:

```bash
npm run test:ios:ci
```

This runs the physical-device driver test with mocked `devicectl` output, boots a simulator for the XCUITest Auto Explorer and screenshot/framing verification, and builds the CLI/Studio and VS Code extension. Individual checks are available as `npm run test:ios-driver`, `npm run test:ios:explorer`, and `npm run test:ios:simulator`.

---

## 🛠️ CLI Usage & Commands

```bash
adbsnap [command] [options]
# or
snapshot [command] [options]
```

### 1. `adbsnap snap` (Default)
Captures the active screen, frames it into a 4K showcase graphic, and saves it to `./output/`.

```bash
# Quick capture with default aurora theme and iPhone 16 Pro bezel
adbsnap snap

# Custom title and subtitle
adbsnap snap --title "Track Your Daily Habits" --subtitle "Simple. Fast. Beautiful."

# Use Pixel 9 Pro Fold bezel with WebP compression
adbsnap snap --frame pixel-9-pro-fold --theme midnight --title "Unfold Productivity" --format webp

# 2026 Galaxy S25 Ultra on sunset gradient with ultra-compressed AVIF
adbsnap snap --frame galaxy-s25-ultra --theme sunset --format avif

# Save unedited raw screenshot buffer
adbsnap snap --raw
```

### 2. `adbsnap export`
Batch-generates complete asset packs across Apple App Store and Google Play dimensions in parallel, packaged into a ready-to-upload ZIP file.

```bash
adbsnap export --theme studioLight --title "Workout Companion" --zip --format webp
```

### 3. `adbsnap crawl [package]`
Inspects your running Android app, auto-detects bottom navigation tabs (`BottomNavigationView`, `TabLayout`), and navigates through each tab capturing a complete framed showcase suite.

```bash
adbsnap crawl com.example.myapp --theme midnight
```

### 4. `adbsnap run [config.json]`
Executes an automated multi-step screenshot journey from a JSON configuration file.

```bash
adbsnap run adbsnap.config.json
```

### 5. `adbsnap journey`
Interactive CLI wizard that guides you through a multi-screen capture session with customizable titles for each step.

### 6. `adbsnap doctor`
Diagnoses your local Android development environment:

```bash
adbsnap doctor
```
```
  • Node.js Version : v20.12.0
  • Operating System: win32 (x64)
  • ADB Executable  : C:\Users\user\AppData\Local\Android\Sdk\platform-tools\adb.exe

  [USB] Pixel 8 Pro (1A2B3C4D) -> READY
```

### 7. `adbsnap devices`, `adbsnap wifi` & `adbsnap usb`
List all connected USB, Wi-Fi, and emulator devices, switch to wireless mode, or cleanly revert back to USB:

```bash
# List all attached devices and authorization health
adbsnap devices

# 1-Click switch attached USB device to wireless mode
adbsnap wifi

# Disconnect Wi-Fi mode and revert phone connection back to USB
adbsnap wifi off
# or alias:
adbsnap usb
```

### 8. `adbsnap studio`
Launches the full interactive visual web dashboard on `http://localhost:3000`:
- **`Spacebar` Hotkey:** Pull fresh screens directly from phone to canvas instantly.
- **Wireless IP & Android 11+ Pairing:** Connect and pair wirelessly from the header.
- **Filmstrip Reordering:** Collect multiple screens across user flows, reorder tabs, or import computer images.
- **1-Click Clipboard Export:** Copy mockups directly to clipboard for pasting into Figma, Slack, or Docs.
- **Animated Story Maker:** Compile captured screens into looping animated GIFs.
- **4K Multi-Store ZIP Export:** Download complete App Store & Google Play bundles in one click.

### 9. 💻 VS Code Extension
Use ADBSnap directly inside Visual Studio Code without leaving your editor:
- **Activity Bar Sidebar:** Live connected devices tree with 1-click capture & recent gallery.
- **Shortcuts:** `Ctrl+Alt+S` for instant 4K framed capture, `Ctrl+Alt+C` to copy directly to clipboard.
- **Visual Asset Studio:** Embedded interactive preview tab with dynamic theme swatches and headline editing.
- Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=shriramsingh.adbsnap) or search **"ADBSnap"** in the Extensions tab (`Ctrl+Shift+X`).

---

## ⚙️ Options Reference

| Option | Description | Available Values | Default |
| :--- | :--- | :--- | :--- |
| `--frame` | Device bezel chassis | `iphone-16-pro`, `iphone-16-pro-max`, `pixel-9-pro`, `pixel-9-pro-fold`, `galaxy-s25-ultra`, `ipad-pro-13`, `android-tablet-11`, `frameless`, `minimal` | `iphone-16-pro` |
| `--format`| Output image compression | `png`, `webp`, `avif`, `jpeg` | `png` |
| `--theme` | Canvas gradient preset | `aurora`, `studioLight`, `freshMint`, `sunset`, `midnight`, `royal`, `cleanDark`, `none` | `aurora` |
| `--layout` | Positioning layout | `appstore` (bottom bleed), `social` (floating centered) | `appstore` |
| `--fit` | Screenshot scaling | `cover` (safe aspect), `contain`, `fill` | `cover` |
| `--font` | Typography preset | `modern`, `rounded`, `editorial`, `mono` | `modern` |
| `--title` | Headline text | Any text (supports multi-line with \n) | None |
| `--subtitle`| Supporting subtitle | Any text | None |
| `--footer`  | Footer callout text | Any text (rendered at bottom when text-pos is 'both') | None |
| `--text-pos`| Canvas text positioning | `top`, `bottom`, `both` | `top` |
| `--no-stars`| Hide 5-star rating badge | Flag | Stars enabled |
| `--raw` | Save raw unadorned screenshot | Flag | False |
| `--device` | Target a specific connected device | Android serial / IP / mDNS / iOS simulator or device ID | Auto-detect |
| `--bundle` | Installed iOS app bundle ID for `explore-ios` | Bundle identifier, e.g. `com.example.myapp` | Required for iOS exploration |
| `--team` | Apple Developer Team ID for physical iOS XCTest signing | 10 alphanumeric characters | Required only for physical iOS exploration |
| `--out` | Custom output file or directory | File/directory path | `./output` |
| `--zip` | Create ZIP bundle | Flag | True |

---

## 📋 JSON Automation Spec (`adbsnap.config.json`)

You can define repeatable, automated capture pipelines:

```json
{
  "theme": "aurora",
  "frame": "iphone-16-pro",
  "layout": "appstore",
  "flow": [
    {
      "action": "launch",
      "package": "com.myapp.android"
    },
    {
      "action": "wait",
      "ms": 1000
    },
    {
      "action": "snap",
      "title": "Welcome Home",
      "subtitle": "Everything at a glance"
    },
    {
      "action": "tap",
      "selector": { "text": "Analytics" }
    },
    {
      "action": "snap",
      "title": "Realtime Stats",
      "subtitle": "Deep insights into your performance"
    }
  ]
}
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for personal and commercial use.

Copyright (c) 2026 Shriram Singh.
