# ADBSnap — Step-by-Step Implementation Plan

This plan breaks down the development of **ADBSnap** into sequential, bite-sized micro-steps. Each step delivers a small, functional, and verifiable milestone so we can test as we build, starting with connection to your mobile device.

---

## Current Environment Status
- **OS:** Windows 10 / 11
- **Node.js:** `v24.19.0` (Ready)
- **npm:** `12.0.2` (Ready)
- **ADB:** `v1.0.41` (Android SDK platform-tools — daemon running and operational)

---

## Mandatory Architectural Principles & Code Standards

> [!IMPORTANT]
> To ensure maximum maintainability, zero code repetition, and clean debugging, the following 10 rules are strictly enforced from Step 1.1 onwards:
> 
> 1. **Centralized Constants (`constants/`):** All strings, terminal banners, user hints, gradients, colors, timeouts, ports, and errors live in dedicated files (`strings.ts`, `messages.ts`, `themes.ts`, `config.ts`, `errors.ts`). Zero magic numbers or strings.
> 2. **Maximum Reusability & DRY:** Extract common logic into reusable components and utility functions immediately.
> 3. **Common Styles:** Terminal colors, badges (`USB` 🔌 / `Wi-Fi` 📶), and borders live in `constants/styles.ts`.
> 4. **Centralized Command Registry (`constants/commands.ts`):** All raw shell and ADB commands are defined as named constants/templates in one file.
> 5. **Composite Macro Commands (`lib/commands/composite.ts`):** Frequently paired actions are unified into single macro instructions.
> 6. **Centralized Mock Data (`mocks/`):** All test fixtures and dummy devices reside in `mocks/` for offline verification.
> 7. **Standardized Logger (`utils/logger.ts`):** Zero raw `console.log()` calls; all logs flow through a styled logger.
> 8. **Pluggable Device Driver Architecture (`lib/driver.ts`):** Engine interacts through `DeviceDriver` interface (Android active, iOS pluggable).
> 9. **Zero-Disk In-Memory Processing:** Raw capture buffers remain in RAM during all transformation stages.
> 10. **Phase-by-Phase Verification Audit:** Check at the end of every step that no hardcoded literals or raw commands slipped in.

---

## Phase 1: Foundation & Mobile Device Connection (Days 1–2)

> **Goal:** Connect to your Android phone via USB and Wi-Fi, verify ADB communication, and capture raw screenshots directly into computer memory without touching phone storage.

### Step 1.1: Project Scaffolding, Standards & TypeScript Setup
* Initialize `package.json` in `adbsnap/`.
* Install core development dependencies: `typescript`, `tsx`, `@types/node`, `chalk`.
* Create `tsconfig.json` with strict type checking and NodeNext resolution.
* Scaffold foundational architecture folders and files:
  * `constants/commands.ts`: Initial ADB shell command templates.
  * `constants/strings.ts` & `constants/messages.ts`: App name, banners, user prompts.
  * `constants/config.ts`: Defaults (port 5555, timeout 3000ms, default output dir).
  * `constants/errors.ts`: Error codes with troubleshooting guidance.
  * `utils/logger.ts`: Centralized styled terminal logger.
* **Verification:** Run `npx tsx scripts/sanity-check.ts` that uses the logger and constants to print a validated startup banner.

### Step 1.2: Pluggable Device Driver & Android ADB Module (`lib/driver.ts` & `lib/adb.ts`)
* Define abstract `DeviceDriver` interface in `lib/driver.ts` (so iOS support can be plugged in later with zero changes to compositing or UI logic):
  ```ts
  interface ConnectedDevice {
    id: string;          // e.g. "RFCW..." (USB) or "192.168.1.50:5555" (Wi-Fi)
    platform: 'android' | 'ios';
    type: 'usb' | 'wifi' | 'emulator';
    model: string;       // e.g. "Pixel_9_Pro", "Galaxy_S24"
    product: string;
    isAuthorized: boolean;
  }

  interface DeviceDriver {
    listDevices(): Promise<ConnectedDevice[]>;
    captureScreenshot(deviceId?: string): Promise<Buffer>;
    enableWireless?(deviceId: string): Promise<string>;
    resetAppData?(packageName: string): Promise<void>;
    launchApp?(packageName: string): Promise<void>;
    killApp?(packageName: string): Promise<void>;
  }
  ```
* Implement `AndroidDriver` in `lib/adb.ts` using `child_process.spawn('adb', ['devices', '-l'])`.
* Parse raw ADB text output into structured `ConnectedDevice` objects.
* Handle device authorization errors gracefully (when the phone screen prompts *"Allow USB debugging"*).
* **Verification:** Run `npx tsx scripts/test-devices.ts` to see your plugged-in phone listed with its model and connection type.

