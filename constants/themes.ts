export interface BezelSpec {
  id: string;
  name: string;
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
}

export const BEZEL_PRESETS: Record<string, BezelSpec> = {
  minimal: {
    id: 'minimal',
    name: 'Modern Minimalist',
    width: 900,
    height: 1850,
    screen: { x: 26, y: 26, width: 848, height: 1798, radius: 46 },
  },
  'iphone-16-pro': {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    width: 920,
    height: 1900,
    screen: { x: 28, y: 28, width: 864, height: 1844, radius: 52 },
    island: { x: 360, y: 44, width: 200, height: 48, radius: 24 },
  },
  'pixel-9-pro': {
    id: 'pixel-9-pro',
    name: 'Google Pixel 9 Pro',
    width: 910,
    height: 1890,
    screen: { x: 25, y: 25, width: 860, height: 1840, radius: 44 },
    punchHole: { cx: 455, cy: 55, r: 16 },
  },
};

export interface GradientPreset {
  name: string;
  colors: [string, string, ...string[]];
  angle: number;
  isDark?: boolean;
}

export const GRADIENT_PRESETS: Record<string, GradientPreset> = {
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
  'apple-6.5': {
    id: 'apple-6.5',
    store: 'apple',
    name: 'Apple App Store 6.5" (iPhone 11 Pro Max)',
    width: 1242,
    height: 2688,
    folder: 'appstore/iphone-6.5',
  },
  'google-phone': {
    id: 'google-phone',
    store: 'google',
    name: 'Google Play Phone Display',
    width: 1080,
    height: 1920,
    folder: 'googleplay/phone',
  },
};



