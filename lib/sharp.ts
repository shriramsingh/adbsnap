import sharp, { type OverlayOptions } from 'sharp';
import { BEZEL_PRESETS, GRADIENT_PRESETS, LAYOUT_PRESETS, FONT_PRESETS, STORE_TARGETS, type BezelSpec, type LayoutMode, type StoreTarget } from '../constants/themes';
import { generateBezelSvg, generateScreenCornerMask, generateStudioShadowSvg } from './bezel-generator';
import { generateGradientSvg, generateTypographySvg } from './backdrop-generator';

export interface CompositeFrameOptions {
  screenshotBuffer: Buffer;
  bezelId?: string;
  gradientPreset?: string;
  customColors?: string[];
  gradientAngle?: number;
  layout?: LayoutMode;
  font?: string;
  title?: string;
  subtitle?: string;
  showStarBadge?: boolean;
  typographyPosition?: 'top' | 'bottom';
  canvasWidth?: number;
  canvasHeight?: number;
  phoneTopOffset?: number;
  fit?: 'cover' | 'contain' | 'fill';
}



export interface CompositeResult {
  buffer: Buffer;
  width: number;
  height: number;
  elapsedMs: number;
}

/**
 * Composites a raw screenshot buffer into a high-resolution framed marketing asset.
 * Runs 100% in-memory with zero temporary disk writes.
 */
