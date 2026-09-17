export interface BezelSpec {
  id: string;
  name: string;
  category?: 'apple' | 'android' | 'tablet' | 'frameless';
  width: number;
  height: number;
  screen: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
  };
  island?: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
  };
  punchHole?: {
    cx: number;
    cy: number;
    r: number;
  };
  notch?: {
    width: number;
    height: number;
    radius: number;
  };
  isFrameless?: boolean;
}

export const BEZEL_PRESETS: Record<string, BezelSpec> = {
  none: {
    id: 'none',
    name: 'Pure Floating Screen (No Bezel)',
    category: 'frameless',
    width: 864,
    height: 1844,
    isFrameless: true,
    screen: { x: 0, y: 0, width: 864, height: 1844, radius: 28 },
  },
  'iphone-16-pro': {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro Max',
    category: 'apple',
    width: 920,
    height: 1950,
    screen: { x: 28, y: 28, width: 864, height: 1894, radius: 52 },
    island: { x: 360, y: 44, width: 200, height: 48, radius: 24 },
  },
  'iphone-16': {
    id: 'iphone-16',
    name: 'iPhone 16',
    category: 'apple',
    width: 900,
    height: 1880,
    screen: { x: 26, y: 26, width: 848, height: 1828, radius: 48 },
    island: { x: 350, y: 42, width: 200, height: 48, radius: 24 },
  },
  'iphone-15-pro': {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    category: 'apple',
    width: 910,
    height: 1910,
    screen: { x: 27, y: 27, width: 856, height: 1856, radius: 50 },
    island: { x: 355, y: 43, width: 200, height: 48, radius: 24 },
  },
  'iphone-14': {
    id: 'iphone-14',
    name: 'iPhone 14 (Classic Notch)',
    category: 'apple',
    width: 900,
    height: 1870,
    screen: { x: 26, y: 26, width: 848, height: 1818, radius: 44 },
    notch: { width: 230, height: 40, radius: 18 },
  },
  'pixel-9-pro': {
    id: 'pixel-9-pro',
    name: 'Google Pixel 9 Pro',
    category: 'android',
    width: 910,
    height: 1910,
    screen: { x: 24, y: 24, width: 862, height: 1862, radius: 46 },
    punchHole: { cx: 455, cy: 50, r: 15 },
  },
  'pixel-8': {
    id: 'pixel-8',
    name: 'Google Pixel 8',
    category: 'android',
    width: 900,
    height: 1870,
    screen: { x: 25, y: 25, width: 850, height: 1820, radius: 42 },
    punchHole: { cx: 450, cy: 52, r: 15 },
  },
  'galaxy-s24-ultra': {
    id: 'galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'android',
    width: 920,
    height: 1920,
    screen: { x: 20, y: 20, width: 880, height: 1880, radius: 16 },
    punchHole: { cx: 460, cy: 46, r: 14 },
  },
  'galaxy-s24': {
    id: 'galaxy-s24',
    name: 'Samsung Galaxy S24',
    category: 'android',
    width: 890,
    height: 1870,
    screen: { x: 24, y: 24, width: 842, height: 1822, radius: 40 },
    punchHole: { cx: 445, cy: 48, r: 14 },
  },
  'ipad-pro-13': {
    id: 'ipad-pro-13',
    name: 'Apple iPad Pro 13" M4',
    category: 'tablet',
    width: 1400,
    height: 1860,
    screen: { x: 35, y: 35, width: 1330, height: 1790, radius: 30 },
  },
  'android-tablet-10': {
    id: 'android-tablet-10',
    name: 'Android Tablet 10"',
    category: 'tablet',
    width: 1380,
    height: 1940,
    screen: { x: 32, y: 32, width: 1316, height: 1876, radius: 24 },
  },
  minimal: {
    id: 'minimal',
    name: 'Modern Minimalist',
    category: 'frameless',
    width: 900,
    height: 1850,
    screen: { x: 26, y: 26, width: 848, height: 1798, radius: 46 },
  },
};

export interface GradientPreset {
  name: string;
  colors: [string, string, ...string[]];
  angle: number;
  isDark?: boolean;
  isNone?: boolean;
}

