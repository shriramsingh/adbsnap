# Changelog

All notable changes to **ADBSnap** will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.0] - 2026-10-13

### 📐 Multi-Platform Canvas Aspect Ratios (16:9 & 1:1)
- **Multi-Platform Canvas Presets**:
  - Added Portrait 9:19.5 (`1290×2796`), Landscape 16:9 (`1920×1080`), and Square 1:1 (`1080×1080`) presets across the Sharp compositing engine (`lib/sharp.ts`), backdrop generator (`lib/backdrop-generator.ts`), and Studio server (`lib/studio-server.ts`).
  - Added responsive typography auto-scaling and dual-axis phone layout anchoring for landscape banners and square feed posts.
  - Added interactive segmented aspect ratio toolbar `[ 📱 9:19.5 Store | 🖥️ 16:9 Banner | ⬛ 1:1 Square ]` to the Studio canvas (`app/page.tsx`).
  - Added `--aspect portrait|landscape|square` CLI flag to `adbsnap snap` in `bin/cli.ts`.
  - Added `adbsnap.selectAspectRatio` QuickPick command to the VS Code extension.

### ✨ Android SystemUI Demo Mode
- **Clean Marketing Status Bar**:
  - Added `adbsnap demo [on|off]` CLI command and `adbsnap.toggleDemoMode` VS Code command.
  - Instantly forces connected Android status bar to pristine 9:41 AM clock, 100% battery, full Wi-Fi signal, and zero notification icons.

### 💻 VS Code Extension Full Parity (v1.4.0)
- **Embedded Asset Studio Webview**:
  - Integrated full React 19 visual Studio directly inside VS Code via process isolation and background daemon management (`vscode/src/studio/studioWebview.ts`).
- **Device Discovery & Auto-Reconnect**:
  - Added 1-click wireless auto-reconnect, Android 11+ pairing code modal, and device switcher in status bar and tree views.
- **Enhanced Productivity Commands**:
  - Added `adbsnap.insertMarkdown` to snap and paste markdown image syntax directly into the active editor.
  - Added QuickPicks for 15 Flagship Bezels, 16 Curated Themes, 4 Output Formats, and 3 Aspect Ratios.
  - Added Autonomous Explorers (`adbsnap.explore`, `adbsnap.exploreIos`) and App Lifecycle controls (`adbsnap.resetAppData`, `adbsnap.relaunchApp`).

### 🧪 Unified Test Suite
- **Comprehensive Quality Assurance**:
  - Added `scripts/test-suite.ts` and registered `npm test` script.
  - 15/15 automated checks covering drivers, Sharp compositing, bezels, formats, and aspect ratios.

---

## [1.3.0] - 2026-10-11

### 🎨 Studio 2.0 Canvas Drag, Typography & Aesthetics
- **Direct On-Canvas Text Repositioning**:
  - Implemented Figma-style direct drag repositioning for top headline/subtitle and bottom callout text blocks.
  - Added ultra-smooth 120 FPS ghost preview box while dragging, automatically committing final offsets on pointer release.
  - Contextual selection-based typography inspector with live styling controls.
- **Dual Visible Textareas & Flexible Positioning**:
  - Added dedicated multi-line `<textarea>` editors for both Top Headline and Bottom Feature Callout with Enter/line-break preservation.
  - Multi-position support: `[ ⬆ Top | ⬇ Bottom | ↕ Both ]` splitting punchy headlines above the device and explanatory callouts below.
  - Added dynamic auto-downscaling for 3+ line headlines to guarantee edge clearance.
- **1-Click Designer Aesthetics Style Recipes**:
  - Added curated style presets (Bold Minimalist, Editorial Modern, Playful Pastel, Neon Cyber, Gradient Luxe) applying high-end typography and palette pairings with 1 click.
  - Added 1-click "Apply to All Slides" batch styling synchronization across the filmstrip with preserved custom backdrop colors.