export async function compositeFrame(options: CompositeFrameOptions): Promise<CompositeResult> {
  const startTime = performance.now();

  const canvasWidth = options.canvasWidth || 1290;
  const canvasHeight = options.canvasHeight || 2796;
  const typographyPosition = options.typographyPosition || 'top';

  // 1. Resolve Bezel Specification
  const bezelId = options.bezelId || 'iphone-16-pro';
  const spec: BezelSpec = BEZEL_PRESETS[bezelId] || BEZEL_PRESETS['iphone-16-pro'];

  // 2. Resolve Gradient Colors & Theme Contrast
  let colors: string[] = ['#4f46e5', '#06b6d4', '#10b981'];
  let angle = options.gradientAngle ?? 135;
  let isDarkTheme = true;

  if (options.customColors && options.customColors.length >= 2) {
    colors = options.customColors;
  } else if (options.gradientPreset && GRADIENT_PRESETS[options.gradientPreset]) {
    const preset = GRADIENT_PRESETS[options.gradientPreset];
    colors = [...preset.colors];
    angle = options.gradientAngle ?? preset.angle;
    isDarkTheme = preset.isDark ?? true;
  }

  // 3. Resize and corner-mask raw screenshot to fit bezel screen cutout
  const fitMode = options.fit || 'cover';
  const resizedScreen = await sharp(options.screenshotBuffer)
    .resize(spec.screen.width, spec.screen.height, {
      fit: fitMode,
      position: 'top',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toBuffer();

  const cornerMaskSvg = generateScreenCornerMask(spec.screen.width, spec.screen.height, spec.screen.radius);
  const cornerMaskBuffer = Buffer.from(cornerMaskSvg);

  const roundedScreen = await sharp(resizedScreen)
    .composite([{ input: cornerMaskBuffer, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 4 & 5. Assemble Phone Device (Masked Screen + Optional Bezel Hardware or Studio Shadow)
  let phoneDeviceBuffer: Buffer;
  let deviceCanvasWidth = spec.width;
  let deviceCanvasHeight = spec.height;

  if (spec.isFrameless || spec.id === 'none') {
    // Pure Floating Screen: no hardware chassis, realistic studio drop shadow
    const shadowPad = 60;
    deviceCanvasWidth = spec.screen.width + shadowPad * 2;
    deviceCanvasHeight = spec.screen.height + shadowPad * 2;
    const shadowSvg = generateStudioShadowSvg(spec.screen.width, spec.screen.height, spec.screen.radius);
    const shadowBuffer = Buffer.from(shadowSvg);

    phoneDeviceBuffer = await sharp({
      create: {
        width: deviceCanvasWidth,
        height: deviceCanvasHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: shadowBuffer, left: 0, top: 0 },
        { input: roundedScreen, left: shadowPad, top: shadowPad - 4 },
      ])
      .png()
      .toBuffer();
  } else {
    // Hardware Chassis Frame
    const bezelSvg = generateBezelSvg({ spec });
    const bezelBuffer = Buffer.from(bezelSvg);

    phoneDeviceBuffer = await sharp({
      create: {
        width: spec.width,
        height: spec.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: roundedScreen, left: spec.screen.x, top: spec.screen.y },
        { input: bezelBuffer, left: 0, top: 0 },
      ])
      .png()
      .toBuffer();
  }

  // If "None (Raw Screenshot)" theme preset is active:
  // Bypass gradient canvas, marketing headers, subheaders, and layout padding.
  if (options.gradientPreset === 'none') {
    if (spec.isFrameless || spec.id === 'none') {
      const rawPng = await sharp(options.screenshotBuffer).png().toBuffer();
      const meta = await sharp(rawPng).metadata();
      return {
        buffer: rawPng,
        width: meta.width || spec.screen.width,
        height: meta.height || spec.screen.height,
        elapsedMs: Math.round(performance.now() - startTime),
      };
    }

    const meta = await sharp(phoneDeviceBuffer).metadata();
    return {
      buffer: phoneDeviceBuffer,
      width: meta.width || spec.width,
      height: meta.height || spec.height,
      elapsedMs: Math.round(performance.now() - startTime),
    };
  }

  // 6. Responsive Phone Sizing to guarantee title headroom on all screen ratios (16:9, 19.5:9, 4:3, etc.)
  const layout = options.layout || 'appstore';
  const targetRatio = layout === 'appstore' ? 0.74 : 0.66;
  let targetPhoneHeight = Math.round(canvasHeight * targetRatio);
  const maxAllowedWidth = Math.round(canvasWidth * 0.88);

  if ((targetPhoneHeight / deviceCanvasHeight) * deviceCanvasWidth > maxAllowedWidth) {
    targetPhoneHeight = Math.round((maxAllowedWidth / deviceCanvasWidth) * deviceCanvasHeight);
  }

  const phoneScale = targetPhoneHeight / deviceCanvasHeight;
  const targetPhoneWidth = Math.round(deviceCanvasWidth * phoneScale);

  const scaledPhoneBuffer = await sharp(phoneDeviceBuffer)
    .resize(targetPhoneWidth, targetPhoneHeight)
    .png()
    .toBuffer();

  // 7. Calculate Placement
  const phoneLeft = Math.round((canvasWidth - targetPhoneWidth) / 2);
  const layoutPreset = LAYOUT_PRESETS[layout] || LAYOUT_PRESETS.appstore;
  const defaultPhoneTop = layoutPreset.phoneTop(canvasHeight, targetPhoneHeight);
  const phoneTop = options.phoneTopOffset ?? defaultPhoneTop;

  // 8. Generate Gradient Backdrop SVG
  const gradientSvg = generateGradientSvg({
    canvasWidth,
    canvasHeight,
    colors,
    angle,
  });
  const gradientBaseBuffer = Buffer.from(gradientSvg);

  // 9. Resolve Font Family & Generate Typography Overlay SVG (if requested)
  let fontFamily = FONT_PRESETS.modern.family;
  if (options.font) {
    if (FONT_PRESETS[options.font]) {
      fontFamily = FONT_PRESETS[options.font].family;
    } else {
      fontFamily = options.font;
    }
  }

  const typographySvg = generateTypographySvg({
    canvasWidth,
    canvasHeight,
    title: options.title,
    subtitle: options.subtitle,
    showStarBadge: options.showStarBadge,
    position: typographyPosition,
    isDarkTheme,
    fontFamily,
  });

  const compositeLayers: OverlayOptions[] = [
    { input: scaledPhoneBuffer, left: phoneLeft, top: phoneTop },
  ];

  if (typographySvg) {
    compositeLayers.push({
      input: Buffer.from(typographySvg),
      left: 0,
      top: 0,
    });
  }


  // 9. Composite everything onto canvas in a single Sharp pass
  const finalBuffer = await sharp(gradientBaseBuffer)
    .composite(compositeLayers)
    .flatten({ background: { r: 10, g: 11, b: 14 } })
    .toColorspace('srgb')
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  const elapsedMs = Math.round(performance.now() - startTime);

  return {
    buffer: finalBuffer,
    width: canvasWidth,
    height: canvasHeight,
    elapsedMs,
  };
}

export interface MultiStoreExportOptions extends Omit<CompositeFrameOptions, 'canvasWidth' | 'canvasHeight'> {
  storeFilter?: 'apple' | 'google' | 'all';
  targetIds?: string[];
}

export interface StoreExportOutput {
  target: StoreTarget;
  buffer: Buffer;
  width: number;
  height: number;
  elapsedMs: number;
}

/**
 * Generates marketing graphics for multiple store display resolutions in sequence.
 * Runs 100% in-memory with zero disk temporary files.
 */
export async function exportMultiStore(options: MultiStoreExportOptions): Promise<StoreExportOutput[]> {
  const filter = options.storeFilter || 'all';
  const targets = Object.values(STORE_TARGETS).filter((t) => {
    if (options.targetIds && options.targetIds.length > 0) {
      return options.targetIds.includes(t.id);
    }
    if (filter === 'all') return true;
    return t.store === filter;
  });

  const results: StoreExportOutput[] = [];

  for (const target of targets) {
    const single = await compositeFrame({
      ...options,
      canvasWidth: target.width,
      canvasHeight: target.height,
    });

    results.push({
      target,
      buffer: single.buffer,
      width: single.width,
      height: single.height,
      elapsedMs: single.elapsedMs,
    });
  }

  return results;
}

/**
 * Assembles multiple frame buffers into an ultra-lightweight animated GIF slideshow.
 * Uses gifenc to produce a true multi-frame looping GIF with per-frame quantization.
 */
export async function createAnimatedGif(
  frameBuffers: Buffer[],
  delayMs: number = 1800,
  targetWidth: number = 640
): Promise<Buffer> {
  if (frameBuffers.length === 0) {
    throw new Error('At least one frame buffer is required to generate a GIF');
  }

  const firstMeta = await sharp(frameBuffers[0]).metadata();
  const aspect = (firstMeta.height || 1) / (firstMeta.width || 1);
  const w = targetWidth;
  const h = Math.round(w * aspect);

  // Dynamically import gifenc to support both Node ESM and CJS bundling without top-level crash
  // @ts-ignore
  const gifencModule = await import('gifenc');
  const { GIFEncoder, quantize, applyPalette } = (gifencModule as any).default || gifencModule;
  const gif = GIFEncoder();

  for (const buf of frameBuffers) {
    const rawRgba = await sharp(buf)
      .resize(w, h, { fit: 'contain', background: { r: 10, g: 11, b: 14, alpha: 1 } })
      .ensureAlpha()
      .raw()
      .toBuffer();

    const palette = quantize(rawRgba, 256);
    const index = applyPalette(rawRgba, palette);
    gif.writeFrame(index, w, h, { palette, delay: delayMs, repeat: 0 });
  }

  gif.finish();
  return Buffer.from(gif.bytes());
}


