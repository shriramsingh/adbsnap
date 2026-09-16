export interface PngMetadata {
  isValid: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  sizeBytes: number;
  sizeKb: number;
}

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function parsePngMetadata(buffer: Buffer): PngMetadata {
  if (!buffer || buffer.length < 24) {
    return { isValid: false, width: 0, height: 0, orientation: 'portrait', sizeBytes: 0, sizeKb: 0 };
  }

  const isMagicMatch = buffer.subarray(0, 8).equals(PNG_MAGIC);
  if (!isMagicMatch) {
    return { isValid: false, width: 0, height: 0, orientation: 'portrait', sizeBytes: buffer.length, sizeKb: Math.round(buffer.length / 1024) };
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const orientation = width <= height ? 'portrait' : 'landscape';

  return {
    isValid: true,
    width,
    height,
    orientation,
    sizeBytes: buffer.length,
    sizeKb: Math.round(buffer.length / 1024),
  };
}
