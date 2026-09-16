# ADBSnap — Software Requirements Specification (SRS) & Technical Blueprint
**Product:** ADBSnap (Automated Mobile Showcase & App Store Asset Studio)  
**Architecture:** Decoupled Core (Node.js + Sharp + Native ADB) with Dual Interfaces: Fast Developer CLI (`adbsnap`) + Next.js Web Studio (`adbsnap studio`)  
**Target Form Factor:** CLI-First Developer Tool / Web-Connected Studio Utility  
**Version:** 1.2.0 (CLI-First Phased Architecture Update)  
**Status:** Approved for Development  

---

## 1. Executive Summary & Vision

### 1.1 The Problem
Creating production-ready promotional screenshots for the Apple App Store, Google Play Store, and developer portfolios is one of the most tedious, repetitive bottlenecks in the mobile release lifecycle:
1. **Manual Navigation & Capture:** Developers repeatedly click through 15–20 screens on emulators or physical devices, capturing screenshots one-by-one via manual hotkeys.
2. **Tooling Fragmentation & Fragility:** Industry tools like Fastlane Snapshot/Frameit require heavy Ruby dependencies, fragile UI test runners, and cryptic configuration files that break across OS updates.
3. **Manual Graphic Design Overhead:** Formatting raw screenshots into high-resolution device bezels (iPhone 16 Pro, Pixel 9 Pro), adjusting 3D perspective angles, applying gradient backdrops, and aligning marketing typography in tools like Figma or Photoshop takes hours for every release.
4. **Multi-Resolution Multi-Store Pain:** Apple and Google enforce strict, disparate resolution requirements (6.9", 6.7", 6.5", iPad 12.9", Play Store Phone, Play Store 10" Tablet). Manually resizing and re-framing across all permutations is error-prone.

### 1.2 The Solution
**ADBSnap** is an ultra-lightweight, automated mobile showcase and App Store asset creation studio. It bridges directly to connected Android devices/emulators via ADB, captures pristine in-memory screenshots with zero disk lag, wraps them in pixel-perfect 2D/3D device frames, renders localized marketing copy and gradients, and exports complete store-ready asset packages in seconds.

### 1.3 The Empty Screen Problem & Data Population Strategy
Promotional screenshots with blank fields or placeholder zero-states ("No workouts found", empty charts, missing avatars) convert poorly. To showcase production-ready visuals, apps require authenticated sessions with rich seed data. 
ADBSnap addresses this through a progressive **3-Level Automation Model**:
* **Level 1 (Session Snapshot Assist — Phase 1):** Developer logs into a rich test account once; ADBSnap captures all populated inner screens, using `pm clear` only to capture the pristine logged-out onboarding screen.
* **Level 2 (Scripted Auto-Pilot — Phase 3/4):** User supplies 1 pre-seeded test credential in `adbsnap.config.json`; ADBSnap automatically injects credentials, taps submit, waits for network spinners, and captures screens headlessly.
* **Level 3 (Autonomous UI Crawler — Future Upgrade):** Uses `uiautomator` accessibility hierarchy dumps to auto-detect input fields, inject credentials, and crawl bottom navigation tabs without manual coordinates.

---

## 2. User Personas & Primary Workflows

### 2.1 User Personas
* **Indie Mobile Maker / Solo Developer:** Needs high-converting App Store & Play Store screenshots in 5 minutes without opening Figma or writing Fastlane scripts.
* **Mobile Engineering Team / Agency:** Needs to automate screenshot generation across 10+ client apps whenever brand guidelines or UI flows change.
* **Developer Portfolio Builder:** Needs to transform real app flows into clean, responsive WebP carousels and showcase cards for web portfolios.

### 2.2 Dual User Workflows (CLI & Visual Studio)

#### 2.2.1 Fast-Path Developer CLI Workflow (Minimum Working Model)
```
[Terminal] $ adbsnap snap --frame iphone-16-pro --title "Welcome Screen"
                      │
                      ▼
[In-Memory ADB Screencap Buffer from USB or Wi-Fi Device (<200ms)]
                      │
                      ▼
[Sharp C++ Engine Composites Frame + Gradient + Title into 4K Asset]
                      │
                      ▼
[Production-Ready PNG Saved to ./output in <1 Second]
```

#### 2.2.2 Interactive Visual Studio Workflow (`adbsnap studio`)
```
[Plug Android Device via USB / Connect via Wi-Fi OTA / Start Emulator]
                      │
                      ▼
[ADBSnap Auto-Detects Device via ADB Bridge (USB / Wi-Fi)]
                      │
                      ▼
[1-Click "Capture Screen" OR "Run Automated Journey"]
                      │
                      ▼
[Screenshots Stream Directly into React Canvas Studio]
                      │
                      ▼
[Customize: Pick Bezel (iPhone/Pixel), Tilt Angle, Gradient, Title & Subtitle]
                      │
                      ▼
[Select Target Stores: App Store (6.9", 6.7", 6.5") + Google Play + WebP]
                      │
                      ▼
[1-Click "Export All": Sharp C++ Engine Generates 4K Assets in Zip]
```

---

## 3. Functional Requirements (FR)

### FR-0: Developer Command-Line Interface (CLI Engine)
* **FR-0.1 Device Discovery Command:** `adbsnap devices` lists all connected devices with connection type (`usb` 🔌 vs `wifi` 📶), model name, and resolution.
* **FR-0.2 Instant Capture Command:** `adbsnap snap` captures screenshot from active device and applies bezel frame, gradient, and optional headline in a single command (`--frame`, `--bg`, `--title`, `--out`).
* **FR-0.3 Wireless Switch Command:** `adbsnap wifi` toggles connected USB device to wireless mode on port 5555 and automatically connects.
* **FR-0.4 Declarative Batch Export Command:** `adbsnap export --config adbsnap.config.json` processes all defined journeys and multi-store resolutions headlessly (ideal for CI/CD).
* **FR-0.5 Studio Launcher Command:** `adbsnap studio` boots up the local Next.js Visual Studio dashboard on `http://localhost:3000`.

### FR-1: ADB Device Discovery, Stream Capture & Wireless / OTA Bridge
* **FR-1.1 Device Enumeration:** Detect all connected physical Android devices and running emulators via `adb devices -l` (supporting both USB & Wi-Fi IP endpoints).
* **FR-1.2 Real-Time Device Health & Connection Type:** Display device status (Device ID, Model Name, Android Version, Screen Resolution, Density DPI) with connection badge (`USB` 🔌 vs. `Wi-Fi` 📶).
* **FR-1.3 In-Memory Screenshot Streaming:** Use `adb exec-out screencap -p` to stream raw PNG binary buffers directly into Node.js memory. No temporary files written to the phone or host disk, achieving sub-200ms (USB) and sub-350ms (Wi-Fi) capture latency.
* **FR-1.4 Multi-Screen Flow Capture:** Allow manual single-tap capture or automated sequenced captures as the user navigates their app.
* **FR-1.5 Wireless & OTA ADB Bridge:**
  * **1-Click USB-to-Wireless Mode:** Automatically configure connected USB devices for wireless operation via `adb tcpip 5555`, query internal IP via `adb shell ip -f inet addr show wlan0`, and connect via `adb connect <ip>:5555` so users can disconnect cables immediately.
  * **Manual Wi-Fi Connect Dialog:** Simple IP & Port input form (e.g. `192.168.1.50:5555`) to connect directly to any wireless-ready Android device on the local network.
  * **Android 11+ Wireless Pairing Flow:** Dialog supporting native 6-digit pairing code and pairing port (`adb pair <ip>:<pair_port> <code>`) followed by auto-connection (`adb connect <ip>:<connect_port>`).
  * **mDNS Network Auto-Discovery:** Query and list discoverable wireless ADB instances on local subnet (`adb mdns services`).
* **FR-1.6 App Lifecycle Automation & Reset:**
  * **Instant App Data Reset (Logout):** Execute `adb shell pm clear <package>` in <100ms to wipe auth tokens, SQLite/Room DBs, and cache, reliably resetting the app to a pristine logged-out Welcome/Onboarding state.
  * **Process Termination:** Execute `adb shell am force-stop <package>` to kill running processes cleanly.
  * **Clean Launch:** Execute `adb shell monkey -p <package> -c android.intent.category.LAUNCHER 1` or `am start` to launch from cold start.
  * **Deep Link Navigation:** Execute `adb shell am start -a android.intent.action.VIEW -d "<uri>"` to navigate directly to targeted internal app screens.
  * **Active App Auto-Detection:** Query `adb shell dumpsys window` to detect foreground application package when user has already opened their app.
* **FR-1.7 Screen Navigation & Flow Modes:**
  * **Interactive Guided Journey (`adbsnap journey`):** Terminal prompts developer to navigate their phone naturally to each screen and press `[SPACE]` to capture and tag titles.
  * **Automated Scripted Journey:** Replay automated touch interactions (`input tap <x> <y>`, `input swipe`, `input text`) declared in `adbsnap.config.json`.

### FR-2: Canvas Design Studio & Device Mockup Engine
* **FR-2.1 Interactive 2D/3D Canvas:** Built with `react-konva`, supporting real-time drag-and-drop, scaling, device rotation, and layer ordering.
* **FR-2.2 Vector Device Bezel Library:**
  * Apple Ecosystem: iPhone 16 Pro Max, iPhone 16, iPhone 15 Pro, iPad Pro 12.9"
  * Android Ecosystem: Google Pixel 9 Pro, Google Pixel 8, Samsung Galaxy S25 Ultra, Modern Generic Minimalist Bezel.
* **FR-2.3 Device Styling Options:**
  * Color finishes: Titanium, Space Black, Natural, Frost White.
  * Drop shadows: Configurable blur radius, offset (X, Y), color, and opacity.
  * Framing styles: Full device, Bottom bleed (phone cut off at bottom), Top-notch hero, 3D isometric tilt (-15° to +15°).

### FR-3: Marketing Typography, Backdrops & Overlays
* **FR-3.1 Background Engine:**
  * Solid colors & modern preset palettes.
  * Multi-stop Linear and Radial gradients (direction angle control).
  * Mesh / Aurora gradients with customizable color blurs.
  * Blurred in-app screenshot background with dark/light overlay.
* **FR-3.2 Typography Engine:**
  * Punchy marketing headline + explanatory subtitle.
  * Font family selector (Inter, Montserrat, SF Pro, Poppins, Roboto).
  * Text positioning (Top, Bottom, Split, Floating badge).
  * Text effects: Drop shadows, badges, pill-capsules, star ratings (5-star review chips).

### FR-4: Multi-Store Presets & Resolution Targets
* **FR-4.1 Apple App Store Targets:**
  * 6.9" Display (iPhone 16 Pro Max): `1320 x 2868 px`
  * 6.7" Display (iPhone 15 Pro Max / 14 Pro Max): `1290 x 2796 px`
  * 6.5" Display (iPhone 11 Pro Max / XS Max): `1242 x 2688 px`
  * 5.5" Display (iPhone 8 Plus): `1242 x 2208 px`
  * 12.9" iPad Pro: `2048 x 2732 px`
* **FR-4.2 Google Play Store Targets:**
  * Phone: `1080 x 1920 px` or `1440 x 2560 px` (16:9 / 18:9 compliant)
  * 7-inch Tablet: `1200 x 1920 px`
  * 10-inch Tablet: `1600 x 2560 px`
* **FR-4.3 Web & Portfolio Showcase Targets:**
  * High-performance WebP exports (`800 x 1600 px` & responsive scales).
  * Transparent PNG cutouts with 3D device shadows for direct website integration.

### FR-5: High-Speed Batch Export Pipeline
* **FR-5.1 C++ Native Acceleration:** Powered by Node.js **`sharp`** (`libvips`), compositing device bezels, canvas layers, and text at native C++ speed.
* **FR-5.2 Batch Processing:** Export 5–10 framed screenshots across all store sizes simultaneously in under 2 seconds.
* **FR-5.3 Storage Architecture & Structured Export:**
  * **In-Memory Buffer Pipeline:** Screenshots remain in RAM as raw buffers during all Sharp compositing stages, creating zero temporary junk files on phone storage or host disk.
  * **Single Snapshot Output:** Saved by default to `./output/snap-[timestamp].png` or custom path via `--out <path>`.
  * **Batch Release Hierarchy:** Exported into structured release directories:
    ```
    adbsnap/output/adbsnap-release-[date]/
    ├── raw/                     # Pristine unframed device screenshot backups
    │   ├── 01-welcome.png
    │   └── 02-features.png
    ├── app-store-6.7/           # Ready for Apple App Store Connect (1290x2796)
    │   ├── 01-welcome.png
    │   └── 02-features.png
    ├── play-store-phone/        # Ready for Google Play Console (1080x1920)
    │   ├── 01-welcome.png
    │   └── 02-features.png
    └── release-package.zip      # Complete packaged archive for instant distribution
    ```

### FR-6: Persistence & Brand Kit Management
* **FR-6.1 Templates:** Save canvas designs (fonts, colors, device angles, text layouts) as reusable templates.
* **FR-6.2 Brand Kits:** Store recurring brand assets (brand HEX codes, custom logos, preferred typography).
* **FR-6.3 Project History:** Keep historical export sessions and raw captures accessible in MongoDB.

### FR-7: Authentication, Form-Filling & Autonomous Screen Crawling
* **FR-7.1 Test Credential Injection:** Support secure credential mapping (`$auth.username`, `$auth.password`) in `adbsnap.config.json` for hands-free login flows.
* **FR-7.2 UI Hierarchy Inspection:** Extract screen node hierarchy via `adb exec-out uiautomator dump /dev/tty` to locate input elements (`EditText`, `Button`, `BottomNavigationView`) by `resource-id`, `hint`, or `text`.
* **FR-7.3 Automated Form-Filling:** Automatically calculate element center bounds, tap target, and type text via `adb shell input text` with sanitized character escaping.
* **FR-7.4 Tab Bar Auto-Crawling:** Detect bottom tab items, sequentially tap each tab, await transition animations, and capture each screen without requiring manual interaction.
* **FR-7.5 Network & Spinner Synchronization:** Configurable smart wait delays (`waitMs` or DOM-stable polling) to ensure data-heavy graphs and network payloads finish loading before capturing.

---

## 4. Mandatory Architectural Principles & Code Standards

> [!IMPORTANT]
> From the very first line of code and through every development phase, the codebase must strictly adhere to these 10 principles. An architectural audit must be performed at the end of each micro-step to ensure full compliance:
>
> 1. **Centralized Constants (`constants/`):**
>    * Strings (`constants/strings.ts`): App names, descriptions, labels.
>    * Messages (`constants/messages.ts`): Terminal banners, progress logs, user hints.
>    * Colors & Themes (`constants/themes.ts`): Gradients, bezels, canvas palettes.
>    * Configs & Defaults (`constants/config.ts`): Timeouts, default ports (`5555`), paths (`./output`). No magic numbers in business logic.
>    * Errors (`constants/errors.ts`): Standardized error codes with actionable troubleshooting advice.
> 2. **Maximum Reusability & DRY (Don't Repeat Yourself):**
>    * All reusable logic must be extracted into dedicated helper functions or custom components (`utils/`, `components/`). Avoid duplicate code at all costs.
> 3. **Common Styles & Design Tokens:**
>    * Shared terminal chalk styles, borders, status badges (`USB` 🔌 vs. `Wi-Fi` 📶), and web UI tokens must be defined once in `constants/styles.ts`.
> 4. **Centralized Command Registry (`constants/commands.ts`):**
>    * All raw shell commands (especially long ADB strings like `dumpsys window`, `exec-out screencap -p`, `am broadcast`, `pm clear`) must be defined as named constants/templates in a single file. Never hardcode raw command strings inside feature files.
> 5. **Composite / Macro Commands (`lib/commands/composite.ts`):**
>    * Frequently chained operations (e.g. `Restart = force-stop + clear + launch`) must be combined into reusable macro functions to eliminate boilerplate.
> 6. **Centralized Mock & Seed Data (`mocks/`):**
>    * All test fixtures, mock device lists (`mocks/mock-devices.ts`), dummy configurations, and test image buffers must reside in `mocks/`. Never write ad-hoc mock objects inline in test scripts.
> 7. **Standardized Logger (`utils/logger.ts`):**
>    * Zero raw `console.log()` calls in business logic. All logging must route through a unified logger providing consistent prefixes, colors, and error handling.
> 8. **Pluggable Device Driver Architecture (`lib/driver.ts`):**
>    * The core engine interacts with devices solely through an abstract `DeviceDriver` interface (`listDevices`, `captureScreenshot`, `launchApp`, `resetAppData`). Android (ADB) is the primary driver; iOS (`xcrun simctl` / `idb`) can be plugged in later with zero changes to compositing or UI layers.
> 9. **Zero-Disk In-Memory Processing:**
>    * All image buffers during capture, transformation, and packaging must live in RAM (`Buffer`) to ensure sub-250ms speed and prevent temp file clutter.
> 10. **Phase-by-Phase Verification Audit:**
>     * At the completion of every single micro-step, verify:
>       - [ ] No raw shell commands hardcoded outside `commands.ts`
>       - [ ] No literal strings hardcoded outside `messages.ts` / `strings.ts`
>       - [ ] No inline mock data outside `mocks/`
>       - [ ] Reusable logic cleanly decoupled into `utils/` or `lib/`

---

## 5. Non-Functional Requirements (NFR)

* **NFR-1 Latency & Speed:** Screenshot capture from connected device must complete in `< 250ms`. Canvas style updates must render in `< 16ms` (60fps). Batch export of 5 frames in 4K must complete in `< 2.5s`.
* **NFR-2 Memory & Resource Footprint:** Backend Node.js process idle memory `< 70MB`, peak export memory `< 200MB`.
* **NFR-3 Privacy & Local-First:** All ADB operations and screenshot captures run strictly locally. No user application data or proprietary screenshots are transmitted to external cloud servers.
* **NFR-4 Reliability:** Automatic recovery and reconnection if the USB cable is unplugged and replugged. Graceful handling when no Android device is found.

---

## 6. Technical Architecture (Decoupled Core with Dual Interfaces)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DUAL INTERFACE PRESENTATION LAYER                    │
│                                                                         │
│  ┌────────────────────────────────────┐  ┌───────────────────────────┐  │
│  │ INTERFACE A: DEVELOPER CLI RUNNER  │  │ INTERFACE B: WEB STUDIO   │  │
│  │ (Milestone 1 & CI/CD Automation)   │  │ (Milestone 3 Visual GUI)  │  │
│  │                                    │  │                           │  │
│  │  $ adbsnap snap                    │  │  Next.js 15 App Router    │  │
│  │  $ adbsnap devices                 │  │  React 19 + Tailwind CSS  │  │
│  │  $ adbsnap wifi                    │  │  React-Konva 2D/3D Canvas │  │
│  │  $ adbsnap export                  │  │  Server-Sent Events (SSE) │  │
│  │  (Commander.js / Clack prompts)    │  │  Zustand Studio Stores    │  │
│  └─────────────────┬──────────────────┘  └─────────────┬─────────────┘  │
└────────────────────┼───────────────────────────────────┼────────────────┘
                     │                                   │
                     ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                DECOUPLED CORE ENGINE (PURE TYPESCRIPT/NODE)             │
│                                                                         │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐  │
│  │   PLUGGABLE DEVICE DRIVERS    │   │      lib/sharp.ts             │  │
│  │  ┌─────────────────────────┐  │   │  • Layer compositing (libvips)│  │
│  │  │ [ACTIVE] Android (ADB)  │  │   │  • 4K Store resizing          │  │
│  │  │ • spawn('adb devices')  │  │   │  • Gradient & typography merge│  │
│  │  │ • USB & Wi-Fi bridge    │  │   │  • Transparent device shadows │  │
│  │  │ • exec-out screencap    │  │   └───────────────────────────────┘  │
│  │  └─────────────────────────┘  │   ┌───────────────────────────────┐  │
│  │  ┌─────────────────────────┐  │   │      lib/presets.ts           │  │
│  │  │ [PLUGGABLE] iOS Driver  │  │   │  • Apple App Store targets    │  │
│  │  │ • xcrun simctl / idb    │  │   │  • Google Play Store targets  │  │
│  │  │ • (Zero-effort future)  │  │   │  • Bezel vector specs         │  │
│  │  └─────────────────────────┘  │   └───────────────────────────────┘  │
│  │  Interface: DeviceDriver      │   ┌───────────────────────────────┐  │
│  │  (list, snap, launch, reset)  │   │      lib/zip.ts               │  │
│  └───────────────────────────────┘   └───────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│              CONFIG & PERSISTENCE (DECLARATIVE & LOCAL-FIRST)           │
│                                                                         │
│  • CLI: `adbsnap.config.json` (Headless project journeys, zero-db mode) │
│  • Studio: MongoDB Atlas / Local (Templates, brand kits, export history)│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. MongoDB Data Models & Schemas

### 6.1 `Template` Schema
```typescript
interface ITemplate {
  name: string;
  category: 'minimal' | 'bold' | '3d-tilt' | 'bottom-bleed' | 'split-hero';
  canvasWidth: number;   // e.g. 1290
  canvasHeight: number;  // e.g. 2796
  background: {
    type: 'solid' | 'linear' | 'radial' | 'mesh' | 'blur-screen';
    colors: string[];    // ['#4f46e5', '#06b6d4']
    angle?: number;      // Gradient direction in degrees
  };
  deviceFrame: {
    model: 'iphone-16-pro' | 'pixel-9-pro' | 'galaxy-s25' | 'ipad-pro';
    finish: string;      // 'titanium-natural', 'space-black'
    scale: number;       // 0.85
    position: { x: number; y: number };
    rotation: number;    // degrees for tilt
    shadow: {
      blur: number;
      opacity: number;
      offsetX: number;
      offsetY: number;
      color: string;
    };
  };
  typography: {
    title: {
      text: string;
      fontFamily: string;
      fontSize: number;
      fontWeight: string;
      color: string;
      position: { x: number; y: number };
    };
    subtitle?: {
      text: string;
      fontFamily: string;
      fontSize: number;
      color: string;
      position: { x: number; y: number };
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.2 `BrandKit` Schema
```typescript
interface IBrandKit {
  name: string;
  appTitle: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string;
  createdAt: Date;
}
```

### 6.3 `ExportJob` Schema
```typescript
interface IExportJob {
  projectId: string;
  targets: Array<'app-store-6.7' | 'app-store-6.9' | 'play-store-phone' | 'portfolio-webp'>;
  frameCount: number;
  format: 'png' | 'webp';
  executionTimeMs: number;
  outputSizeKb: number;
  createdAt: Date;
}
```

---

## 8. Next.js API Routes & Server-Sent Events (SSE) Protocol

### 8.1 REST Route Handlers

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/devices` | Returns array of connected Android devices with metadata and connection type (`usb` \| `wifi`) |
| `POST` | `/api/devices/[id]/capture` | Triggers immediate ADB in-memory screencap, returns Base64/buffer stream |
| `POST` | `/api/devices/connect-wifi` | Connects to a device via IP & port (`adb connect <ip>:<port>`) |
| `POST` | `/api/devices/[id]/switch-wireless` | 1-Click switch: puts USB device in TCP mode (`tcpip 5555`), detects IP, connects wirelessly |
| `POST` | `/api/devices/pair-wifi` | Pairs Android 11+ device using 6-digit code (`adb pair <ip>:<port> <code>`) |
| `GET` | `/api/bezels` | Returns list of available device mockup bezels & finishes |
| `GET` | `/api/templates` | Retrieves saved canvas templates from database |
| `POST` | `/api/templates` | Saves a new canvas design configuration |
| `POST` | `/api/export/batch` | Sharp C++ compositing pipeline: returns streamed multi-store `.zip` file |

### 8.2 Server-Sent Events (SSE) Protocol (`GET /api/events`)

Real-time streaming via native Next.js `ReadableStream` (`text/event-stream`), consumed natively by browser `EventSource`:
* `device:connected`: Emitted when ADB detects a newly plugged USB phone or connected Wi-Fi endpoint.
* `device:disconnected`: Emitted when USB or Wi-Fi connection drops.
* `capture:started`: Emitted when screenshot pull begins.
* `capture:completed`: Emitted with capture latency and thumbnail preview.
* `export:progress`: Emitted with current batch completion percentage (e.g. `20%`, `60%`, `100%`).

---

## 9. Directory Structure & Code Organization

```
adbsnap/
├── constants/                       # Centralized Single Source of Truth
│   ├── commands.ts                  # Raw ADB shell strings & templates
│   ├── strings.ts                   # App names, labels, CLI descriptions
│   ├── messages.ts                  # Terminal banners, progress logs, user hints
│   ├── errors.ts                    # Standard error codes & troubleshooting tips
│   ├── themes.ts                    # Gradients, bezel specs, canvas palettes
│   ├── styles.ts                    # Terminal chalk styles, status badges
│   └── config.ts                    # Timeouts, default ports, output paths
│
├── mocks/                           # Centralized Mock Fixtures (Offline Testing)
│   ├── mock-devices.ts              # Virtual devices for testing without phone
│   ├── mock-screens.ts              # Sample raw PNG buffers
│   └── mock-config.ts               # Sample adbsnap.config.json
│
├── bin/
│   └── cli.ts                       # CLI executable entrypoint (Commander.js)
│
├── lib/                             # Decoupled Core Engine
│   ├── driver.ts                    # Pluggable DeviceDriver interface
│   ├── adb.ts                       # AndroidDriver implementing DeviceDriver
│   ├── sharp.ts                     # Sharp C++ multi-layer 4K compositing engine
│   ├── presets.ts                   # Store resolution presets (Apple, Play, Web)
│   ├── zip.ts                       # In-memory archiver zip packaging
│   ├── db.ts                        # MongoDB connection handler (optional)
│   └── models/                      # Mongoose schemas (Template, BrandKit)
│
├── utils/
│   └── logger.ts                    # Centralized styled terminal logger
│
├── app/                             # Next.js 15 Web Studio (Milestone 3)
│   ├── api/
│   │   ├── devices/
│   │   │   ├── route.ts             # GET connected devices (USB & Wi-Fi)
│   │   │   ├── connect-wifi/
│   │   │   │   └── route.ts         # POST connect via IP:Port
│   │   │   ├── pair-wifi/
│   │   │   │   └── route.ts         # POST pair Android 11+ device
│   │   │   └── [id]/
│   │   │       ├── capture/
│   │   │       │   └── route.ts     # POST ADB screencap buffer
│   │   │       └── switch-wireless/
│   │   │           └── route.ts     # POST auto-switch USB to Wi-Fi
│   │   ├── events/
│   │   │   └── route.ts             # GET Server-Sent Events (SSE) live stream
│   │   ├── bezels/
│   │   │   └── route.ts             # GET device bezel library metadata
│   │   ├── templates/
│   │   │   └── route.ts             # GET / POST canvas templates
│   │   └── export/
│   │       └── batch/
│   │           └── route.ts         # POST Sharp C++ compositing & zip stream
│   ├── layout.tsx                   # App Root Layout
│   ├── page.tsx                     # Main Studio (Canvas + Sidebar Controls)
│   └── globals.css                  # Tailwind styles
│
├── components/                      # Next.js Web Studio Components
│   ├── canvas/
│   │   ├── StudioCanvas.tsx         # Client component wrapping Konva Stage
│   │   ├── DynamicCanvas.tsx        # Dynamic wrapper (ssr: false)
│   │   ├── DeviceBezelLayer.tsx     # 2D/3D phone frame rendering & shadow
│   │   └── TypographyLayer.tsx      # Title, subtitle & star badge layers
│   ├── controls/
│   │   ├── Sidebar.tsx              # Main studio tool panel
│   │   ├── DevicePicker.tsx         # Device selector & USB/Wi-Fi status badges
│   │   ├── WirelessModal.tsx        # Connect via Wi-Fi & Android 11+ pairing modal
│   │   ├── GradientEditor.tsx       # Solid, Linear, Radial, Aurora gradient pickers
│   │   └── TypographyControls.tsx   # Font, color, size, badges
│   └── export/
│       ├── ExportDialog.tsx         # Store targets checklist & 1-click export
│       └── ProgressBar.tsx          # Real-time SSE export progress bar
│
├── stores/                          # Zustand Web Studio Stores
│   ├── useCanvasStore.ts
│   └── useDeviceStore.ts
│
├── public/
│   └── bezels/                      # Vector SVG & transparent PNG device frames
│
├── adbsnap.config.json              # Declarative batch screenshot configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 10. Implementation Roadmap (The 3-Milestone Evolution Plan)

### Milestone 1: Minimum Working Model (CLI Core MVP — Days 1–2)
* **Goal:** Prove end-to-end viability in the terminal with zero frontend bloat.
* **Tasks:**
  * Initialize lightweight TypeScript Node project with `tsx` and `commander`.
  * Build `lib/adb.ts`: Auto-detect connected device (`adb devices`) and stream zero-disk PNG buffer (`adb exec-out screencap -p`).
  * Build `lib/sharp.ts`: Composite raw screenshot into an iPhone/Pixel frame with gradient backdrop.
  * Build `bin/cli.ts` implementing `adbsnap snap --frame <device> --title "<text>" --out <file.png>`.
  * **Deliverable:** Working terminal command generating real 4K framed store screenshots from a connected phone in <1 second.

### Milestone 2: Wireless Bridge & Batch Exporter (Days 3–4)
* **Goal:** Untether from USB cables and enable automated batch multi-store packaging.
* **Tasks:**
  * Build `adbsnap wifi` (1-click USB-to-wireless switch) and `adbsnap pair` (Android 11+ code pairing).
  * Implement declarative `adbsnap.config.json` supporting multi-screen flows and localized headlines.
  * Build `adbsnap export` to process multi-store targets (App Store 6.9", 6.7", Google Play) into an organized `.zip` file via `lib/zip.ts`.
  * **Deliverable:** Complete CLI production tool suitable for developer automation and CI/CD pipelines.

### Milestone 3: Next.js Visual Studio GUI (`adbsnap studio` — Days 5–7)
* **Goal:** Provide a rich visual WYSIWYG studio for creators and designers.
* **Tasks:**
  * Add `adbsnap studio` command booting Next.js 15 App Router web server.
  * Implement client-side Konva Stage (`react-konva` with `ssr: false`) for visual drag-and-drop, tilt, and live gradient editing.
  * Integrate Server-Sent Events (`/api/events`) for live device plug/unplug reactivity.
  * Connect Web Studio directly to existing `lib/sharp.ts` and `lib/adb.ts` engine.
  * (Optional) Connect MongoDB for saving custom templates and brand kits.
  * **Deliverable:** Full dual-mode studio offering both terminal speed and visual design freedom.
