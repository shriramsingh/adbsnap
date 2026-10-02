import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { compositeFrame } from '../lib/sharp.js';

const portfolioProjectsDir = 'F:/portFolioApp/shriramsingh-dev/public/images/projects';

async function generateAssets() {
  console.log('--- Refining ADBSnap Hero Banner ---');

  const dashScreenPath = path.join(portfolioProjectsDir, 'prompttest-screen-dashboard.png');
  const dashBuf = fs.readFileSync(dashScreenPath);

  // Generate framed iPhone 16 Pro asset
  const res1 = await compositeFrame({
    screenshotBuffer: dashBuf,
    bezelId: 'iphone-16-pro',
    gradientPreset: 'aurora',
    title: 'Instant 4K Asset Studio',
    subtitle: 'Streamed direct from device RAM via ADB exec-out in <1s',
    showStarBadge: true,
    typographyPosition: 'top',
  });

  // Target phone height 730 inside 900 canvas, with nice rounded corners
  const phoneTargetHeight = 740;
  const resizedPhone = await sharp(res1.buffer)
    .resize({ height: phoneTargetHeight, fit: 'inside' })
    .png()
    .toBuffer();
  
  const phoneMeta = await sharp(resizedPhone).metadata();
  const phoneW = phoneMeta.width || 341;
  const phoneH = phoneMeta.height || 740;

  // Mask the phone with rounded corners (rx=28) so its outer background curve blends gracefully
  const phoneMaskSvg = `
  <svg width="${phoneW}" height="${phoneH}">
    <rect width="${phoneW}" height="${phoneH}" rx="32" fill="#ffffff" />
  </svg>
  `;
  const roundedPhone = await sharp(resizedPhone)
    .composite([{ input: Buffer.from(phoneMaskSvg), blend: 'dest-in' }])
    .png()
    .toBuffer();

  const termW = 950;
  const termH = 750;
  const termX = 65;
  const termY = 75;

  const phoneX = 1600 - phoneW - 80;
  const phoneY = termY + Math.round((termH - phoneH) / 2);

  const terminalSvg = `
  <svg width="1600" height="900" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#070a12" />
        <stop offset="50%" stop-color="#0b1120" />
        <stop offset="100%" stop-color="#060913" />
      </linearGradient>
      <radialGradient id="indigoGlow" cx="20%" cy="30%" r="55%">
        <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.22" />
        <stop offset="100%" stop-color="#4f46e5" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="cyanGlow" cx="85%" cy="55%" r="65%">
        <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.18" />
        <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
      </radialGradient>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1e293b" stroke-width="0.75" stroke-opacity="0.5" />
      </pattern>
      <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.65" />
      </filter>
      <filter id="phoneShadow" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.8" />
      </filter>
    </defs>

    <!-- Canvas Background -->
    <rect width="1600" height="900" fill="url(#bgGrad)" />
    <rect width="1600" height="900" fill="url(#indigoGlow)" />
    <rect width="1600" height="900" fill="url(#cyanGlow)" />
    <rect width="1600" height="900" fill="url(#grid)" />

    <!-- Terminal Window Container -->
    <g filter="url(#shadow)">
      <rect x="${termX}" y="${termY}" width="${termW}" height="${termH}" rx="18" fill="#090d16" stroke="#1e293b" stroke-width="1.5" />
      
      <!-- Window Titlebar -->
      <rect x="${termX}" y="${termY}" width="${termW}" height="54" rx="18" fill="#0f172a" />
      <rect x="${termX}" y="${termY + 36}" width="${termW}" height="18" fill="#0f172a" />
      <line x1="${termX}" y1="${termY + 54}" x2="${termX + termW}" y2="${termY + 54}" stroke="#1e293b" stroke-width="1" />

      <!-- Window Dots -->
      <circle cx="${termX + 28}" cy="${termY + 27}" r="7" fill="#ef4444" />
      <circle cx="${termX + 50}" cy="${termY + 27}" r="7" fill="#f59e0b" />
      <circle cx="${termX + 72}" cy="${termY + 27}" r="7" fill="#10b981" />

      <!-- Window Title -->
      <text x="${termX + 110}" y="${termY + 33}" font-family="'JetBrains Mono', 'Fira Code', Consolas, monospace" font-size="14" fill="#94a3b8" font-weight="500">
        adbsnap ~ 4k-asset-studio-v1.2.0
      </text>

      <!-- Status Pill -->
      <rect x="${termX + termW - 190}" y="${termY + 14}" width="164" height="26" rx="13" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-opacity="0.3" />
      <circle cx="${termX + termW - 174}" cy="${termY + 27}" r="4.5" fill="#10b981" />
      <text x="${termX + termW - 160}" y="${termY + 32}" font-family="'JetBrains Mono', monospace" font-size="12" fill="#34d399" font-weight="600">
        ADB: Connected
      </text>

      <!-- Terminal Body Content -->
      <g font-family="'JetBrains Mono', 'Fira Code', Consolas, monospace" font-size="14" xml:space="preserve">
        <!-- Shell Prompt -->
        <text x="${termX + 32}" y="${termY + 98}" fill="#38bdf8" font-weight="600">$</text>
        <text x="${termX + 50}" y="${termY + 98}" fill="#f8fafc" font-weight="600">npx adbsnap snap --theme=aurora --device=iphone16pro</text>

        <!-- Banner Header -->
        <text x="${termX + 32}" y="${termY + 140}" fill="#818cf8" font-weight="700">📸 ADBSnap 4K Asset Studio &amp; Bezel Engine v1.2.0</text>
        <text x="${termX + 32}" y="${termY + 168}" fill="#64748b">Target Device :</text>
        <text x="${termX + 180}" y="${termY + 168}" fill="#38bdf8" font-weight="600">GEVKDEUWOJC89OR (Android 15 / 1080x2400)</text>
        <text x="${termX + 32}" y="${termY + 192}" fill="#64748b">Theme Preset  :</text>
        <text x="${termX + 180}" y="${termY + 192}" fill="#a78bfa" font-weight="600">Electric Aurora (135° Gradient + 4K Vector Glass)</text>

        <!-- Divider -->
        <line x1="${termX + 32}" y1="${termY + 214}" x2="${termX + termW - 32}" y2="${termY + 214}" stroke="#1e293b" stroke-width="1" />

        <!-- Step 1 -->
        <text x="${termX + 32}" y="${termY + 246}" fill="#cbd5e1" font-weight="700">[1/4] Capturing raw framebuffer over ADB exec-out...</text>
        <text x="${termX + 56}" y="${termY + 272}" fill="#34d399">✓</text>
        <text x="${termX + 76}" y="${termY + 272}" fill="#94a3b8">Streamed 1080x2400 PNG direct into Node buffer in </text>
        <text x="${termX + 480}" y="${termY + 272}" fill="#38bdf8" font-weight="600">42ms</text>
        <text x="${termX + 530}" y="${termY + 272}" fill="#64748b">(Zero disk I/O)</text>

        <!-- Step 2 -->
        <text x="${termX + 32}" y="${termY + 314}" fill="#cbd5e1" font-weight="700">[2/4] Compositing 4K Vector Chassis (iPhone 16 Pro Max)...</text>
        <text x="${termX + 56}" y="${termY + 340}" fill="#34d399">✓</text>
        <text x="${termX + 76}" y="${termY + 340}" fill="#94a3b8">Dynamic Island hardware mask, speaker slit &amp; corner radius (r=52px)</text>
        <text x="${termX + 56}" y="${termY + 364}" fill="#34d399">✓</text>
        <text x="${termX + 76}" y="${termY + 364}" fill="#94a3b8">Injected specular chassis reflection &amp; ultra-soft ambient shadow</text>

        <!-- Step 3 -->
        <text x="${termX + 32}" y="${termY + 406}" fill="#cbd5e1" font-weight="700">[3/4] Rendering Typography &amp; 5-Star Rating Pill...</text>
        <text x="${termX + 56}" y="${termY + 432}" fill="#34d399">✓</text>
        <text x="${termX + 76}" y="${termY + 432}" fill="#94a3b8">Auto-wrapped title: &quot;Instant 4K Asset Studio&quot; with drop shadow</text>
        <text x="${termX + 56}" y="${termY + 456}" fill="#34d399">✓</text>
        <text x="${termX + 76}" y="${termY + 456}" fill="#94a3b8">Gold star rating badge &amp; subtitle composite completed</text>

        <!-- Step 4 -->
        <text x="${termX + 32}" y="${termY + 498}" fill="#cbd5e1" font-weight="700">[4/4] Multi-Store Target Asset Pipeline...</text>
        <text x="${termX + 56}" y="${termY + 524}" fill="#34d399">✓</text>
        <text x="${termX + 76}" y="${termY + 524}" fill="#94a3b8">Apple App Store 6.9&quot; Super Retina (1290 x 2796 px)</text>
        <text x="${termX + 56}" y="${termY + 548}" fill="#34d399">✓</text>
        <text x="${termX + 76}" y="${termY + 548}" fill="#94a3b8">Google Play Store 4K Target (1440 x 3120 px)</text>
        <text x="${termX + 56}" y="${termY + 572}" fill="#34d399">✓</text>
        <text x="${termX + 76}" y="${termY + 572}" fill="#94a3b8">Story Maker: Animated looping GIF (60fps quantization)</text>

        <!-- Success Banner -->
        <rect x="${termX + 32}" y="${termY + 596}" width="${termW - 64}" height="68" rx="10" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.25" />
        <text x="${termX + 52}" y="${termY + 624}" fill="#34d399" font-weight="700">✨ Asset Generation Complete — Ready for App Store Upload!</text>
        <text x="${termX + 52}" y="${termY + 648}" fill="#94a3b8">Output: </text>
        <text x="${termX + 115}" y="${termY + 648}" fill="#38bdf8" font-weight="600">./output/adbsnap-store-bundle.zip</text>
        <text x="${termX + 430}" y="${termY + 648}" fill="#64748b">| Speed: </text>
        <text x="${termX + 500}" y="${termY + 648}" fill="#34d399" font-weight="600">328ms total</text>
        <text x="${termX + 605}" y="${termY + 648}" fill="#64748b">| Memory: </text>
        <text x="${termX + 680}" y="${termY + 648}" fill="#cbd5e1" font-weight="600">18.4 MB</text>
        <text x="${termX + 760}" y="${termY + 648}" fill="#64748b">| 0 Warnings</text>
      </g>
    </g>

    <!-- Phone Showcase Frame Container -->
    <g filter="url(#phoneShadow)">
      <rect x="${phoneX - 8}" y="${phoneY - 8}" width="${phoneW + 16}" height="${phoneH + 16}" rx="38" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
    </g>
  </svg>
  `;

  const heroBuffer = await sharp(Buffer.from(terminalSvg))
    .composite([
      {
        input: roundedPhone,
        left: phoneX,
        top: phoneY,
      },
    ])
    .png()
    .toBuffer();

  const heroPath = path.join(portfolioProjectsDir, 'adbsnap-hero.png');
  fs.writeFileSync(heroPath, heroBuffer);
  console.log('  -> Wrote refined', heroPath, `(1600x900, ${(heroBuffer.length / 1024).toFixed(1)} KB)`);
}

generateAssets().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
