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

  // Render Classic Apple Notch
  if (spec.notch) {
    const notchX = (spec.width - spec.notch.width) / 2;
    hardwareDetails += `
      <path d="M ${notchX} 0 
               L ${notchX + spec.notch.width} 0 
               L ${notchX + spec.notch.width - 6} ${spec.notch.height} 
               Q ${notchX + spec.notch.width - 14} ${spec.notch.height + 4} ${notchX + spec.notch.width - 20} ${spec.notch.height + 4}
               L ${notchX + 20} ${spec.notch.height + 4}
               Q ${notchX + 14} ${spec.notch.height + 4} ${notchX + 6} ${spec.notch.height}
               Z" fill="#000000" />
      <circle cx="${spec.width / 2 + 45}" cy="${spec.notch.height / 2}" r="5" fill="#111111" />
      <rect x="${spec.width / 2 - 25}" y="10" width="50" height="4" rx="2" fill="#222222" />
    `;
  }

  // Render Punch Hole for Pixel & Samsung
  if (spec.punchHole) {
    hardwareDetails += `
      <circle cx="${spec.punchHole.cx}" cy="${spec.punchHole.cy}" r="${spec.punchHole.r}" fill="#000000" />
      <circle cx="${spec.punchHole.cx}" cy="${spec.punchHole.cy}" r="${spec.punchHole.r - 4}" fill="#0a0a0a" />
    `;
  }

  // Speaker ear-piece micro slit (skip for tablets and frameless)
  const isTablet = spec.category === 'tablet';
  const speakerX = spec.width / 2 - 36;
  const speakerY = 12;
  const speakerWidth = 72;
  const speakerHeight = 4;
  const speakerSlit = !isTablet ? `<rect x="${speakerX}" y="${speakerY}" width="${speakerWidth}" height="${speakerHeight}" rx="2" fill="#2a2a2c" />` : '';

  // Outer corner radius: Galaxy Ultra models have sharp boxy corners
  const isSharpCorner = spec.id.includes('ultra');
  const outerCornerRadius = isSharpCorner ? spec.screen.radius + 4 : spec.screen.radius + 12;

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
          rx="${outerCornerRadius}" fill="${finish}" 
          stroke="url(#edgeGrad)" stroke-width="6" 
          mask="url(#screenCutout)" />

    <!-- Speaker Slit -->
    ${speakerSlit}

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

/**
 * Generates a realistic studio drop shadow SVG for floating borderless screens.
 */
export function generateStudioShadowSvg(width: number, height: number, radius: number): string {
  const pad = 60;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width + pad * 2}" height="${height + pad * 2}" viewBox="0 0 ${width + pad * 2} ${height + pad * 2}">
    <defs>
      <filter id="studioShadow" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#000000" flood-opacity="0.55" />
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.35" />
      </filter>
    </defs>
    <rect x="${pad}" y="${pad - 4}" width="${width}" height="${height}" rx="${radius}" fill="#000000" filter="url(#studioShadow)" />
  </svg>`;
}
