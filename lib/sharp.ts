import sharp, { type OverlayOptions } from 'sharp';
import { BEZEL_PRESETS, GRADIENT_PRESETS, LAYOUT_PRESETS, FONT_PRESETS, STORE_TARGETS, type BezelSpec, type LayoutMode, type StoreTarget } from '../constants/themes';
import { generateBezelSvg, generateScreenCornerMask, generateStudioShadowSvg } from './bezel-generator';
import { generateGradientSvg, generateTypographySvg, generateAmbientGlowSvg } from './backdrop-generator';

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
  footer?: string;
  eyebrowTag?: string;
  showStarBadge?: boolean;
  typographyPosition?: 'top' | 'bottom' | 'both';
  canvasWidth?: number;
  canvasHeight?: number;
  phoneTopOffset?: number;
  phoneScaleMultiplier?: number;
  headlineFont?: string;
  subtitleFont?: string;
  textAlign?: 'left' | 'center' | 'right';
  titleScaleMultiplier?: number;
  subtitleScaleMultiplier?: number;
  titleWeight?: '400' | '500' | '600' | '700' | '800' | '900';
  subtitleWeight?: '400' | '500' | '600' | '700';
  isItalic?: boolean;
  textYOffset?: number;
  customColors?: [string, string];
  enableAmbientGlow?: boolean;
  ambientGlowColor?: string;
  accentColors?: [string, string];
  fit?: 'cover' | 'contain' | 'fill';
  precomputedPhoneDeviceBuffer?: Buffer;
  format?: 'png' | 'webp' | 'avif' | 'jpeg';
  quality?: number;
}

export interface CompositeResult {
  buffer: Buffer;
  width: number;
  height: number;
  elapsedMs: number;
}

/**
 * Assembles a raw screenshot into the full vector device frame at native hardware resolution.
 * Cached and reused across multi-target store exports for extreme performance.
 */
