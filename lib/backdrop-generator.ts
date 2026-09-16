export interface BackdropOptions {
  canvasWidth: number;
  canvasHeight: number;
  colors: string[];
  angle?: number;
}

export interface TypographyOptions {
  canvasWidth: number;
  canvasHeight: number;
  title?: string;
  subtitle?: string;
  showStarBadge?: boolean;
  position?: 'top' | 'bottom';
  isDarkTheme?: boolean;
  fontFamily?: string;
}

/**
 * Generates an ultra-crisp SVG linear/radial gradient canvas background.
 */
export function generateGradientSvg(options: BackdropOptions): string {
  const { canvasWidth, canvasHeight, colors, angle = 135 } = options;

  // Convert angle (degrees) to SVG linearGradient x1, y1, x2, y2
  const rad = (angle * Math.PI) / 180;
  const x1 = Math.round(50 - Math.cos(rad) * 50);
  const y1 = Math.round(50 - Math.sin(rad) * 50);
  const x2 = Math.round(50 + Math.cos(rad) * 50);
  const y2 = Math.round(50 + Math.sin(rad) * 50);

  const stops = colors
    .map((c, i) => {
      const offset = Math.round((i / (colors.length - 1)) * 100);
      return `<stop offset="${offset}%" stop-color="${c}" />`;
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
    <defs>
      <linearGradient id="bgGrad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
        ${stops}
      </linearGradient>
    </defs>
    <rect width="${canvasWidth}" height="${canvasHeight}" fill="url(#bgGrad)" />
  </svg>`;
}

/**
 * Generates an SVG typography overlay with headlines, subtitles, and rating chips.
 */
export function generateTypographySvg(options: TypographyOptions): string {
  const { canvasWidth, canvasHeight, title, subtitle, showStarBadge, position = 'top', isDarkTheme = true, fontFamily } = options;
  if (!title && !subtitle && !showStarBadge) return '';

  const font = fontFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif";
  const scale = Math.min(canvasWidth / 1290, canvasHeight / 2796);
  const startY = position === 'top' ? Math.round(140 * scale) : Math.round((canvasHeight - 340) * scale);
  let content = '';
  let currentY = startY;

  const titleColor = isDarkTheme ? '#ffffff' : '#0f172a';
  const subtitleColor = isDarkTheme ? 'rgba(255,255,255,0.85)' : '#334155';
  const badgeBg = isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.06)';
  const badgeBorder = isDarkTheme ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.12)';
  const starColor = isDarkTheme ? '#facc15' : '#d97706';
  const badgeTextColor = isDarkTheme ? '#ffffff' : '#0f172a';

  if (showStarBadge) {
    const badgeWidth = Math.round(280 * scale);
    const badgeHeight = Math.round(48 * scale);
    const badgeRadius = Math.round(24 * scale);
    const badgeFontSize = Math.max(14, Math.round(20 * scale));
    const badgeTextY = Math.round(31 * scale);
    const badgeX = (canvasWidth - badgeWidth) / 2;
    content += `
      <g transform="translate(${badgeX}, ${currentY})">
        <rect width="${badgeWidth}" height="${badgeHeight}" rx="${badgeRadius}" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="2" />
        <text x="${badgeWidth / 2}" y="${badgeTextY}" text-anchor="middle" font-family="${font}" font-size="${badgeFontSize}" font-weight="bold" fill="${starColor}">
          ★★★★★ <tspan fill="${badgeTextColor}" font-weight="600">5.0 RATED</tspan>
        </text>
      </g>
    `;
    currentY += Math.round(70 * scale);
  }

  if (title) {
    const titleSize = Math.max(34, Math.round(62 * scale));
    const maxTitleChars = Math.max(18, Math.round(22 * (canvasWidth / 1290)));
    const titleLines = wrapText(title, maxTitleChars);
    const lineHeight = Math.round(titleSize * 1.15);

    let titleTspans = '';
    titleLines.forEach((line, idx) => {
      titleTspans += `<tspan x="${canvasWidth / 2}" ${idx > 0 ? `dy="${lineHeight}"` : ''}>${escapeXml(line)}</tspan>`;
    });

    content += `
      <text x="${canvasWidth / 2}" y="${currentY + Math.round(45 * scale)}" text-anchor="middle" 
            font-family="${font}" 
            font-size="${titleSize}" font-weight="800" fill="${titleColor}" letter-spacing="-1">
        ${titleTspans}
      </text>
    `;
    currentY += Math.round(45 * scale) + (titleLines.length - 1) * lineHeight + Math.round(25 * scale);
  }

  if (subtitle) {
    const subtitleSize = Math.max(18, Math.round(28 * scale));
    const maxSubChars = Math.max(28, Math.round(36 * (canvasWidth / 1290)));
    const subLines = wrapText(subtitle, maxSubChars);
    const lineHeight = Math.round(subtitleSize * 1.25);

    let subTspans = '';
    subLines.forEach((line, idx) => {
      subTspans += `<tspan x="${canvasWidth / 2}" ${idx > 0 ? `dy="${lineHeight}"` : ''}>${escapeXml(line)}</tspan>`;
    });

    content += `
      <text x="${canvasWidth / 2}" y="${currentY + Math.round(20 * scale)}" text-anchor="middle" 
            font-family="${font}" 
            font-size="${subtitleSize}" font-weight="500" fill="${subtitleColor}">
        ${subTspans}
      </text>
    `;
  }

  const shadowOpacity = isDarkTheme ? '0.3' : '0.08';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
    <defs>
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="${shadowOpacity}" />
      </filter>
    </defs>
    <g filter="url(#dropShadow)">
      ${content}
    </g>
  </svg>`;
}

function wrapText(text: string, maxCharsPerLine: number = 24): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