### Step 1.3: Zero-Disk In-Memory Screenshot Capture (`lib/adb.ts`)
* Implement `captureScreenshot(deviceId?: string): Promise<Buffer>` using `adb exec-out screencap -p`.
* Stream the raw PNG binary output directly into a Node.js `Buffer` in RAM (zero temporary files written to the phone or PC disk).
* Measure capture latency (target: sub-250ms).
* **Verification:** Run `npx tsx scripts/test-capture.ts` $\rightarrow$ captures active phone screen and saves a sample `test-screenshot.png` locally in under 300ms.

### Step 1.4: 1-Click Wireless / OTA Mode Switch (`lib/adb.ts`)
* Implement `enableWirelessMode(deviceId: string): Promise<string>`:
  1. Executes `adb -s <id> tcpip 5555`.
  2. Queries the phone's internal Wi-Fi IP address via `adb -s <id> shell ip -f inet addr show wlan0`.
  3. Executes `adb connect <ip>:5555`.
* Implement manual IP connect: `connectWifi(ip: string, port = 5555)`.
* Implement Android 11+ pairing: `pairWifi(ip: string, port: number, code: string)`.
* **Verification:** Plug in phone via USB, run `npx tsx scripts/test-wifi.ts`, unplug the USB cable, and run `test-capture.ts` wirelessly over Wi-Fi!

### Step 1.5: App Lifecycle Controls & Auto-Detection (`lib/adb.ts`)
* Implement `getForegroundApp(deviceId?: string): Promise<string>`: queries active window via `adb shell dumpsys window` to automatically identify the app on screen.
* Implement `resetAppData(packageName: string)`: runs `adb shell pm clear <package>` to wipe session data and return app to fresh logged-out state in <100ms.
* Implement `launchApp(packageName: string)`: launches app via `adb shell monkey -p <package> -c android.intent.category.LAUNCHER 1`.
* Implement `killApp(packageName: string)`: terminates app process via `adb shell am force-stop <package>`.
* **Verification:** Run `npx tsx scripts/test-lifecycle.ts` $\rightarrow$ auto-detects currently open app, resets it, and launches it cleanly.

---

## Phase 2: Sharp Compositing Engine (Bezels, Gradients & Typography)

> **Goal:** Take the raw screenshot buffer and wrap it inside a clean device frame on a 4K gradient canvas with marketing text.

### Step 2.1: Bezel Library Setup
* Create `assets/bezels/` containing vector SVG / high-resolution PNG transparent device bezels:
  * Modern Minimalist Bezel (Default universal)
  * iPhone 16 Pro Max
  * Google Pixel 9 Pro
* Define bezel metadata in `lib/presets.ts` (screen coordinate boundaries, corner radii, aspect ratios).
* **Verification:** Verify bezel image dimensions and anchor coordinates via unit test.

### Step 2.2: Sharp Compositing Pipeline (`lib/sharp.ts`)
* Install `sharp` (C++ `libvips` bindings for Node.js).
* Build compositing function `compositeFrame(...)`:
  1. Generate 4K background (solid color or CSS-style linear/radial gradient).
  2. Resize and round the device screenshot to match bezel screen cutout.
  3. Overlay device bezel with realistic drop shadow.
  4. Composite all layers together into a single PNG buffer at native C++ speed (<400ms).
* **Verification:** Run `npx tsx scripts/test-composite.ts` to output a fully framed 4K image.

### Step 2.3: Marketing Typography & Badges
* Implement text rendering using SVG overlay compositing:
  * Marketing title (e.g. *"Track Workouts Instantly"*).
  * Optional subtitle.
  * Star rating badge chip (⭐⭐⭐⭐⭐ *"5.0 on App Store"*).
* **Verification:** Run `test-composite.ts` with `--title` and check text sharpness and alignment on the 4K canvas.

---

## Phase 3: Minimum Working Model (CLI Core MVP)

> **Goal:** Package everything from Phases 1 & 2 into a single, polished command-line tool you can use daily from your terminal.

### Step 3.1: CLI Binary Scaffolding (`bin/cli.ts`)
* Install `commander` and `chalk`.
* Implement commands:
  * `adbsnap devices`: List connected USB and Wi-Fi devices.
  * `adbsnap wifi`: 1-click switch USB to Wi-Fi mode.
  * `adbsnap snap`: Capture active phone screen and composite in one step.
* Configure `package.json` `"bin": { "adbsnap": "./bin/cli.js" }`.
* **Verification:** Run `npx tsx bin/cli.ts devices` and verify formatted terminal output.

### Step 3.2: End-to-End Single-Command Capture
* Implement options for `adbsnap snap`:
  * `--frame <model>` (iphone-16-pro, pixel-9-pro, minimal)
  * `--title "<headline>"`
  * `--bg "<gradient-or-hex>"`
  * `--out <filepath>`
* **Verification:** Run `adbsnap snap --title "Production Ready" --out ./hero.png` $\rightarrow$ inspect resulting 4K promotional screenshot.
* 🎉 **Milestone 1 (Minimum Working Model) is Complete!**

---

## Phase 4: Batch Exporter & Multi-Store Packaging

