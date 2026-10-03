export const APP_INFO = {
  NAME: 'ADBSnap',
  VERSION: '1.3.0',
  TAGLINE: 'Automated Mobile Showcase & App Store Asset Studio',
  DESCRIPTION: 'CLI tool to capture, frame, and export mobile screenshots directly via ADB.',
} as const;

export const CLI_HELP = `
ADBSnap / Snapshot — Automated Mobile Showcase Studio v${APP_INFO.VERSION}

USAGE:
  adbsnap [command] [options]
  snapshot [command] [options]

COMMANDS:
  snap                 Capture live screenshot and frame into showcase graphic (default)
  explore [package]    Autonomous hands-free screen discovery & tab crawler
  explore-ios          Explore accessible screens in an installed iOS app (macOS/Xcode)
  crawl [package]      Tab crawler (auto-detects & captures all bottom tabs)
  run [config]         Execute automated scripted journey from JSON (launch, type, tap, snap)
  export               Auto-export across App Store & Google Play resolutions (parallelized)
  journey              Interactive multi-screen capture wizard (guided carousel)
  devices              List all connected USB, Wi-Fi, emulator, and iOS simulator devices
  wifi [ip|off]        Switch device to wireless ADB mode or turn off (adbsnap wifi off)
  usb                  Reset ADB connection back to USB mode (turn off wireless)
  doctor               Verify ADB installation, device health, and permissions
  studio               Launch the desktop interactive web dashboard (http://localhost:3000)
  help                 Display this guide


SNAP & EXPORT OPTIONS:
  --frame <bezel>      Phone bezel chassis (default: iphone-16-pro)
                       Available: iphone-16-pro, iphone-16-pro-max, pixel-9-pro,
                       pixel-9-pro-fold, galaxy-s25-ultra, ipad-pro-13,
                       android-tablet-11, frameless, minimal
  --format <ext>       Output image format (default: png)
                       Available: png, webp, avif, jpeg
  --theme <preset>     Backdrop color gradient (default: aurora)
                       Available: aurora, studioLight, freshMint, sunset, midnight, royal, cleanDark, none
  --layout <mode>      Layout positioning mode (default: appstore)
                       Available: appstore (bottom bleed), social (floating centered)
  --fit <mode>         Screenshot aspect ratio scaling (default: cover)
                       Available: cover (safe aspect ratio), contain, fill
  --font <preset|name> Typography font family (default: modern)
                       Available: modern, rounded, editorial, mono, or custom font name
  --title <text>       Headline text on canvas (supports multi-line with \n)
  --subtitle <text>    Subtitle description under headline
  --footer <text>      Footer callout text (useful when text-pos is 'both')
  --text-pos <pos>     Text placement on canvas (default: top)
                       Available: top, bottom, both
  --stars              Display 5-star rating chip (★★★★★ 5.0 RATED)
  --zip                Package outputs into a single .zip archive for instant store upload
  --config <path>      Load project settings & screens from JSON (e.g. adbsnap.config.json)
  --device <id>        Target Android serial or iOS simulator/device ID
  --out <path>         Custom output file path
  --raw                Skip device framing and export raw mobile screenshot
  --bundle <id>        Installed iOS app bundle ID (for explore-ios)
  --team <id>          Apple Developer Team ID (required for physical-device XCTest)

EXAMPLES:
  adbsnap snap
  adbsnap snap --frame iphone-16-pro-max --theme sunset --format webp
  adbsnap snap --frame pixel-9-pro-fold --title "Unfold Possibilities"
  adbsnap snap --theme studioLight --title "Minimal Productivity"
  adbsnap explore com.example.app --theme aurora --zip
  adbsnap explore-ios --bundle com.example.myapp --device <simulator-or-device-id> --zip
  adbsnap explore-ios --bundle com.example.myapp --device <device-id> --team <team-id> --zip
  adbsnap export --theme studioLight --zip --format avif
  adbsnap doctor
  adbsnap devices
  adbsnap wifi 192.168.1.100
`;