export async function assemblePhoneDevice(
  screenshotBuffer: Buffer,
  spec: BezelSpec,
  fit: 'cover' | 'contain' | 'fill' = 'cover'
): Promise<Buffer> {
  const cornerMaskSvg = generateScreenCornerMask(spec.screen.width, spec.screen.height, spec.screen.radius);
  const cornerMaskBuffer = Buffer.from(cornerMaskSvg);

  const roundedScreen = await sharp(screenshotBuffer)
    .resize(spec.screen.width, spec.screen.height, {
      fit,
      position: 'top',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .composite([{ input: cornerMaskBuffer, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const isFramelessMode = Boolean(spec.isFrameless || spec.id === 'none');
  if (isFramelessMode) {
    const shadowPad = 60;
    const deviceWidth = spec.screen.width + shadowPad * 2;
    const deviceHeight = spec.screen.height + shadowPad * 2;
    const shadowSvg = generateStudioShadowSvg(spec.screen.width, spec.screen.height, spec.screen.radius);
    const shadowBuffer = Buffer.from(shadowSvg);

    return sharp({
      create: {
        width: deviceWidth,
        height: deviceHeight,
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
  }

  const bezelSvg = generateBezelSvg({ spec });
  const bezelBuffer = Buffer.from(bezelSvg);

  return sharp({
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

  // 3. Resolve Device Dimensions & Assemble Chassis Frame (or reuse precomputed)
  const fitMode = options.fit || 'cover';
  const isFramelessMode = Boolean(spec.isFrameless || spec.id === 'none');
  let deviceCanvasWidth = spec.width;
  let deviceCanvasHeight = spec.height;

  if (isFramelessMode) {
    const shadowPad = 60;
    deviceCanvasWidth = spec.screen.width + shadowPad * 2;
    deviceCanvasHeight = spec.screen.height + shadowPad * 2;
  }

  const phoneDeviceBuffer = options.precomputedPhoneDeviceBuffer || await assemblePhoneDevice(options.screenshotBuffer, spec, fitMode);

  // 4. Responsive Phone Sizing to guarantee title headroom on all screen ratios
  const layout = options.layout || 'appstore';
  const baseRatio = layout === 'appstore' ? 0.74 : 0.66;
  const scaleMult = options.phoneScaleMultiplier ? Math.max(0.4, Math.min(1.35, options.phoneScaleMultiplier)) : 1.0;
  const targetRatio = baseRatio * scaleMult;
  let targetPhoneHeight = Math.round(canvasHeight * targetRatio);
  const maxAllowedWidth = Math.round(canvasWidth * 0.94);

  if ((targetPhoneHeight / deviceCanvasHeight) * deviceCanvasWidth > maxAllowedWidth) {
    targetPhoneHeight = Math.round((maxAllowedWidth / deviceCanvasWidth) * deviceCanvasHeight);
  }

  const phoneScale = targetPhoneHeight / deviceCanvasHeight;
  const targetPhoneWidth = Math.round(deviceCanvasWidth * phoneScale);

  // 5. Scale Chassis to Canvas Dimensions
  const scaledPhoneBuffer = await sharp(phoneDeviceBuffer)
    .resize(targetPhoneWidth, targetPhoneHeight)
    .png()
    .toBuffer();

  // If "None (Raw Screenshot)" theme preset is active:
  if (options.gradientPreset === 'none') {
    if (isFramelessMode) {
      const rawPng = await sharp(options.screenshotBuffer).png().toBuffer();
      const meta = await sharp(rawPng).metadata();
      return {
        buffer: rawPng,
        width: meta.width || spec.screen.width,
        height: meta.height || spec.screen.height,
        elapsedMs: Math.round(performance.now() - startTime),
      };
    }

    const meta = await sharp(scaledPhoneBuffer).metadata();
    return {
      buffer: scaledPhoneBuffer,
      width: meta.width || targetPhoneWidth,
      height: meta.height || targetPhoneHeight,
      elapsedMs: Math.round(performance.now() - startTime),
    };
  }

  // 6. Calculate Placement
  const phoneLeft = Math.round((canvasWidth - targetPhoneWidth) / 2);
  let defaultPhoneTop: number;

  if (typographyPosition === 'bottom') {
    // Phone placed near top, bleeding top or high center, leaving generous headroom at bottom
    defaultPhoneTop = layout === 'appstore' ? Math.round(-80 * phoneScale) : Math.round(canvasHeight * 0.05);
  } else if (typographyPosition === 'both') {
    // Phone centered vertically between top headline and bottom footer
    defaultPhoneTop = Math.round((canvasHeight - targetPhoneHeight) / 2);
  } else {
    // Top typography (default)
    const layoutPreset = LAYOUT_PRESETS[layout] || LAYOUT_PRESETS.appstore;
    defaultPhoneTop = layoutPreset.phoneTop(canvasHeight, targetPhoneHeight);
  }

  const phoneTop = Math.round(defaultPhoneTop + (options.phoneTopOffset ?? 0));

  // 7. Generate Gradient Backdrop SVG
  const gradientSvg = generateGradientSvg({
    canvasWidth,
    canvasHeight,
    colors,
    angle,
  });
  const gradientBaseBuffer = Buffer.from(gradientSvg);

  // 8. Resolve Font Family & Generate Typography Overlay SVG (if requested)
  const resolveFont = (fontKey?: string): string => {
    if (!fontKey) return FONT_PRESETS.modern.family;
    if (FONT_PRESETS[fontKey]) return FONT_PRESETS[fontKey].family;
    return fontKey;
  };
  const headlineFontFamily = resolveFont(options.headlineFont || options.font);
  const subtitleFontFamily = resolveFont(options.subtitleFont || options.font || options.headlineFont);

  const typographySvg = generateTypographySvg({
    canvasWidth,
    canvasHeight,
    title: options.title,
    subtitle: options.subtitle,
    footer: options.footer,
    eyebrowTag: options.eyebrowTag,
    showStarBadge: options.showStarBadge,
    position: typographyPosition,
    isDarkTheme,
    fontFamily: headlineFontFamily,
    headlineFontFamily,
    subtitleFontFamily,
    textAlign: options.textAlign,
    titleScaleMultiplier: options.titleScaleMultiplier,
    subtitleScaleMultiplier: options.subtitleScaleMultiplier,
    titleWeight: options.titleWeight,
    subtitleWeight: options.subtitleWeight,
    isItalic: options.isItalic,
    textYOffset: options.textYOffset,
    phoneTop,
    accentColors: options.accentColors,
  });

  const compositeLayers: OverlayOptions[] = [];

  // Ambient 3D Radial Mesh Glow layer behind phone chassis
  if (options.gradientPreset !== 'none' && options.enableAmbientGlow !== false) {
    const glowColor = options.ambientGlowColor || colors[0] || '#38bdf8';
    const glowRadius = Math.round(Math.max(targetPhoneWidth, targetPhoneHeight) * 0.52);
    const glowCenterY = Math.round(phoneTop + targetPhoneHeight * 0.45);
    const ambientGlowSvg = generateAmbientGlowSvg({
      canvasWidth,
      canvasHeight,
      centerX: Math.round(phoneLeft + targetPhoneWidth / 2),
      centerY: glowCenterY,
      radius: glowRadius,
      glowColor,
    });
    compositeLayers.push({
      input: Buffer.from(ambientGlowSvg),
      left: 0,
      top: 0,
    });
  }

  // Physical vector phone device chassis
  compositeLayers.push({ input: scaledPhoneBuffer, left: phoneLeft, top: phoneTop });

  // Marketing typography & pill badges overlay
  if (typographySvg) {
    compositeLayers.push({
      input: Buffer.from(typographySvg),
      left: 0,
      top: 0,
    });
  }

  // 9. Composite everything onto canvas in a single Sharp pass
  const outputFormat = options.format || 'png';
  const pipeline = sharp(gradientBaseBuffer)
    .composite(compositeLayers)
    .flatten({ background: { r: 10, g: 11, b: 14 } })
    .toColorspace('srgb');

  let finalBuffer: Buffer;
  if (outputFormat === 'webp') {
    finalBuffer = await pipeline
      .webp({ quality: options.quality || 90, effort: 4 })
      .toBuffer();
  } else if (outputFormat === 'avif') {
    finalBuffer = await pipeline
      .avif({ quality: options.quality || 85, effort: 4 })
      .toBuffer();
  } else if (outputFormat === 'jpeg') {
    finalBuffer = await pipeline
      .jpeg({ quality: options.quality || 90, mozjpeg: true })
      .toBuffer();
  } else {
    finalBuffer = await pipeline
      .png({ quality: options.quality || 95, compressionLevel: 6 })
      .toBuffer();
  }

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
 * Generates marketing graphics for multiple store display resolutions concurrently.
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

  const bezelId = options.bezelId || 'iphone-16-pro';
  const spec: BezelSpec = BEZEL_PRESETS[bezelId] || BEZEL_PRESETS['iphone-16-pro'];
  const fitMode = options.fit || 'cover';

  // Pre-assemble device chassis once for all target aspect ratios
  const precomputedPhoneDeviceBuffer = await assemblePhoneDevice(options.screenshotBuffer, spec, fitMode);

  return Promise.all(
    targets.map(async (target) => {
      const single = await compositeFrame({
        ...options,
        canvasWidth: target.width,
        canvasHeight: target.height,
        precomputedPhoneDeviceBuffer,
      });

      return {
        target,
        buffer: single.buffer,
        width: single.width,
        height: single.height,
        elapsedMs: single.elapsedMs,
      };
    })
  );
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


