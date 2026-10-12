import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { androidDriver } from './adb';
import { iosDriver } from './ios';
import { listAllDevices } from './devices';
import { BEZEL_PRESETS, GRADIENT_PRESETS, type BezelSpec } from '../constants/themes';
import { generateBezelSvg } from './bezel-generator';
import { generateGradientSvg, generateTypographySvg } from './backdrop-generator';

let cachedFfmpegPath: string | null = null;

/**
 * Checks whether FFmpeg executable is available on system PATH.
 */
export async function hasFfmpeg(): Promise<boolean> {
  if (cachedFfmpegPath) return true;
  return new Promise((resolve) => {
    execFile('ffmpeg', ['-version'], { timeout: 4000 }, (err) => {
      if (!err) {
        cachedFfmpegPath = 'ffmpeg';
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

export interface RecordDeviceOptions {
  durationSec?: number;
  deviceId?: string;
}

/**
 * Records screen video directly from the connected Android or iOS device into host RAM.
 */
export async function recordDeviceScreen(options: RecordDeviceOptions = {}): Promise<Buffer> {
  const duration = Math.min(Math.max(options.durationSec || 5, 2), 30);
  const devices = await listAllDevices();
  const ready = devices.filter((d) => d.isAuthorized);

  const target = options.deviceId
    ? ready.find((d) => d.id === options.deviceId)
    : ready[0];

  if (!target) {
    throw new Error('No connected and authorized mobile device or simulator found to record.');
  }

  if (target.platform === 'ios') {
    return await recordIosScreen(target.id, duration);
  }

  // Android device via ADB
  return await androidDriver.recordVideo(duration, target.id);
}

/**
 * Records screen video from a booted iOS simulator.
 */
async function recordIosScreen(udid: string, durationSec: number): Promise<Buffer> {
  const tmpFile = path.join(os.tmpdir(), `adbsnap-ios-rec-${Date.now()}.mp4`);

  return new Promise<Buffer>((resolve, reject) => {
    const proc = spawn('xcrun', ['simctl', 'io', udid, 'recordVideo', tmpFile], {
      stdio: 'ignore',
    });

    const timer = setTimeout(() => {
      // Send SIGINT to simctl recordVideo so it cleanly finalizes the MP4 container
      proc.kill('SIGINT');
    }, durationSec * 1000);

    proc.on('close', () => {
      clearTimeout(timer);
      try {
        if (fs.existsSync(tmpFile)) {
          const buffer = fs.readFileSync(tmpFile);
          try {
            fs.unlinkSync(tmpFile);
          } catch {
            // ignore
          }
          if (buffer.length > 0) {
            return resolve(buffer);
          }
        }
        reject(new Error('iOS screen recording produced an empty or missing video file.'));
      } catch (err) {
        reject(err);
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export interface FrameVideoOptions {
  videoBuffer: Buffer;
  bezelId?: string;
  gradientPreset?: string;
  customColors?: [string, string];
  title?: string;
  subtitle?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

/**
 * Frames a raw device video inside a 4K vector chassis and gradient backdrop using FFmpeg.
 * If FFmpeg is unavailable, throws an informative error.
 */
export async function frameVideoWithFfmpeg(options: FrameVideoOptions): Promise<Buffer> {
  const ffmpegAvailable = await hasFfmpeg();
  if (!ffmpegAvailable) {
    throw new Error(
      'FFmpeg is required for video mockup compositing. Install it via "winget install ffmpeg" (Windows) or "brew install ffmpeg" (macOS).'
    );
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adbsnap-video-'));
  const rawVideoPath = path.join(tmpDir, 'raw.mp4');
  const bgImagePath = path.join(tmpDir, 'bg.png');
  const bezelImagePath = path.join(tmpDir, 'bezel.png');
  const outputVideoPath = path.join(tmpDir, 'framed.mp4');

  try {
    fs.writeFileSync(rawVideoPath, options.videoBuffer);

    const canvasWidth = options.canvasWidth || 1290;
    const canvasHeight = options.canvasHeight || 2796;
    const bezelId = options.bezelId || 'iphone-16-pro';
    const spec: BezelSpec = BEZEL_PRESETS[bezelId] || BEZEL_PRESETS['iphone-16-pro'];

    // 1. Generate Backdrop Image
    const colors = options.customColors || (GRADIENT_PRESETS[options.gradientPreset || 'aurora']?.colors as [string, string]) || ['#4f46e5', '#06b6d4'];
    const gradientSvg = generateGradientSvg({
      canvasWidth,
      canvasHeight,
      colors,
      angle: 135,
    });
    const typographySvg = generateTypographySvg({
      canvasWidth,
      canvasHeight,
      title: options.title,
      subtitle: options.subtitle,
      typographyPosition: 'top',
    });

    const bgBuffer = await sharp(Buffer.from(gradientSvg))
      .composite([{ input: Buffer.from(typographySvg), left: 0, top: 0 }])
      .png()
      .toBuffer();
    fs.writeFileSync(bgImagePath, bgBuffer);

    // 2. Scale Phone Chassis and Calculate Placement
    const baseRatio = 0.74;
    const targetPhoneHeight = Math.round(canvasHeight * baseRatio);
    const phoneScale = targetPhoneHeight / spec.height;
    const targetPhoneWidth = Math.round(spec.width * phoneScale);
    const phoneLeft = Math.round((canvasWidth - targetPhoneWidth) / 2);
    const phoneTop = Math.round(canvasHeight - targetPhoneHeight + 120);

    // Screen video coordinates within the canvas
    const screenX = Math.round(phoneLeft + spec.screen.x * phoneScale);
    const screenY = Math.round(phoneTop + spec.screen.y * phoneScale);
    const screenW = Math.round(spec.screen.width * phoneScale);
    const screenH = Math.round(spec.screen.height * phoneScale);

    // Generate isolated Bezel SVG overlay
    const bezelSvg = generateBezelSvg({ spec });
    const bezelBuffer = await sharp(Buffer.from(bezelSvg))
      .resize(targetPhoneWidth, targetPhoneHeight)
      .png()
      .toBuffer();
    fs.writeFileSync(bezelImagePath, bezelBuffer);

    // 3. Composite using FFmpeg filter graph
    const ffmpegFilter = `[1:v]scale=${screenW}:${screenH}[vscreen];[0:v][vscreen]overlay=${screenX}:${screenY}[tmp];[tmp][2:v]overlay=${phoneLeft}:${phoneTop}`;

    await new Promise<void>((resolve, reject) => {
      execFile(
        'ffmpeg',
        [
          '-y',
          '-loop', '1', '-i', bgImagePath,
          '-i', rawVideoPath,
          '-loop', '1', '-i', bezelImagePath,
          '-filter_complex', ffmpegFilter,
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-shortest',
          '-preset', 'fast',
          outputVideoPath,
        ],
        { timeout: 90_000 },
        (err, _stdout, stderr) => {
          if (err) {
            reject(new Error(`FFmpeg framing failed: ${stderr || err.message}`));
          } else {
            resolve();
          }
        }
      );
    });

    return fs.readFileSync(outputVideoPath);
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
