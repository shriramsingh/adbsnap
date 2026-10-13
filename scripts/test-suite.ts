import { compositeFrame } from '../lib/sharp.js';
import { BEZEL_PRESETS, ASPECT_RATIO_PRESETS, type CanvasAspectRatio } from '../constants/themes.js';
import { MOCK_DEVICES } from '../mocks/mock-devices.js';
import { logger } from '../utils/logger.js';
import sharp from 'sharp';

async function runTestSuite() {
  logger.banner('ADBSnap Test Suite', 'Multi-Platform Aspect Ratios & Chassis Verification');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      passed++;
      logger.success(`[PASS] ${testName}`);
    } else {
      logger.error('CRITICAL_ERROR', `[FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // Generate a synthetic 1080x2400 test mobile screenshot
  const testScreenBuffer = await sharp({
    create: {
      width: 1080,
      height: 2400,
      channels: 4,
      background: { r: 56, g: 189, b: 248, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  // Test 1: Verify All 3 Multi-Platform Canvas Aspect Ratios
  const aspectRatios: CanvasAspectRatio[] = ['portrait', 'landscape', 'square'];

  for (const ar of aspectRatios) {
    const expected = ASPECT_RATIO_PRESETS[ar];
    const res = await compositeFrame({
      screenshotBuffer: testScreenBuffer,
      aspectRatio: ar,
      bezelId: 'iphone-16-pro',
      gradientPreset: 'aurora',
      title: `Showcase in ${expected.shortLabel}`,
      subtitle: `Verified multi-store resolution: ${expected.width}x${expected.height}`,
      format: 'png',
    });

    assert(
      res.width === expected.width && res.height === expected.height,
      `Aspect Ratio Preset: ${expected.name} (${res.width}x${res.height})`
    );
  }

  // Test 2: Verify 2026 Flagship Hardware Bezels
  const flagshipModels = ['iphone-16-pro-max', 'pixel-9-pro-fold', 'galaxy-s25-ultra', 'ipad-pro-13'];
  for (const model of flagshipModels) {
    const spec = BEZEL_PRESETS[model];
    assert(Boolean(spec && spec.width > 0 && spec.height > 0), `Bezel Specification Loaded: ${spec?.name || model}`);

    const res = await compositeFrame({
      screenshotBuffer: testScreenBuffer,
      bezelId: model,
      gradientPreset: 'cleanDark',
      title: 'Flagship Chassis Test',
      format: 'webp',
    });
    assert(res.buffer.length > 1000, `Chassis Assembly Output: ${model} WebP Buffer (${Math.round(res.buffer.length / 1024)} KB)`);
  }

  // Test 3: Next-Gen Output Formats (WebP, AVIF, PNG)
  const formats = ['png', 'webp', 'avif'] as const;
  for (const fmt of formats) {
    const res = await compositeFrame({
      screenshotBuffer: testScreenBuffer,
      aspectRatio: 'square',
      format: fmt,
      title: `${fmt.toUpperCase()} Format Test`,
    });
    assert(res.buffer.length > 500, `Output Format Compression: ${fmt.toUpperCase()} (${Math.round(res.buffer.length / 1024)} KB)`);
  }

  // Test 4: Device Discovery Mock Fixtures
  assert(MOCK_DEVICES.length >= 2, `Mock Devices Available: ${MOCK_DEVICES.length} attached devices simulated`);

  console.log('\n========================================');
  logger.info(`Results: ${passed}/${total} checks passed successfully.`);
  console.log('========================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