### 🍎 Comprehensive Apple iOS Ecosystem Support
- **Simulators & Physical Device Discovery & Screenshots**:
  - Full support for booted iOS simulators via macOS `xcrun simctl` and paired physical iPhones/iPads via `xcrun devicectl`.
  - Unified device listing in CLI (`adbsnap devices`), Studio, and VS Code extension with clear `iOS 🍎` badge.
  - Seamless routing through shared 4K device framing and App Store multi-dimension export pipelines.
- **Autonomous XCTest / XCUITest Auto Explorer (`adbsnap explore-ios`)**:
  - Autonomous crawler traversing tab roots and accessible view hierarchies up to 2 levels deep, capturing App Store screenshots hands-free.
  - Added Apple Developer Team ID automatic signing configuration for physical device execution.
  - Validated with automated test coverage and macOS GitHub Actions workflows.

### ⚡ Performance & Engine Optimization
- **Parallel Multi-Store Asset Rendering (3x Speedup)**:
  - Implemented single-pass phone chassis assembly caching (`assemblePhoneDevice` in `lib/sharp.ts`). Composites 4K bezel, screen buffer, Dynamic Island/punch-hole cutout, and realistic drop shadow once in host RAM.
  - Parallelized `exportMultiStore` with `Promise.all` across all target dimensions (Google Play Phone, Google Feature Graphic, iPhone 6.9", 6.7", 6.5", iPad Pro 13", and Android Tablet 11").
  - Turnaround reduced from **>8.1s down to ~2.5s** (over 3x speedup).
  - Fixed aspect-ratio crop calculation for non-standard target ratios (e.g. Google Play Feature Graphic `1024x500`).
- **Raw In-Memory Framebuffer Screencap**:
  - Direct uncompressed RGBA capture stream via `adb exec-out screencap`, bypassing slow on-device PNG compression.
  - In-memory binary header parsing with Sharp completes in **~52ms** with automatic fallback to `screencap -p`.
- **Studio Fast-Preview & 60fps Responsiveness**:
  - Dedicated half-resolution preview endpoint (`format: 'preview'`, `645x1398`), shrinking Base64 loopback payload by **83%** (~85 KB vs 500+ KB).
  - Reduced Studio UI slider debounce to 120ms for instant 60fps canvas updates.
  - Clean SPA serving from `dist/studio/` with native Node HTTP server.

### 📱 2026 Flagship Bezels & Next-Gen Formats
- **Next-Gen Image Formats**:
  - Added `--format=webp|avif|png|jpeg` support to CLI capture, export pipelines, and Studio API.
  - **AVIF** exports at **7.3 KB (95% smaller than PNG)** with superior chroma fidelity; **WebP** exports at **~86 KB (42% smaller)** for instant web distribution.
- **2026 Flagship Vector Bezels**:
  - Added `iphone-16-pro-max`: 6.9" Super Retina XDR bezel with Dynamic Island and micro-bezels.
  - Added `pixel-9-pro-fold`: Inner 8" Foldable OLED bezel with hinge notch simulation.
  - Added `galaxy-s25-ultra`: 6.8" Dynamic AMOLED 2X titanium chassis with precision punch-hole camera.

### 🐛 Bug Fixes & UX Polish
- **Backdrop Y-Offset Clamping**: Unclamped `textYOffset` in backdrop generator allowing smooth negative and positive text repositioning without artificial boundaries.
- **Stage Dock & Callout Collision**: Repositioned bottom stage dock controls (`bottom-8` instead of `bottom-24`) to eliminate overlap with bottom text callouts on the canvas.
- **Curated Theme Sync**: Fixed `handleSyncStyleToAll` to properly synchronize curated gradient themes while preserving custom color choices.
- **Filmstrip Delete Action**: Fixed click blocking caused by `pointer-events-none` on filmstrip thumbnail wrappers, restoring instant single-screen deletion (`Trash2`) and reordering.


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
