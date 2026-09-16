// 1x1 transparent/red sample valid PNG buffer for offline pipeline verification
const MINIMAL_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export function getMockScreenshotBuffer(): Buffer {
  return Buffer.from(MINIMAL_PNG_BASE64, 'base64');
}

export const MOCK_SCREEN_METADATA = {
  width: 1080,
  height: 2400,
  orientation: 'portrait' as const,
  sizeKb: 1420,
};
