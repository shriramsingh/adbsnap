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
  eyebrowTag?: string;
  showStarBadge?: boolean;
  position?: 'top' | 'bottom' | 'both';
  isDarkTheme?: boolean;
  fontFamily?: string;
  headlineFontFamily?: string;
  subtitleFontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  titleScaleMultiplier?: number;
  subtitleScaleMultiplier?: number;
  titleWeight?: '400' | '500' | '600' | '700' | '800' | '900';
  subtitleWeight?: '400' | '500' | '600' | '700';
  isItalic?: boolean;
  textYOffset?: number;
  bottomTextOffset?: number;
  phoneTop?: number;
  accentColors?: [string, string];
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
 * Generates a soft, diffuse ambient mesh radial glow positioned behind the device chassis.
 * Creates an illuminated, 3D floating effect with high visual depth.
 */
export function generateAmbientGlowSvg(options: {
  canvasWidth: number;
  canvasHeight: number;
  centerX: number;
  centerY: number;
  radius: number;
  glowColor?: string;
}): string {
  const { canvasWidth, canvasHeight, centerX, centerY, radius, glowColor = '#38bdf8' } = options;
  const blurStd = Math.round(radius * 0.22);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
    <defs>
      <radialGradient id="meshGlowGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.48" />
        <stop offset="35%" stop-color="${glowColor}" stop-opacity="0.25" />
        <stop offset="70%" stop-color="${glowColor}" stop-opacity="0.08" />
        <stop offset="100%" stop-color="${glowColor}" stop-opacity="0" />
      </radialGradient>
      <filter id="meshGlowBlur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="${blurStd}" />
      </filter>
    </defs>
    <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="url(#meshGlowGrad)" filter="url(#meshGlowBlur)" />
  </svg>`;
}

/**
 * Generates an SVG typography overlay with headlines, subtitles, and rating chips.
 * Supports keyword highlighting (**word**), eyebrow tags, auto-downscaling, and 3-way positioning.
 */
export function generateTypographySvg(options: TypographyOptions): string {
  const {
    canvasWidth,
    canvasHeight,
    title,
    subtitle,
    footer,
    eyebrowTag,
    showStarBadge,
    position = 'top',
    isDarkTheme = true,
    fontFamily,
    headlineFontFamily,
    subtitleFontFamily,
    textAlign = 'center',
    titleScaleMultiplier = 1.0,
    subtitleScaleMultiplier = 1.0,
    titleWeight = '800',
    subtitleWeight = '500',
    isItalic = false,
    textYOffset = 0,
    bottomTextOffset,
    phoneTop,
    accentColors = ['#38bdf8', '#c084fc'],
  } = options;

  if (!title && !subtitle && !footer && !showStarBadge && !eyebrowTag) return '';

  const defaultFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif";
  const hFont = headlineFontFamily || fontFamily || defaultFont;
  const sFont = subtitleFontFamily || fontFamily || defaultFont;
  const scale = Math.min(canvasWidth / 1290, canvasHeight / 2796);

  // Alignment coordinates
  const marginX = Math.round(90 * scale);
  const anchorX = textAlign === 'left' ? marginX : textAlign === 'right' ? canvasWidth - marginX : canvasWidth / 2;
  const textAnchor = textAlign === 'left' ? 'start' : textAlign === 'right' ? 'end' : 'middle';

  const titleColor = isDarkTheme ? '#ffffff' : '#0f172a';
  const subtitleColor = isDarkTheme ? 'rgba(255,255,255,0.85)' : '#334155';

  let content = '';

  // 1. Prepare Title Lines and Dynamic Sizing
  const tScale = Math.max(0.5, Math.min(1.8, titleScaleMultiplier));
  const maxTitleChars = Math.max(16, Math.round((22 / tScale) * (canvasWidth / 1290)));
  const titleLines = title ? wrapText(title, maxTitleChars) : [];
  const lineCount = titleLines.length;
  const titleScaleFactor = lineCount > 2 ? Math.max(0.68, 1 - (lineCount - 2) * 0.12) : 1;
  const titleSize = Math.max(22, Math.round(62 * scale * titleScaleFactor * tScale));
  const titleLineHeight = Math.round(titleSize * 1.16);

  // 2. Prepare Subtitle Lines
  const subScale = Math.max(0.5, Math.min(1.5, subtitleScaleMultiplier));
  const maxSubChars = Math.max(24, Math.round((36 / subScale) * (canvasWidth / 1290)));
  const subtitleLines = subtitle ? wrapText(subtitle, maxSubChars) : [];
  const subtitleSize = Math.max(14, Math.round(28 * scale * subScale));
  const subtitleLineHeight = Math.round(subtitleSize * 1.25);

  // Helper: Modern Eyebrow Tag Pill
  const renderEyebrow = (y: number) => {
    if (!eyebrowTag || !eyebrowTag.trim()) return { svg: '', height: 0 };
    const text = eyebrowTag.trim();
    const badgeFontSize = Math.max(12, Math.round(18 * scale));
    const paddingX = Math.round(22 * scale);
    const badgeHeight = Math.round(44 * scale);
    const badgeRadius = Math.round(22 * scale);
    const estTextWidth = Math.round(text.length * badgeFontSize * 0.65);
    const badgeWidth = estTextWidth + paddingX * 2;
    const badgeX = textAlign === 'left' ? marginX : textAlign === 'right' ? canvasWidth - marginX - badgeWidth : (canvasWidth - badgeWidth) / 2;
    const textY = Math.round(28 * scale);
    const tagBg = isDarkTheme ? 'rgba(56, 189, 248, 0.14)' : 'rgba(14, 165, 233, 0.10)';
    const tagBorder = isDarkTheme ? 'rgba(56, 189, 248, 0.45)' : 'rgba(14, 165, 233, 0.35)';
    const tagColor = isDarkTheme ? '#38bdf8' : '#0284c7';

    return {
      svg: `
        <g transform="translate(${badgeX}, ${y})">
          <rect width="${badgeWidth}" height="${badgeHeight}" rx="${badgeRadius}" fill="${tagBg}" stroke="${tagBorder}" stroke-width="1.5" />
          <text x="${badgeWidth / 2}" y="${textY}" text-anchor="middle" font-family="${hFont}" font-size="${badgeFontSize}" font-weight="700" fill="${tagColor}" letter-spacing="1.2">
            ${escapeXml(text)}
          </text>
        </g>
      `,
      height: badgeHeight + Math.round(16 * scale),
    };
  };

  // Helper: Star Rating Chip
  const renderBadge = (y: number) => {
    const badgeWidth = Math.round(280 * scale);
    const badgeHeight = Math.round(48 * scale);
    const badgeRadius = Math.round(24 * scale);
    const badgeFontSize = Math.max(14, Math.round(20 * scale));
    const badgeTextY = Math.round(31 * scale);
    const badgeX = textAlign === 'left' ? marginX : textAlign === 'right' ? canvasWidth - marginX - badgeWidth : (canvasWidth - badgeWidth) / 2;
    const badgeBg = isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.06)';
    const badgeBorder = isDarkTheme ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.12)';
    const starColor = isDarkTheme ? '#facc15' : '#d97706';
    const badgeTextColor = isDarkTheme ? '#ffffff' : '#0f172a';

    return {
      svg: `
        <g transform="translate(${badgeX}, ${y})">
          <rect width="${badgeWidth}" height="${badgeHeight}" rx="${badgeRadius}" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="2" />
          <text x="${badgeWidth / 2}" y="${badgeTextY}" text-anchor="middle" font-family="${hFont}" font-size="${badgeFontSize}" font-weight="bold" fill="${starColor}">
            ★★★★★ <tspan fill="${badgeTextColor}" font-weight="600">5.0 RATED</tspan>
          </text>
        </g>
      `,
      height: badgeHeight + Math.round(20 * scale),
    };
  };

  // Helper: Text Block with Markdown (**word** gradient & *italic* slanted)
  const renderText = (
    lines: string[],
    fontSize: number,
    lineHeight: number,
    fontWeight: string,
    color: string,
    y: number,
    targetFont: string,
    fontStyle: 'normal' | 'italic' = 'normal',
    letterSpacing = 'normal'
  ) => {
    if (lines.length === 0) return { svg: '', height: 0 };
    let tspans = '';

    lines.forEach((line, lineIdx) => {
      // Split into **bold gradient**, *italic*, and normal tokens
      const segments = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
      let isFirstTspanOfLine = true;

      for (const seg of segments) {
        if (!seg) continue;
        const isBoldGrad = seg.startsWith('**') && seg.endsWith('**');
        const isItalicToken = !isBoldGrad && seg.startsWith('*') && seg.endsWith('*');
        const cleanContent = isBoldGrad ? seg.slice(2, -2) : isItalicToken ? seg.slice(1, -1) : seg;

        const lineBreakAttrs = isFirstTspanOfLine
          ? `x="${anchorX}" ${lineIdx > 0 ? `dy="${lineHeight}"` : ''}`
          : '';

        if (isBoldGrad) {
          tspans += `<tspan ${lineBreakAttrs} fill="url(#textAccentGrad)" font-weight="900">${escapeXml(cleanContent)}</tspan>`;
        } else if (isItalicToken) {
          tspans += `<tspan ${lineBreakAttrs} fill="${color}" font-style="italic">${escapeXml(cleanContent)}</tspan>`;
        } else {
          tspans += `<tspan ${lineBreakAttrs} fill="${color}">${escapeXml(cleanContent)}</tspan>`;
        }

        isFirstTspanOfLine = false;
      }
    });

    const blockHeight = fontSize + (lines.length - 1) * lineHeight;
    const svg = `
      <text xml:space="preserve" x="${anchorX}" y="${y + fontSize}" text-anchor="${textAnchor}" 
            font-family="${targetFont}" 
            font-size="${fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" letter-spacing="${letterSpacing}">
        ${tspans}
      </text>
    `;
    return { svg, height: blockHeight };
  };

  const titleFontStyle = isItalic ? 'italic' : 'normal';

  // Compute total top content height for collision calculation
  const titleBlockHeight = titleLines.length > 0 ? titleSize + (titleLines.length - 1) * titleLineHeight : 0;
  const subBlockHeight = subtitleLines.length > 0 ? subtitleSize + (subtitleLines.length - 1) * subtitleLineHeight : 0;
  const badgeBlockHeight = (eyebrowTag ? Math.round(60 * scale) : 0) + (showStarBadge ? Math.round(68 * scale) : 0);
  const gapHeight = (titleLines.length > 0 && subtitleLines.length > 0 ? Math.round(20 * scale) : 0);
  const totalTopBlockHeight = badgeBlockHeight + titleBlockHeight + subBlockHeight + gapHeight;

  // POSITION: TOP (Default)
  if (position === 'top') {
    const defaultTopY = Math.round(110 * scale);
    let baseTopY = defaultTopY;

    // Smart Collision Protection sets safe base default against phoneTop
    if (phoneTop && phoneTop > 200) {
      const maxAllowedTopY = phoneTop - totalTopBlockHeight - Math.round(24 * scale);
      if (defaultTopY > maxAllowedTopY) {
        baseTopY = Math.max(Math.round(40 * scale), maxAllowedTopY);
      }
    }

    let currentY = baseTopY + textYOffset;

    if (eyebrowTag) {
      const tag = renderEyebrow(currentY);
      content += tag.svg;
      currentY += tag.height;
    }

    if (showStarBadge) {
      const badge = renderBadge(currentY);
      content += badge.svg;
      currentY += badge.height;
    }

    if (titleLines.length > 0) {
      const titleBlock = renderText(titleLines, titleSize, titleLineHeight, titleWeight, titleColor, currentY, hFont, titleFontStyle, '-1');
      content += titleBlock.svg;
      currentY += titleBlock.height + Math.round(20 * scale);
    }

    if (subtitleLines.length > 0) {
      const subBlock = renderText(subtitleLines, subtitleSize, subtitleLineHeight, subtitleWeight, subtitleColor, currentY, sFont);
      content += subBlock.svg;
    }
  }

  // POSITION: BOTTOM (Store copy under phone chassis)
  else if (position === 'bottom') {
    const bottomPadding = Math.round(85 * scale);
    const effBottomOffset = bottomTextOffset !== undefined ? bottomTextOffset : textYOffset;
    let currentY = canvasHeight - totalTopBlockHeight - bottomPadding + effBottomOffset;

    if (eyebrowTag) {
      const tag = renderEyebrow(currentY);
      content += tag.svg;
      currentY += tag.height;
    }

    if (showStarBadge) {
      const badge = renderBadge(currentY);
      content += badge.svg;
      currentY += badge.height;
    }

    if (titleLines.length > 0) {
      const titleBlock = renderText(titleLines, titleSize, titleLineHeight, titleWeight, titleColor, currentY, hFont, titleFontStyle, '-1');
      content += titleBlock.svg;
      currentY += titleBlock.height + Math.round(18 * scale);
    }

    if (subtitleLines.length > 0) {
      const subBlock = renderText(subtitleLines, subtitleSize, subtitleLineHeight, subtitleWeight, subtitleColor, currentY, sFont);
      content += subBlock.svg;
    }
  }

  // POSITION: BOTH (Top Headline/Badge + Bottom Subtitle/Callout)
  else if (position === 'both') {
    // TOP ZONE: Eyebrow + Star Badge + Headline
    const defaultTopY = Math.round(110 * scale);
    let baseTopY = defaultTopY;

    if (phoneTop && phoneTop > 200) {
      const topContentHeight = badgeBlockHeight + titleBlockHeight;
      const maxAllowedTopY = phoneTop - topContentHeight - Math.round(24 * scale);
      if (defaultTopY > maxAllowedTopY) {
        baseTopY = Math.max(Math.round(40 * scale), maxAllowedTopY);
      }
    }

    let topY = baseTopY + textYOffset;

    if (eyebrowTag) {
      const tag = renderEyebrow(topY);
      content += tag.svg;
      topY += tag.height;
    }

    if (showStarBadge) {
      const badge = renderBadge(topY);
      content += badge.svg;
      topY += badge.height;
    }

    if (titleLines.length > 0) {
      const titleBlock = renderText(titleLines, titleSize, titleLineHeight, titleWeight, titleColor, topY, hFont, titleFontStyle, '-1');
      content += titleBlock.svg;
    }

    // BOTTOM ZONE: Subtitle or Footer Callout
    const bottomText = footer || subtitle || '';
    const bottomLines = bottomText ? wrapText(bottomText, maxSubChars) : [];
    if (bottomLines.length > 0) {
      const bottomBlockHeight = subtitleSize + (bottomLines.length - 1) * subtitleLineHeight;
      const effBottomOffset = bottomTextOffset !== undefined ? bottomTextOffset : textYOffset;
      const bottomY = canvasHeight - Math.round(110 * scale) - bottomBlockHeight + effBottomOffset;
      const subBlock = renderText(bottomLines, subtitleSize, subtitleLineHeight, subtitleWeight, subtitleColor, bottomY, sFont);
      content += subBlock.svg;
    }
  }

  const shadowOpacity = isDarkTheme ? '0.3' : '0.08';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
    <defs>
      <linearGradient id="textAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accentColors[0]}" />
        <stop offset="100%" stop-color="${accentColors[1]}" />
      </linearGradient>
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
 * Ignores markdown ** syntax when computing visible line width.
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
      const prospective = currentLine ? `${currentLine} ${word}` : word;
      const visibleLength = prospective.replace(/\*\*/g, '').length;

      if (visibleLength <= maxCharsPerLine) {
        currentLine = prospective;
      } else {
        if (currentLine) result.push(currentLine);
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

