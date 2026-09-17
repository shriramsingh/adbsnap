export const APP_INFO = {
  NAME: 'ADBSnap',
  VERSION: '1.1.4',
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
  crawl [package]      Tab crawler (auto-detects & captures all bottom tabs)
  run [config]         Execute automated scripted journey from JSON (launch, type, tap, snap)
  export               Auto-export across App Store & Google Play resolutions
  journey              Interactive multi-screen capture wizard (guided carousel)
  devices              List all connected USB, Wi-Fi, and emulator devices
  wifi [ip|off]        Switch device to wireless ADB mode or turn off (adbsnap wifi off)
  usb                  Reset ADB connection back to USB mode (turn off wireless)
  doctor               Verify ADB installation, device health, and permissions
  studio               Launch the local Next.js interactive web dashboard (http://localhost:3000)
  help                 Display this guide


SNAP & EXPORT OPTIONS:
  --frame <bezel>      Phone bezel chassis (default: iphone-16-pro)
                       Available: iphone-16-pro, pixel-9-pro, minimal
  --theme <preset>     Backdrop color gradient (default: aurora)
                       Available: aurora, studioLight, freshMint, sunset, midnight, royal, cleanDark
  --layout <mode>      Layout positioning mode (default: appstore)
                       Available: appstore (bottom bleed), social (floating centered)
  --fit <mode>         Screenshot aspect ratio scaling (default: cover)
                       Available: cover (safe aspect ratio), contain, fill
  --font <preset|name> Typography font family (default: modern)
                       Available: modern, rounded, editorial, mono, or custom font name
  --title <text>       Headline text on canvas (auto-wraps long titles)
  --subtitle <text>    Subtitle description under headline
  --stars              Display 5-star rating chip (★★★★★ 5.0 RATED)
  --zip                Package outputs into a single .zip archive for instant store upload
  --config <path>      Load project settings & screens from JSON (e.g. adbsnap.config.json)
  --device <id>        Target specific device ID (defaults to first ready device)
  --out <path>         Custom output file path
  --raw                Skip device framing and export raw mobile screenshot

EXAMPLES:
  adbsnap snap
  adbsnap snap --theme studioLight --title "Minimal Productivity"
  adbsnap explore com.example.app --theme aurora --zip
  adbsnap export --theme studioLight --zip
  adbsnap doctor
  adbsnap devices
  adbsnap wifi 192.168.1.100
`;


