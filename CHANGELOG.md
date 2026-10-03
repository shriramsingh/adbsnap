# Changelog

All notable changes to **ADBSnap** will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-10-03

### ⚡ Performance & Engine Optimization
- **Parallel Multi-Store Asset Rendering**:
  - Implemented single-pass phone chassis assembly caching (`assemblePhoneDevice` in `lib/sharp.ts`). The physical bezel, screen buffer, Dynamic Island / punch-hole cutout, and realistic drop shadow are composited once in host RAM at native resolution.
  - Parallelized `exportMultiStore` using `Promise.all` across all store target dimensions (Google Play Phone, Google Feature Graphic, iPhone 6.9", 6.7", 6.5", iPad Pro 13", and Android Tablet 11").
  - Benchmarked: multi-store export turnaround reduced from **>8.1s down to ~2.5s** (over 3x speedup).
  - Fixed aspect-ratio crop calculation for non-standard target ratios (e.g., Google Play Feature Graphic `1024x500`).
- **Raw In-Memory Framebuffer Screencap**:
  - Added ultra-fast raw framebuffer capture via `adb exec-out screencap` without compression flags, bypassing slow on-device PNG encoding (`screencap -p`).
  - Added binary header parsing (`width`, `height`, `format`) and host-side RAM conversion using Sharp in **~52ms** with automatic fallback to standard screencap.
- **Studio Fast-Preview & 60fps Responsiveness**:
  - Added half-resolution preview endpoint (`format: 'preview'`, `645x1398`), shrinking loopback Base64 payload by **83%** (~85 KB vs 500+ KB).
  - Reduced Studio UI slider debounce to 120ms for smooth 60fps canvas updates during real-time property adjustments.
  - Corrected Studio directory resolution to serve pre-compiled SPA from `dist/studio/` with clean `http://localhost:${port}` fallback.

### 🎨 Formats & Device Bezels
- **Next-Gen Image Formats**:
  - Added `--format=webp|avif|png|jpeg` support to CLI capture, export pipelines, and Studio API.
  - AVIF exports at **7.3 KB (95% smaller than PNG)** with superior chroma fidelity; WebP exports at **~86 KB (42% smaller)** for instant web distribution.
- **2026 Flagship Vector Bezels**:
  - Added `iphone-16-pro-max`: 6.9" Super Retina XDR bezel with Dynamic Island and micro-bezels.
  - Added `pixel-9-pro-fold`: Inner 8" Foldable OLED bezel with hinge notch simulation.
  - Added `galaxy-s25-ultra`: 6.8" Dynamic AMOLED 2X titanium chassis with precision punch-hole camera.

### 🍎 Cross-Platform Integration
- **Pluggable iOS Simulator Driver**:
  - Added `lib/ios.ts` using macOS `xcrun simctl` to detect booted iOS simulators and capture uncompressed screenshots.
  - Unified device routing (`lib/devices.ts`) returning `ios` transport with `iOS 🍎` badge in CLI and Studio device lists.

### ✍️ Flexible Multi-Line Typography & Positioning
- **Top, Bottom & Both Placement (`lib/backdrop-generator.ts`, `lib/sharp.ts`)**:
  - Added support for `'top'` (default), `'bottom'` (marketing text rendered below device chassis with top-positioned phone), and `'both'` (top punchy headline/badge + bottom feature callout/subtitle with vertically centered phone).
  - Dynamically calculates phone chassis placement based on active typography positioning to ensure ample breathing room and prevent visual overlap.
- **Multi-Line Text Formatting**:
  - Upgraded `wrapText` to preserve user-entered explicit line breaks (`\n`) across paragraphs while wrapping long lines.
  - Implemented dynamic auto-downscaling for headlines with 3+ lines to prevent canvas edge clipping.
  - Upgraded Studio UI with multi-line `<textarea>` inputs with `Enter` support and a segmented text position selector (`[ ⬆ Top | ⬇ Bottom | ↕ Both ]`).
  - Added `--text-pos <top|bottom|both>` and `--footer <text>` CLI options.

### 🐛 Bug Fixes & Studio UX
- **Filmstrip Delete Action**:
  - Fixed click blocking caused by `pointer-events-none` on filmstrip thumbnail wrappers in `app/page.tsx`.
  - Added `pointer-events-auto` and `z-20` on `<Trash2>` button and chevron reorder controls.
  - Resynced `activeScreenIndex` and canvas preview state when deleting single items from the filmstrip.

---

## [1.2.1] - 2026-10-02

### 🔄 Tooling & Distribution
- **Unified Multi-Platform Release Engine**:
  - Synchronized versions across NPM (`adbsnap@1.2.1`), VS Code Marketplace extension, and CLI binary via automated `bump-version.mjs`.
- **Community Prompts**:
  - Added polite 5th-capture VS Code Marketplace review prompt and CLI GitHub star prompt.
- **SEO & Discoverability Infrastructure**:
  - Added structured Schema.org JSON-LD, canonical indexing, robots.txt, and sitemap.xml to the official showcase site at `https://shriramsingh.github.io/adbsnap/`.

---

## [1.2.0] - 2026-09-26

### ⚡ Native Studio Architecture
- **Zero-Dependency Native Studio Engine**:
  - Replaced heavy Next.js runtime with an ultra-lightweight, native Node HTTP server.
  - Reduced runtime dependencies to only 3 (`sharp`, `archiver`, `gifenc`).
  - Studio boots in **< 15 milliseconds** with zero Webpack compilation delay.
- **Dedicated App Window Mode**:
  - `adbsnap studio` launches in a dedicated desktop window without browser address bars or tabs.
  - Serves at `http://adbsnap.localhost:3000` with automatic browser fallback.
- **100% Pre-compiled Studio UI**:
  - Full React 19 visual dashboard with Lucide icons, glassmorphism, filmstrip, and animations pre-compiled at build time.

---

## [1.1.0] - 2026-09-17

### 📶 Wireless ADB & Devices
- **Comprehensive Wireless ADB Suite**:
  - 1-Click USB ↔ Wi-Fi switch: automatic device IP discovery, TCP/IP mode launch, and cable disconnection.
  - Android 11+ Pairing Modal with 6-digit wireless pairing code and mDNS ZeroConf.
  - Dynamic USB auto-prioritization when cables are plugged in.
  - Interactive transport switcher in Studio header (`[ 🔌 USB ▾ ]` and `[ 📶 Wi-Fi ▾ ]`).
- **Raw Screenshot Canvas Theme**:
  - Added "None (Raw Screenshot)" canvas theme to export unedited 1:1 mobile screenshots with zero framing.
- **Animated Story Maker**:
  - Convert multi-step screen flows into looping animated GIFs with custom playback intervals (500ms – 4000ms).
- **Expanded Device Frames**:
  - Added Frameless Floating Mockup (`frameless`), iPad Pro 13", Android Tablet 11", iPhone 16 Pro, and Google Pixel 9 Pro.

---

## [1.0.0] - 2026-09-07

### 🚀 Initial Release
- **Direct RAM Screencap**: Zero-config in-memory screenshot capture via ADB.
- **4K Vector Bezels**: Vector-sharp device mockups with realistic drop shadows.
- **Studio Backdrops & Typography**: 8 gradient presets with auto-wrapping SVG headlines.
- **Multi-Store Export**: Bundled App Store & Google Play ZIP generation.
- **Autonomous Tab Crawler**: Detects and traverses `BottomNavigationView` tabs hands-free.
- **Dual CLI**: Accessible via `adbsnap` and `snapshot`.
