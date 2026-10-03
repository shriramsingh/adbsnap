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
  footer?: string;
  showStarBadge?: boolean;
  position?: 'top' | 'bottom' | 'both';
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
 * Supports multi-line headlines, automatic downscaling, and 'top', 'bottom', or 'both' positioning.
 */
export function generateTypographySvg(options: TypographyOptions): string {
  const {
    canvasWidth,
    canvasHeight,
    title,
    subtitle,
    footer,
    showStarBadge,
    position = 'top',
    isDarkTheme = true,
    fontFamily,
  } = options;

  if (!title && !subtitle && !footer && !showStarBadge) return '';

  const font = fontFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif";
  const scale = Math.min(canvasWidth / 1290, canvasHeight / 2796);
  const centerX = canvasWidth / 2;

  const titleColor = isDarkTheme ? '#ffffff' : '#0f172a';
  const subtitleColor = isDarkTheme ? 'rgba(255,255,255,0.85)' : '#334155';

  let content = '';

  // 1. Prepare Title Lines and Dynamic Sizing
  const maxTitleChars = Math.max(18, Math.round(22 * (canvasWidth / 1290)));
  const titleLines = title ? wrapText(title, maxTitleChars) : [];
  const lineCount = titleLines.length;
  const titleScaleFactor = lineCount > 2 ? Math.max(0.68, 1 - (lineCount - 2) * 0.12) : 1;
  const titleSize = Math.max(26, Math.round(62 * scale * titleScaleFactor));
  const titleLineHeight = Math.round(titleSize * 1.15);

  // 2. Prepare Subtitle Lines
  const maxSubChars = Math.max(28, Math.round(36 * (canvasWidth / 1290)));
  const subtitleLines = subtitle ? wrapText(subtitle, maxSubChars) : [];
  const subtitleSize = Math.max(16, Math.round(28 * scale));
  const subtitleLineHeight = Math.round(subtitleSize * 1.25);

  // Helper for Star Rating Chip
  const renderBadge = (y: number) => {
    const badgeWidth = Math.round(280 * scale);
    const badgeHeight = Math.round(48 * scale);
    const badgeRadius = Math.round(24 * scale);
    const badgeFontSize = Math.max(14, Math.round(20 * scale));
    const badgeTextY = Math.round(31 * scale);
    const badgeX = (canvasWidth - badgeWidth) / 2;
    const badgeBg = isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.06)';
    const badgeBorder = isDarkTheme ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.12)';
    const starColor = isDarkTheme ? '#facc15' : '#d97706';
    const badgeTextColor = isDarkTheme ? '#ffffff' : '#0f172a';

    return {
      svg: `
        <g transform="translate(${badgeX}, ${y})">
          <rect width="${badgeWidth}" height="${badgeHeight}" rx="${badgeRadius}" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="2" />
          <text x="${badgeWidth / 2}" y="${badgeTextY}" text-anchor="middle" font-family="${font}" font-size="${badgeFontSize}" font-weight="bold" fill="${starColor}">
            ★★★★★ <tspan fill="${badgeTextColor}" font-weight="600">5.0 RATED</tspan>
          </text>
        </g>
      `,
      height: badgeHeight + Math.round(22 * scale),
    };
  };

  // Helper for Text Block
  const renderText = (lines: string[], fontSize: number, lineHeight: number, fontWeight: string, color: string, y: number, letterSpacing = 'normal') => {
    if (lines.length === 0) return { svg: '', height: 0 };
    let tspans = '';
    lines.forEach((line, idx) => {
      tspans += `<tspan x="${centerX}" ${idx > 0 ? `dy="${lineHeight}"` : ''}>${escapeXml(line)}</tspan>`;
    });

    const blockHeight = fontSize + (lines.length - 1) * lineHeight;
    const svg = `
      <text x="${centerX}" y="${y + fontSize}" text-anchor="middle" 
            font-family="${font}" 
            font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}" letter-spacing="${letterSpacing}">
        ${tspans}
      </text>
    `;
    return { svg, height: blockHeight };
  };

  // POSITION: TOP (Default)
  if (position === 'top') {
    let currentY = Math.round(130 * scale);

    if (showStarBadge) {
      const badge = renderBadge(currentY);
      content += badge.svg;
      currentY += badge.height;
    }

    if (titleLines.length > 0) {
      const titleBlock = renderText(titleLines, titleSize, titleLineHeight, '800', titleColor, currentY, '-1');
      content += titleBlock.svg;
      currentY += titleBlock.height + Math.round(22 * scale);
    }

    if (subtitleLines.length > 0) {
      const subBlock = renderText(subtitleLines, subtitleSize, subtitleLineHeight, '500', subtitleColor, currentY);
      content += subBlock.svg;
    }
  }

  // POSITION: BOTTOM (Store copy under phone chassis)
  else if (position === 'bottom') {
    // Calculate total height required
    let totalHeight = 0;
    if (showStarBadge) totalHeight += Math.round(70 * scale);
    if (titleLines.length > 0) totalHeight += titleSize + (titleLines.length - 1) * titleLineHeight + Math.round(18 * scale);
    if (subtitleLines.length > 0) totalHeight += subtitleSize + (subtitleLines.length - 1) * subtitleLineHeight;

    const bottomPadding = Math.round(95 * scale);
    let currentY = Math.max(Math.round(canvasHeight * 0.64), canvasHeight - totalHeight - bottomPadding);

    if (showStarBadge) {
      const badge = renderBadge(currentY);
      content += badge.svg;
      currentY += badge.height;
    }

    if (titleLines.length > 0) {
      const titleBlock = renderText(titleLines, titleSize, titleLineHeight, '800', titleColor, currentY, '-1');
      content += titleBlock.svg;
      currentY += titleBlock.height + Math.round(20 * scale);
    }

    if (subtitleLines.length > 0) {
      const subBlock = renderText(subtitleLines, subtitleSize, subtitleLineHeight, '500', subtitleColor, currentY);
      content += subBlock.svg;
    }
  }

  // POSITION: BOTH (Top Headline/Badge + Bottom Subtitle/Callout)
  else if (position === 'both') {
    // TOP ZONE: Star Badge + Headline
    let topY = Math.round(120 * scale);
    if (showStarBadge) {
      const badge = renderBadge(topY);
      content += badge.svg;
      topY += badge.height;
    }

    if (titleLines.length > 0) {
      const titleBlock = renderText(titleLines, titleSize, titleLineHeight, '800', titleColor, topY, '-1');
      content += titleBlock.svg;
    }

    // BOTTOM ZONE: Subtitle or Footer Callout
    const bottomText = footer || subtitle || '';
    const bottomLines = bottomText ? wrapText(bottomText, maxSubChars) : [];
    if (bottomLines.length > 0) {
      const bottomBlockHeight = subtitleSize + (bottomLines.length - 1) * subtitleLineHeight;
      const bottomY = canvasHeight - Math.round(120 * scale) - bottomBlockHeight;
      const subBlock = renderText(bottomLines, subtitleSize, subtitleLineHeight, '600', subtitleColor, bottomY);
      content += subBlock.svg;
    }
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

/**
 * Splits text into wrapped lines, preserving explicit user newlines while wrapping paragraphs.
 */
export function wrapText(text: string, maxCharsPerLine: number = 24): string[] {
  if (!text) return [];
  const paragraphs = text.split(/\r?\n/);
  const result: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
        currentLine += ' ' + word;
      } else {
        result.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) result.push(currentLine);
  }

  return result.length > 0 ? result : [text.trim()];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

