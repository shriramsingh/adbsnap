import type { BezelSpec } from '../constants/themes';

export interface BezelRenderOptions {
  spec: BezelSpec;
  finishColor?: string;
  borderColor?: string;
}

/**
 * Generates an ultra-high resolution vector SVG frame for a given phone specification.
 */
export function generateBezelSvg(options: BezelRenderOptions): string {
  const { spec } = options;
  const finish = options.finishColor || '#1c1c1e';
  const border = options.borderColor || '#3a3a3c';

  let hardwareDetails = '';

  // Render Dynamic Island for iPhone
  if (spec.island) {
    hardwareDetails += `
      <rect x="${spec.island.x}" y="${spec.island.y}" 
            width="${spec.island.width}" height="${spec.island.height}" 
            rx="${spec.island.radius}" fill="#000000" />
      <circle cx="${spec.island.x + spec.island.width - 24}" cy="${spec.island.y + spec.island.height / 2}" r="6" fill="#111111" />
    `;
  }

  // Render Punch Hole for Pixel
  if (spec.punchHole) {
    hardwareDetails += `
      <circle cx="${spec.punchHole.cx}" cy="${spec.punchHole.cy}" r="${spec.punchHole.r}" fill="#000000" />
      <circle cx="${spec.punchHole.cx}" cy="${spec.punchHole.cy}" r="${spec.punchHole.r - 4}" fill="#0a0a0a" />
    `;
  }

  // Speaker ear-piece micro slit
  const speakerX = spec.width / 2 - 36;
  const speakerY = 12;
  const speakerWidth = 72;
  const speakerHeight = 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}">
    <defs>
      <!-- Titanium edge gradient -->
      <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${border}" />
        <stop offset="50%" stop-color="#555558" />
        <stop offset="100%" stop-color="${border}" />
      </linearGradient>

      <!-- Screen Cutout Mask -->
      <mask id="screenCutout">
        <!-- White reveals, black cuts out -->
        <rect width="${spec.width}" height="${spec.height}" fill="#ffffff" />
        <rect x="${spec.screen.x}" y="${spec.screen.y}" 
              width="${spec.screen.width}" height="${spec.screen.height}" 
              rx="${spec.screen.radius}" fill="#000000" />
      </mask>
    </defs>

    <!-- Outer Bezel Chassis with Screen Cutout -->
    <rect x="0" y="0" width="${spec.width}" height="${spec.height}" 
          rx="${spec.screen.radius + 12}" fill="${finish}" 
          stroke="url(#edgeGrad)" stroke-width="6" 
          mask="url(#screenCutout)" />

    <!-- Speaker Slit -->
    <rect x="${speakerX}" y="${speakerY}" width="${speakerWidth}" height="${speakerHeight}" rx="2" fill="#2a2a2c" />

    <!-- Hardware Camera / Island -->
    ${hardwareDetails}
  </svg>`;
}

/**
 * Generates an SVG mask to round the corners of a raw screenshot to fit the bezel.
 */
export function generateScreenCornerMask(width: number, height: number, radius: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="#ffffff" />
  </svg>`;
}
