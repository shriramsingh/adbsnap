import fs from "fs";
import path from "path";
import sharp from "sharp";

const rootDir = path.resolve();
const hero = path.join(rootDir, "output/snap-aurora-2026-09-17T06-25-17.png");
const shot = path.join(rootDir, "output/test-framed-showcase.png");
const portfolioOut = "F:/portFolioApp/shriramsingh-dev/public/images/projects/adbsnap-hero.png";
const localOut = path.join(rootDir, "output/adbsnap-hero.png");

// Save to portfolio if directory exists, otherwise save locally in ./output/
const out = fs.existsSync(path.dirname(portfolioOut)) ? portfolioOut : localOut;

const W = 1600;
const H = 900;
const phoneH = 760;

const p1 = await sharp(hero).resize({ height: phoneH }).png().toBuffer();
const p2 = await sharp(shot).resize({ height: phoneH }).png().toBuffer();
const m1 = await sharp(p1).metadata();
const m2 = await sharp(p2).metadata();
console.log("phone sizes", m1.width, "x", m1.height, "|", m2.width, "x", m2.height);

const accent = Buffer.from(
  '<svg width="1600" height="900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f46e5" stop-opacity="0.55"/><stop offset="0.5" stop-color="#06b6d4" stop-opacity="0.28"/><stop offset="1" stop-color="#10b981" stop-opacity="0.35"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="1330" cy="140" r="220" fill="#6366f1" fill-opacity="0.18"/><circle cx="200" cy="780" r="240" fill="#06b6d4" fill-opacity="0.12"/></svg>'
);

const base = await sharp({
  create: { width: W, height: H, channels: 3, background: { r: 15, g: 23, b: 42 } },
})
  .composite([{ input: accent }])
  .png()
  .toBuffer();

const gap = 60;
const totalPhones = (m1.width ?? 350) + gap + (m2.width ?? 350);
const x1 = Math.max(660, W - totalPhones - 80);
const x2 = x1 + (m1.width ?? 350) + gap;
const y = Math.round((H - phoneH) / 2);

const text = Buffer.from(
  '<svg width="1600" height="900"><text x="90" y="330" font-family="Arial,sans-serif" font-size="92" font-weight="800" fill="white">ADBSnap</text><text x="92" y="388" font-family="Arial,sans-serif" font-size="29" fill="#a5b4fc">App Store Asset Studio for Android</text><text x="92" y="442" font-family="Arial,sans-serif" font-size="21" fill="#94a3b8">Capture   |   Frame   |   Export</text><rect x="90" y="486" width="380" height="54" rx="10" fill="#020617" stroke="#334155"/><text x="112" y="521" font-family="monospace" font-size="21" fill="#e2e8f0">npx adbsnap snap</text></svg>'
);

await sharp(base)
  .composite([
    { input: p1, left: x1, top: y },
    { input: p2, left: x2, top: y },
    { input: text },
  ])
  .png()
  .toFile(out);

console.log("hero written to", out);