export const GRADIENT_PRESETS: Record<string, GradientPreset> = {
  none: {
    name: 'None (Raw Screenshot)',
    colors: ['transparent', 'transparent'],
    angle: 0,
    isDark: true,
    isNone: true,
  },
  aurora: {
    name: 'Electric Aurora',
    colors: ['#4f46e5', '#06b6d4', '#10b981'],
    angle: 135,
    isDark: true,
  },
  studioLight: {
    name: 'Apple Studio Light',
    colors: ['#f8fafc', '#f1f5f9', '#e2e8f0'],
    angle: 180,
    isDark: false,
  },
  freshMint: {
    name: 'Fresh Mint',
    colors: ['#0f766e', '#059669', '#10b981'],
    angle: 135,
    isDark: true,
  },
  sunset: {
    name: 'Warm Sunset',
    colors: ['#f43f5e', '#fb923c', '#fbbf24'],
    angle: 135,
    isDark: true,
  },
  midnight: {
    name: 'Deep Midnight',
    colors: ['#090d16', '#1e1b4b', '#312e81'],
    angle: 160,
    isDark: true,
  },
  royal: {
    name: 'Royal Orchid',
    colors: ['#7c3aed', '#c026d3', '#f43f5e'],
    angle: 120,
    isDark: true,
  },
  cleanDark: {
    name: 'Titanium Dark',
    colors: ['#18181b', '#27272a', '#09090b'],
    angle: 180,
    isDark: true,
  },
};

export type LayoutMode = 'appstore' | 'social';

export const LAYOUT_PRESETS: Record<LayoutMode, { name: string; phoneTop: (canvasH: number, phoneH: number) => number }> = {
  appstore: {
    name: 'App Store Bottom Bleed',
    phoneTop: (canvasH, phoneH) => Math.round(canvasH - phoneH + 120), // Bleeds slightly off bottom for huge screen prominence
  },
  social: {
    name: 'Social Floating Showcase',
    phoneTop: (canvasH, phoneH) => Math.round((canvasH - phoneH) / 2 + 100), // Fully centered with space for title
  },
};

export const FONT_PRESETS: Record<string, { name: string; family: string }> = {
  modern: {
    name: 'Modern Sans (Clean Tech)',
    family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif",
  },
  rounded: {
    name: 'Friendly Rounded',
    family: "'Segoe UI Variable Display', 'SF Pro Rounded', 'Arial Rounded MT Bold', sans-serif",
  },
  editorial: {
    name: 'Editorial Serif (Luxury & Elegance)',
    family: "'Georgia', 'Times New Roman', serif",
  },
  mono: {
    name: 'Developer Monospace',
    family: "'Consolas', 'Fira Code', 'SF Mono', monospace",
  },
};

export interface StoreTarget {
  id: string;
  store: 'apple' | 'google';
  name: string;
  width: number;
  height: number;
  folder: string;
}

export const STORE_TARGETS: Record<string, StoreTarget> = {
  'apple-6.9': {
    id: 'apple-6.9',
    store: 'apple',
    name: 'Apple App Store 6.9" (iPhone 16 Pro Max)',
    width: 1320,
    height: 2868,
    folder: 'appstore/iphone-6.9',
  },
  'apple-6.7': {
    id: 'apple-6.7',
    store: 'apple',
    name: 'Apple App Store 6.7" (iPhone 15 Pro Max)',
    width: 1290,
    height: 2796,
    folder: 'appstore/iphone-6.7',
  },
  'apple-ipad-13': {
    id: 'apple-ipad-13',
    store: 'apple',
    name: 'Apple App Store 13" iPad Pro',
    width: 2064,
    height: 2752,
    folder: 'appstore/ipad-13',
  },
  'google-phone': {
    id: 'google-phone',
    store: 'google',
    name: 'Google Play Phone Display',
    width: 1080,
    height: 1920,
    folder: 'googleplay/phone',
  },
  'google-tablet-10': {
    id: 'google-tablet-10',
    store: 'google',
    name: 'Google Play 10" Tablet Display',
    width: 1600,
    height: 2560,
    folder: 'googleplay/tablet-10',
  },
  'google-feature': {
    id: 'google-feature',
    store: 'google',
    name: 'Google Play Feature Graphic (Mandatory 1024x500)',
    width: 1024,
    height: 500,
    folder: 'googleplay/feature-graphic',
  },
};