> **Goal:** Generate full App Store and Google Play Store submission packages with a single command.

### Step 4.1: Store Preset Standards (`lib/presets.ts`)
* Implement exact pixel standards:
  * Apple 6.9" Display: `1320 x 2868 px`
  * Apple 6.7" Display: `1290 x 2796 px`
  * Apple 6.5" Display: `1242 x 2688 px`
  * Google Play Phone: `1080 x 1920 px` & `1440 x 2560 px`
  * Web Showcase: WebP responsive scales
* **Verification:** Unit test verifying output aspect ratios.

### Step 4.2: Declarative Project Config with Auth Injection (`adbsnap.config.json`)
* Allow users to define demo account credentials, automated login actions, screens, and titles:
  ```json
  {
    "app": "FitPulse",
    "package": "com.fitpulse.app",
    "auth": {
      "username": "tester@fitpulse.com",
      "password": "SecretPassword123"
    },
    "theme": { "bg": "linear-gradient(135deg, #4f46e5, #06b6d4)", "frame": "iphone-16-pro" },
    "flow": [
      { "action": "snap", "name": "01-welcome", "title": "Welcome to FitPulse" },
      { "action": "type", "field": "email", "value": "$auth.username" },
      { "action": "type", "field": "password", "value": "$auth.password" },
      { "action": "tap", "target": "Sign In", "waitMs": 1500 },
      { "action": "snap", "name": "02-dashboard", "title": "Track Every Rep & Set" },
      { "action": "tap", "target": "Analytics", "waitMs": 800 },
      { "action": "snap", "name": "03-analytics", "title": "Visualize Your Progress" }
    ],
    "targets": ["app-store-6.7", "play-store-phone"]
  }
  ```
* **Verification:** Run `adbsnap export` to execute the login flow and generate all screens across store sizes.

### Step 4.3: UI Hierarchy Inspection & Form Auto-Filling (`lib/crawler.ts`)
* Implement `dumpUiHierarchy(deviceId?: string)` using `adb exec-out uiautomator dump /dev/tty`.
* Parse XML nodes to automatically locate coordinates for input fields matching hints/labels ("Email", "Password") and buttons ("Sign In", "Log In").
* Implement `typeText(targetIdOrHint: string, text: string)` and `tapElement(targetTextOrId: string)`.
* **Verification:** Run `npx tsx scripts/test-autologin.ts` $\rightarrow$ automatically finds email/password on phone screen, fills them, and logs in.

### Step 4.4: In-Memory Zip Streaming (`lib/zip.ts`)
* Install `archiver`.
* Package generated images into organized folders inside a `.zip` archive without disk bloat.
* **Verification:** Run batch export and extract `.zip` to verify folder hierarchy.

---

## Phase 5: Next.js Visual Studio (`adbsnap studio`)

> **Goal:** Launch a local web dashboard for interactive visual tweaking and real-time live preview.

### Step 5.1: Next.js 15 App Router Scaffolding
* Initialize `app/` directory with Tailwind CSS.
* Implement API routes reusing the existing `lib/` modules:
  * `GET /api/devices`
  * `POST /api/devices/[id]/capture`
  * `POST /api/devices/switch-wireless`
  * `POST /api/export/batch`
* **Verification:** Test API endpoints via curl / browser.

### Step 5.2: Server-Sent Events (SSE) Live Connection Stream
* Implement `GET /api/events` using native Next.js `ReadableStream`.
* Push device plug/unplug events to browser in real-time.
* **Verification:** Observe UI automatically updating when phone is plugged or unplugged.

### Step 5.3: React-Konva Interactive Studio Canvas
* Dynamically import Konva Stage (`ssr: false`).
* Support drag-and-drop phone placement, scale, 3D tilt, and live gradient picker.
* 1-Click "Capture" button that drops the live screenshot directly into the canvas bezel.
* **Verification:** Drag, scale, and customize a mockup visually in browser.

### Step 5.4: 1-Click Multi-Store Zip Download
* "Export All Stores" button triggers backend Sharp pipeline and downloads the `.zip` archive.
* **Verification:** Download and inspect generated multi-store package.

---

## Summary of Phases & Checkpoints

| Phase | Milestone Name | Key Outcome | Est. Time |
| :---: | :--- | :--- | :---: |
| **Phase 1** | **Mobile Connection & Streaming** | Verify ADB, USB & Wi-Fi detection, zero-disk RAM screencap | **1–2 Days** |
| **Phase 2** | **Sharp Compositing Pipeline** | Bezel overlays, 4K gradients, typography at C++ speed | **1–2 Days** |
| **Phase 3** | **Minimum Working Model (CLI MVP)** | `adbsnap snap` single-command capture & 4K PNG generation | **1 Day** |
| **Phase 4** | **Batch Exporter & Presets** | `adbsnap export` + multi-store zip packaging | **1–2 Days** |
| **Phase 5** | **Next.js Visual Studio GUI** | `adbsnap studio` web canvas with SSE live status | **2–3 Days** |
