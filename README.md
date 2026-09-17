# ADBSnap 📸

> **Automated Mobile Screenshot Capture, 4K Vector Device Framing & App Store / Google Play Asset Studio**

[![npm version](https://img.shields.io/npm/v/adbsnap.svg?style=flat-square)](https://www.npmjs.com/package/adbsnap)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg?style=flat-square)](https://github.com/shriramsingh/adbsnap)

Stop wrestling with manual Figma templates or low-res screenshot scripts. **ADBSnap** captures your live Android device or emulator directly into memory, wraps it into vector-sharp device bezels (iPhone 16 Pro, Pixel 9 Pro), lays down studio-grade gradient backdrops with auto-wrapped typography, and exports ready-to-upload store graphics in **under a second**.

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
- 📱 **4K Vector Bezels:** Pixel-crisp iPhone 16 Pro (with Dynamic Island), Pixel 9 Pro, Tablets, and Frameless modes.
- 🎨 **Curated Studio Backdrops:** 8 presets (`aurora`, `studioLight`, `sunset`, `midnight`, `freshMint`, `royal`, `cleanDark`, `none`) or custom styles.
- ✍️ **Smart Typography:** Dynamic SVG headline and subtitle rendering with automatic text-wrapping and star rating badges.
- 📦 **Multi-Store Asset Export:** Generate all required App Store and Google Play sizes bundled into a single ZIP in one keystroke.
- 🤖 **Hands-Free Tab Crawler:** Automatically detect and crawl through bottom navigation tabs, capturing and framing each view hands-free.
- 🩺 **Built-in Doctor:** Diagnose ADB paths, device health, and USB authorization in seconds.
- 🖥️ **Dual CLI Binary:** Run as `adbsnap` or `snapshot`.

---

## 📦 Quick Start

### Launch Interactive Web Studio (Recommended)
```bash
npx adbsnap studio
```
Opens the visual studio dashboard in your default browser at `http://localhost:3000`.

### Run Instantly via `npx` (Headless Snap)
```bash
npx adbsnap snap
```

### Or Install Globally
```bash
npm install -g adbsnap
```

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

# Use Pixel 9 Pro bezel on sunset gradient
adbsnap snap --frame pixel-9-pro --theme sunset --title "Explore Destinations"

# Save unedited raw screenshot buffer
adbsnap snap --raw
```

### 2. `adbsnap export`
Batch-generates complete asset packs across Apple App Store and Google Play dimensions, packaged into a ready-to-upload ZIP file.

```bash
adbsnap export --theme studioLight --title "Workout Companion" --zip
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
| `--frame` | Device bezel chassis | `iphone-16-pro`, `pixel-9-pro`, `ipad-pro-13`, `android-tablet-11`, `frameless`, `minimal` | `iphone-16-pro` |
| `--theme` | Canvas gradient preset | `aurora`, `studioLight`, `freshMint`, `sunset`, `midnight`, `royal`, `cleanDark`, `none` | `aurora` |
| `--layout` | Positioning layout | `appstore` (bottom bleed), `social` (floating centered) | `appstore` |
| `--fit` | Screenshot scaling | `cover` (safe aspect), `contain`, `fill` | `cover` |
| `--font` | Typography preset | `modern`, `rounded`, `editorial`, `mono` | `modern` |
| `--title` | Headline text | Any text (auto-wraps on long headlines) | None |
| `--subtitle`| Supporting subtitle | Any text | None |
| `--no-stars`| Hide 5-star rating badge | Flag | Stars enabled |
| `--raw` | Save raw unadorned screenshot | Flag | False |
| `--device` | Target specific ADB device ID | Device serial / IP / mDNS | Auto-detect |
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
