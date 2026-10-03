'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Smartphone,
  Wifi,
  Camera,
  Download,
  Sparkles,
  Layers,
  Type,
  Star,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  FolderArchive,
  ExternalLink,
  Trash2,
  Copy,
  Video,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Film,
  X,
  Upload,
  ImagePlus,
  Plus,
  Cable,
  Globe,
  WifiOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Italic,
  Palette,
  Wand2,
  MoveVertical,
  RotateCcw,
} from 'lucide-react';

interface ConnectedDevice {
  id: string;
  type: 'usb' | 'wifi' | 'emulator';
  model: string;
  product: string;
  isAuthorized: boolean;
}

interface SessionScreen {
  id: string;
  index: number;
  label: string;
  base64: string;
  timestamp: string;
  customTitle?: string;
  subtitle?: string;
  themeId?: string;
  bezelId?: string;
  layout?: 'appstore' | 'social';
  font?: string;
  headlineFont?: string;
  subtitleFont?: string;
  textAlign?: 'left' | 'center' | 'right';
  titleScale?: number;
  subtitleScale?: number;
  titleWeight?: string;
  subtitleWeight?: string;
  isItalic?: boolean;
  textOffset?: number;
  showStars?: boolean;
  ambientGlow?: boolean;
  phoneScale?: number;
  phoneOffset?: number;
  customColor1?: string;
  customColor2?: string;
  useCustomColors?: boolean;
  typographyPosition?: 'top' | 'bottom' | 'both';
}

const THEMES = [
  { id: 'none', name: 'None (Raw Screenshot)', colors: ['transparent'], darkText: false, isNone: true },
  { id: 'studioLight', name: 'Studio Light', colors: ['#f8f9fa', '#e9ecef'], darkText: true },
  { id: 'freshMint', name: 'Fresh Mint', colors: ['#0f172a', '#064e3b', '#022c22'], darkText: false },
  { id: 'aurora', name: 'Aurora Borealis', colors: ['#0f172a', '#4c1d95', '#1e1b4b'], darkText: false },
  { id: 'sunset', name: 'Sunset Crimson', colors: ['#450a0a', '#7f1d1d', '#18181b'], darkText: false },
  { id: 'midnight', name: 'Midnight Obsidian', colors: ['#090d16', '#111827', '#030712'], darkText: false },
  { id: 'royal', name: 'Royal Indigo', colors: ['#172554', '#1e1b4b', '#0f172a'], darkText: false },
  { id: 'cleanDark', name: 'Clean Dark', colors: ['#18181b', '#09090b'], darkText: false },
  { id: 'fintech', name: 'Fintech Emerald', colors: ['#022c22', '#064e3b', '#047857'], darkText: false },
  { id: 'lavender', name: 'Lavender Mist', colors: ['#1e1b4b', '#4c1d95', '#7c3aed'], darkText: false },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', colors: ['#09090b', '#701a75', '#a21caf'], darkText: false },
  { id: 'crimsonVoid', name: 'Crimson Void', colors: ['#18181b', '#7f1d1d', '#450a0a'], darkText: false },
  { id: 'cobalt', name: 'Cobalt Indigo', colors: ['#030712', '#1e3a8a', '#1e40af'], darkText: false },
  { id: 'terracotta', name: 'Warm Terracotta', colors: ['#1c1917', '#78350f', '#9a3412'], darkText: false },
  { id: 'slateCarbon', name: 'Carbon Matte', colors: ['#090d16', '#1e293b', '#334155'], darkText: false },
  { id: 'pureWhite', name: 'Studio Minimal White', colors: ['#ffffff', '#f8fafc', '#f1f5f9'], darkText: true },
];

interface BezelOption {
  id: string;
  name: string;
  platform: string;
  category: 'all' | 'apple' | 'android' | 'tablet' | 'frameless';
  badge: string;
}

const BEZELS: BezelOption[] = [
  { id: 'none', name: 'No Bezel (Floating)', platform: 'Universal', category: 'frameless', badge: 'Pure Screen' },
  { id: 'iphone-16-pro', name: 'iPhone 16 Pro Max', platform: 'Apple iOS', category: 'apple', badge: 'Titanium' },
  { id: 'iphone-16', name: 'iPhone 16', platform: 'Apple iOS', category: 'apple', badge: 'Dynamic Island' },
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', platform: 'Apple iOS', category: 'apple', badge: 'Dynamic Island' },
  { id: 'iphone-14', name: 'iPhone 14', platform: 'Apple iOS', category: 'apple', badge: 'Classic Notch' },
  { id: 'pixel-9-pro', name: 'Google Pixel 9 Pro', platform: 'Google Pixel', category: 'android', badge: 'Punch Hole' },
  { id: 'pixel-8', name: 'Google Pixel 8', platform: 'Google Pixel', category: 'android', badge: 'Punch Hole' },
  { id: 'galaxy-s24-ultra', name: 'Galaxy S24 Ultra', platform: 'Samsung', category: 'android', badge: 'Boxy Titanium' },
  { id: 'galaxy-s24', name: 'Galaxy S24', platform: 'Samsung', category: 'android', badge: 'Punch Hole' },
  { id: 'ipad-pro-13', name: 'iPad Pro 13" M4', platform: 'Apple iPad', category: 'tablet', badge: '4:3 Tablet' },
  { id: 'android-tablet-10', name: 'Android Tablet 10"', platform: 'Android', category: 'tablet', badge: '16:10 Tablet' },
  { id: 'minimal', name: 'Modern Minimalist', platform: 'Universal', category: 'frameless', badge: 'Clean Frame' },
];

const FONTS = [
  { id: 'modern', name: 'Modern Sans (SF / Inter / Roboto)' },
  { id: 'geometric', name: 'Geometric Tech (Poppins / Outfit)' },
  { id: 'rounded', name: 'Friendly Rounded (Nunito / Quicksand)' },
  { id: 'impact', name: 'Bold Impact (Bebas Neue / Oswald)' },
  { id: 'editorial', name: 'Luxury Serif (Playfair / Georgia)' },
  { id: 'mono', name: 'Developer Monospace (JetBrains / Fira)' },
  { id: 'playful', name: 'Casual & Playful (Fredoka)' },
  { id: 'humanist', name: 'Humanist Elegance (Optima / Candara)' },
];

const MAGIC_COPY_TEMPLATES = [
  {
    name: 'Feature Spotlight',
    title: 'Supercharged **Performance**',
    subtitle: 'Engineered from the ground up for blazing speed and fluid responsiveness.',
  },
  {
    name: 'Social Proof / Trust',
    title: 'Loved by **100,000+** Creators',
    subtitle: 'Top-rated developer utility trusted by engineering teams worldwide.',
  },
  {
    name: 'Problem / Solution',
    title: 'Never Waste Time on **Mockups** Again',
    subtitle: 'Automate chassis framing and App Store exports in seconds.',
  },
  {
    name: 'Launch / V2',
    title: 'Introducing **Studio 2.0**',
    subtitle: 'Precision typography, 16 curated themes, and instant batch sync.',
  },
  {
    name: 'Security & Privacy',
    title: '100% Local & **Private**',
    subtitle: 'Zero cloud uploads required. Everything runs locally on your machine.',
  },
];

interface DesignerAesthetic {
  id: string;
  name: string;
  badge: string;
  subtitle: string;
  icon: string;
  gradient: string;
  config: {
    themeId: string;
    useCustomColors: boolean;
    headlineFont: string;
    subtitleFont: string;
    titleWeight: '400' | '600' | '700' | '800' | '900';
    isItalic: boolean;
    bezelId: string;
    ambientGlow: boolean;
    textAlign: 'left' | 'center' | 'right';
    phoneScale: number;
    layout: 'appstore' | 'social';
  };
}

const DESIGNER_AESTHETICS: DesignerAesthetic[] = [
  {
    id: 'cupertino',
    name: 'Cupertino Clean',
    badge: 'Apple Keynote',
    subtitle: 'Studio White • SF Modern',
    icon: '🍏',
    gradient: 'from-slate-100 to-slate-200 text-slate-900',
    config: {
      themeId: 'pureWhite',
      useCustomColors: false,
      headlineFont: 'modern',
      subtitleFont: 'match',
      titleWeight: '700',
      isItalic: false,
      bezelId: 'iphone-16-pro',
      ambientGlow: false,
      textAlign: 'center',
      phoneScale: 1.0,
      layout: 'appstore',
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    badge: 'High Voltage',
    subtitle: 'Magenta Void • Bold 900',
    icon: '⚡',
    gradient: 'from-fuchsia-600 to-purple-800 text-white',
    config: {
      themeId: 'cyberpunk',
      useCustomColors: false,
      headlineFont: 'geometric',
      subtitleFont: 'match',
      titleWeight: '900',
      isItalic: false,
      bezelId: 'galaxy-s24-ultra',
      ambientGlow: true,
      textAlign: 'center',
      phoneScale: 1.02,
      layout: 'appstore',
    },
  },
  {
    id: 'editorial',
    name: 'Editorial Luxury',
    badge: 'Linear / Vogue',
    subtitle: 'Obsidian • Serif Italic',
    icon: '🏛️',
    gradient: 'from-zinc-800 to-black text-amber-200',
    config: {
      themeId: 'cleanDark',
      useCustomColors: false,
      headlineFont: 'editorial',
      subtitleFont: 'humanist',
      titleWeight: '600',
      isItalic: true,
      bezelId: 'iphone-16',
      ambientGlow: true,
      textAlign: 'center',
      phoneScale: 0.98,
      layout: 'appstore',
    },
  },
  {
    id: 'action-tech',
    name: 'Action Tech',
    badge: 'Impact Store',
    subtitle: 'Cobalt Deep • Bebas Heavy',
    icon: '🚀',
    gradient: 'from-blue-600 to-indigo-900 text-white',
    config: {
      themeId: 'cobalt',
      useCustomColors: false,
      headlineFont: 'impact',
      subtitleFont: 'modern',
      titleWeight: '800',
      isItalic: false,
      bezelId: 'pixel-9-pro',
      ambientGlow: true,
      textAlign: 'center',
      phoneScale: 1.0,
      layout: 'appstore',
    },
  },
  {
    id: 'fintech-trust',
    name: 'Fintech Trust',
    badge: 'Enterprise Emerald',
    subtitle: 'Emerald Green • Titanium',
    icon: '🌿',
    gradient: 'from-emerald-700 to-teal-950 text-emerald-100',
    config: {
      themeId: 'fintech',
      useCustomColors: false,
      headlineFont: 'modern',
      subtitleFont: 'match',
      titleWeight: '800',
      isItalic: false,
      bezelId: 'iphone-16-pro',
      ambientGlow: true,
      textAlign: 'center',
      phoneScale: 1.0,
      layout: 'appstore',
    },
  },
];

/**
 * Intelligently formats an Android package ID into a clean human-readable product name
 * e.g. com.coachconnect.app -> Coachconnect, com.instagram.android -> Instagram
 */
function formatAppName(pkg?: string | null): string {
  if (!pkg) return 'Screen';
  if (
    pkg.includes('launcher') ||
    pkg.includes('trebuchet') ||
    pkg.includes('home') ||
    pkg.endsWith('.globallauncher')
  ) {
    return 'Home Screen';
  }
  if (pkg === 'com.android.systemui') return 'System UI';
  if (pkg === 'com.android.settings') return 'Settings';

  const parts = pkg.split('.').filter(Boolean);
  const prefixes = new Set(['com', 'org', 'net', 'io', 'co', 'me', 'in', 'us', 'uk', 'de', 'app']);
  const suffixes = new Set([
    'android',
    'app',
    'mobile',
    'client',
    'phone',
    'ui',
    'release',
    'debug',
    'staging',
    'beta',
    'lite',
    'main',
    'music',
  ]);

  let meaningful = parts.filter((p, i) => !(i === 0 && prefixes.has(p.toLowerCase())));
  while (meaningful.length > 1 && suffixes.has(meaningful[meaningful.length - 1].toLowerCase())) {
    meaningful.pop();
  }

  let candidate = meaningful[meaningful.length - 1] || parts[parts.length - 1];

  let name = candidate;
  if (/^[a-z0-9]+$/i.test(name)) {
    if (name === name.toLowerCase()) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }
  }
  return name;
}

export default function StudioPage() {
  // Device & Status State
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportScope, setExportScope] = useState<'all' | 'active'>('all');
  const [isDragging, setIsDragging] = useState(false);
  // Animated Story Maker State
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [storyPaceMs, setStoryPaceMs] = useState<number>(1800);
  const [storyPreviewIndex, setStoryPreviewIndex] = useState<number>(0);
  const [isStoryPlaying, setIsStoryPlaying] = useState<boolean>(true);
  const [isGeneratingStory, setIsGeneratingStory] = useState<boolean>(false);
  const [storyFrames, setStoryFrames] = useState<string[]>([]);
  const [isLoadingFrames, setIsLoadingFrames] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Wireless ADB Mode State
  const [isSwitchingWireless, setIsSwitchingWireless] = useState(false);
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [wifiIpInput, setWifiIpInput] = useState('');
  const [wifiPortInput, setWifiPortInput] = useState('5555');
  const [wifiPairingCode, setWifiPairingCode] = useState('');
  const [isPairingMode, setIsPairingMode] = useState(false);
  const [isConnectingIp, setIsConnectingIp] = useState(false);
  const [wifiModalError, setWifiModalError] = useState<string | null>(null);
  const [wifiModalSuccess, setWifiModalSuccess] = useState<string | null>(null);

  // Customization Options
  const [themeId, setThemeId] = useState('studioLight');
  const [bezelId, setBezelId] = useState('iphone-16-pro');
  const [bezelCategory, setBezelCategory] = useState<'all' | 'apple' | 'android' | 'tablet' | 'frameless'>('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [layout, setLayout] = useState<'appstore' | 'social'>('appstore');
  const [font, setFont] = useState('modern');
  const [headlineFont, setHeadlineFont] = useState('modern');
  const [subtitleFont, setSubtitleFont] = useState('match');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [titleScale, setTitleScale] = useState<number>(1.0);
  const [subtitleScale, setSubtitleScale] = useState<number>(1.0);
  const [titleWeight, setTitleWeight] = useState<'400' | '600' | '700' | '800' | '900'>('800');
  const [isItalic, setIsItalic] = useState(false);
  const [textOffset, setTextOffset] = useState<number>(0);
  const [customColor1, setCustomColor1] = useState('#4f46e5');
  const [customColor2, setCustomColor2] = useState('#06b6d4');
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [title, setTitle] = useState('Transform Your Workflow');
  const [subtitle, setSubtitle] = useState('Effortless automated mobile screenshot studio.');
  const [showStars, setShowStars] = useState(true);
  const [typographyPosition, setTypographyPosition] = useState<'top' | 'bottom' | 'both'>('top');
  const [phoneScale, setPhoneScale] = useState<number>(1.0);
  const [phoneOffset, setPhoneOffset] = useState<number>(0);
  const [ambientGlow, setAmbientGlow] = useState<boolean>(true);

  // Images & Screen Session History
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [screens, setScreens] = useState<SessionScreen[]>([]);
  const [activeScreenIndex, setActiveScreenIndex] = useState<number>(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reference to debounce render requests and timers
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCapturingRef = useRef(false);
  const initialSnapTakenRef = useRef(false);
  const lastScreenBase64Ref = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const syncScreensTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSelectingScreenRef = useRef(false);

  // Interactive on-canvas text dragging state & refs
  const [isDraggingText, setIsDraggingText] = useState(false);
  const dragStartYRef = useRef(0);
  const startOffsetRef = useRef(0);

  const handleTextDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingText(true);
    dragStartYRef.current = e.clientY;
    startOffsetRef.current = textOffset;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaY = moveEvent.clientY - dragStartYRef.current;
      const newOffset = Math.max(-200, Math.min(200, Math.round(startOffsetRef.current + deltaY * 1.5)));
      setTextOffset(newOffset);
    };

    const handleMouseUp = () => {
      setIsDraggingText(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      refreshPreview();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // 1. Setup Server-Sent Events (SSE) for live device updates
  useEffect(() => {
    const sse = new EventSource('/api/events');

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.devices) {
          const newDevices: ConnectedDevice[] = data.devices;
          setDevices(newDevices);
          setSelectedDevice((prevSelected) => {
            if (!newDevices || newDevices.length === 0) return '';

            const usbDev = newDevices.find((d) => d.type === 'usb' && d.isAuthorized);
            const currentDev = newDevices.find((d) => d.id === prevSelected);

            // If no previous selection, or current selected device disconnected:
            if (!currentDev) {
              return usbDev ? usbDev.id : newDevices[0].id;
            }

            // Auto-prioritize USB: if currently on Wi-Fi and a USB connection appears (cable plugged in):
            if (currentDev.type === 'wifi' && usbDev && usbDev.id !== prevSelected) {
              return usbDev.id;
            }

            return prevSelected;
          });
        }
        if (data.activeApp !== undefined) {
          setActiveApp((prev) => {
            if (prev && prev !== data.activeApp) {
              // App switched on phone -> pull fresh screen automatically
              setTimeout(() => handleSnap(true), 300);
            }
            return data.activeApp;
          });
        }
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    };

    sse.onerror = () => {
      // Fallback polling if SSE disconnects
    };

    return () => {
      sse.close();
    };
  }, [selectedDevice]);

  // 2. Trigger compositing preview
  const refreshPreview = useCallback(
    async (rawScreenshot?: string, overrides?: Partial<SessionScreen>) => {
      // Cancel previous pending render request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsRendering(true);
      try {
        const effThemeId = overrides?.themeId !== undefined ? overrides.themeId : themeId;
        const effUseCustom = overrides?.useCustomColors !== undefined ? overrides.useCustomColors : useCustomColors;
        const effCustom1 = overrides?.customColor1 !== undefined ? overrides.customColor1 : customColor1;
        const effCustom2 = overrides?.customColor2 !== undefined ? overrides.customColor2 : customColor2;
        const effBezelId = overrides?.bezelId !== undefined ? overrides.bezelId : bezelId;
        const effLayout = overrides?.layout !== undefined ? overrides.layout : layout;
        const effHeadlineFont = overrides?.headlineFont !== undefined ? overrides.headlineFont : headlineFont;
        const effSubtitleFont = overrides?.subtitleFont !== undefined ? overrides.subtitleFont : subtitleFont;
        const effTextAlign = overrides?.textAlign !== undefined ? overrides.textAlign : textAlign;
        const effTitleScale = overrides?.titleScale !== undefined ? overrides.titleScale : titleScale;
        const effSubtitleScale = overrides?.subtitleScale !== undefined ? overrides.subtitleScale : subtitleScale;
        const effTitleWeight = overrides?.titleWeight !== undefined ? overrides.titleWeight : titleWeight;
        const effIsItalic = overrides?.isItalic !== undefined ? overrides.isItalic : isItalic;
        const effTextOffset = overrides?.textOffset !== undefined ? overrides.textOffset : textOffset;
        const effTitle = overrides?.customTitle !== undefined ? overrides.customTitle : title;
        const effSubtitle = overrides?.subtitle !== undefined ? overrides.subtitle : subtitle;
        const effShowStars = overrides?.showStars !== undefined ? overrides.showStars : showStars;
        const effTypoPos = overrides?.typographyPosition !== undefined ? overrides.typographyPosition : typographyPosition;
        const effPhoneScale = overrides?.phoneScale !== undefined ? overrides.phoneScale : phoneScale;
        const effPhoneOffset = overrides?.phoneOffset !== undefined ? overrides.phoneOffset : phoneOffset;
        const effAmbientGlow = overrides?.ambientGlow !== undefined ? overrides.ambientGlow : ambientGlow;

        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            screenshotBase64: rawScreenshot || overrides?.base64 || screenshotBase64,
            deviceId: selectedDevice || undefined,
            bezelId: effBezelId,
            gradientPreset: effThemeId,
            layout: effLayout,
            font: effHeadlineFont,
            headlineFont: effHeadlineFont,
            subtitleFont: effSubtitleFont === 'match' ? effHeadlineFont : effSubtitleFont,
            textAlign: effTextAlign,
            titleScaleMultiplier: effTitleScale,
            subtitleScaleMultiplier: effSubtitleScale,
            titleWeight: effTitleWeight,
            isItalic: effIsItalic,
            textYOffset: effTextOffset,
            useCustomColors: effUseCustom,
            customColors: effUseCustom ? [effCustom1, effCustom2] : undefined,
            title: effTitle,
            subtitle: effSubtitle,
            showStarBadge: effShowStars,
            typographyPosition: effTypoPos,
            phoneScaleMultiplier: effPhoneScale,
            phoneTopOffset: effPhoneOffset,
            enableAmbientGlow: effAmbientGlow,
            format: 'preview',
          }),
        });

        const data = await res.json();
        if (data.success && data.base64) {
          setPreviewBase64(data.base64);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Preview render error:', err);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setIsRendering(false);
        }
      }
    },
    [
      screenshotBase64,
      selectedDevice,
      bezelId,
      themeId,
      layout,
      headlineFont,
      subtitleFont,
      textAlign,
      titleScale,
      subtitleScale,
      titleWeight,
      isItalic,
      textOffset,
      customColor1,
      customColor2,
      useCustomColors,
      title,
      subtitle,
      showStars,
      typographyPosition,
      phoneScale,
      phoneOffset,
      ambientGlow,
    ]
  );

  // Debounced auto-preview when styling knobs change
  useEffect(() => {
    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => {
      refreshPreview();
    }, 120);

    return () => {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    };
  }, [
    themeId,
    bezelId,
    layout,
    headlineFont,
    subtitleFont,
    textAlign,
    titleScale,
    subtitleScale,
    titleWeight,
    isItalic,
    textOffset,
    customColor1,
    customColor2,
    useCustomColors,
    title,
    subtitle,
    showStars,
    typographyPosition,
    phoneScale,
    phoneOffset,
    ambientGlow,
    refreshPreview,
  ]);

  // Automatically persist current styling into the active screen in filmstrip (debounced)
  useEffect(() => {
    if (isSelectingScreenRef.current) {
      isSelectingScreenRef.current = false;
      return;
    }
    if (screens.length === 0 || activeScreenIndex < 0 || activeScreenIndex >= screens.length) return;
    if (syncScreensTimeoutRef.current) clearTimeout(syncScreensTimeoutRef.current);
    syncScreensTimeoutRef.current = setTimeout(() => {
      setScreens((prev) => {
        if (!prev[activeScreenIndex]) return prev;
        const current = prev[activeScreenIndex];
        const next = [...prev];
        next[activeScreenIndex] = {
          ...current,
          customTitle: title,
          subtitle,
          themeId,
          bezelId,
          layout,
          font: headlineFont,
          headlineFont,
          subtitleFont,
          textAlign,
          titleScale,
          subtitleScale,
          titleWeight,
          isItalic,
          textOffset,
          showStars,
          ambientGlow,
          phoneScale,
          phoneOffset,
          customColor1,
          customColor2,
          useCustomColors,
          customColors: useCustomColors ? [customColor1, customColor2] : undefined,
          typographyPosition,
        };
        return next;
      });
    }, 350);

    return () => {
      if (syncScreensTimeoutRef.current) clearTimeout(syncScreensTimeoutRef.current);
    };
  }, [
    activeScreenIndex,
    title,
    subtitle,
    themeId,
    bezelId,
    layout,
    font,
    headlineFont,
    subtitleFont,
    textAlign,
    titleScale,
    subtitleScale,
    titleWeight,
    isItalic,
    textOffset,
    showStars,
    ambientGlow,
    phoneScale,
    phoneOffset,
    customColor1,
    customColor2,
    useCustomColors,
    typographyPosition,
  ]);

  // 3. 1-Click Capture from Mobile Phone
  const handleSnap = useCallback(
    async (silent = false) => {
      if (isCapturingRef.current) return;
      isCapturingRef.current = true;
      setIsCapturing(true);
      if (!silent) setStatusMessage('Pulling live screen from phone...');
      try {
        const res = await fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: selectedDevice || undefined }),
        });

        const data = await res.json();
        if (data.success && data.base64) {
          lastScreenBase64Ref.current = data.base64;
          setScreenshotBase64(data.base64);
          setLastLatencyMs(data.latencyMs);

          // Visual Feedback: Trigger 180ms camera shutter flash
          setIsFlashing(true);
          setTimeout(() => setIsFlashing(false), 180);

          // Add to Session Screens filmstrip
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const appName = activeApp ? formatAppName(activeApp) : 'Screen';

          setScreens((prev) => {
            const nextIdx = prev.length + 1;
            const newScreen: SessionScreen = {
              id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              index: nextIdx,
              label: `${appName} #${nextIdx}`,
              base64: data.base64,
              timestamp: timeStr,
              themeId,
              bezelId,
              layout,
              font: headlineFont,
              headlineFont,
              subtitleFont,
              textAlign,
              titleScale,
              subtitleScale,
              titleWeight,
              isItalic,
              textOffset,
              showStars,
              ambientGlow,
              phoneScale,
              phoneOffset,
              customColor1,
              customColor2,
              useCustomColors,
              typographyPosition,
            };
            setActiveScreenIndex(prev.length);
            return [...prev, newScreen];
          });

          // Floating Toast confirmation
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          setToastMessage(`📸 Screen captured in ${data.latencyMs}ms`);
          toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2200);

          if (!silent) setStatusMessage(`Synced screen in ${data.latencyMs}ms (${(data.sizeBytes / 1024).toFixed(0)} KB)`);
          await refreshPreview(data.base64);
        } else {
          if (!silent) setStatusMessage(`Sync failed: ${data.error}`);
        }
      } catch (err) {
        if (!silent) setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        isCapturingRef.current = false;
        setIsCapturing(false);
      }
    },
    [selectedDevice, activeApp, refreshPreview]
  );

  // 1-Click Switch: Puts USB device in TCP mode and connects over Wi-Fi
  const handleSwitchToWifi = async () => {
    if (!selectedDevice || isSwitchingWireless) return;
    setIsSwitchingWireless(true);
    setStatusMessage('Querying device IP and switching ADB to wireless mode...');
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch_to_wifi', deviceId: selectedDevice }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.devices) setDevices(data.devices);
        if (data.endpoint) setSelectedDevice(data.endpoint);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastMessage(`📶 Switched to Wi-Fi (${data.endpoint})! You can now unplug the cable.`);
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 4000);
        setStatusMessage(`Wireless active: ${data.endpoint}`);
      } else {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastMessage(`❌ Wi-Fi switch failed: ${data.error}`);
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);
        setStatusMessage(`Wi-Fi error: ${data.error}`);
      }
    } catch (err) {
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSwitchingWireless(false);
    }
  };

  // Disconnects Wi-Fi session and reverts to standard USB mode
  const handleDisconnectWifi = async () => {
    if (!selectedDevice || isSwitchingWireless) return;
    setIsSwitchingWireless(true);
    setStatusMessage('Disconnecting Wi-Fi session...');
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect_wifi', deviceId: selectedDevice }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.devices) {
          setDevices(data.devices);
          const usbDev = data.devices.find((d: ConnectedDevice) => d.type === 'usb' && d.isAuthorized);
          if (usbDev) setSelectedDevice(usbDev.id);
          else if (data.devices.length > 0) setSelectedDevice(data.devices[0].id);
          else setSelectedDevice('');
        }
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastMessage('🔌 Wi-Fi disconnected.');
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
        setStatusMessage('Wi-Fi disconnected');
      } else {
        setStatusMessage(`Disconnect failed: ${data.error}`);
      }
    } catch (err) {
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSwitchingWireless(false);
    }
  };

  // Connects or pairs directly via manual IP input
  const handleConnectIp = async () => {
    setWifiModalError(null);
    setWifiModalSuccess(null);

    let cleanIp = wifiIpInput.trim();
    let cleanPort = wifiPortInput.trim() || '5555';
    if (cleanIp.includes(':')) {
      const parts = cleanIp.split(':');
      cleanIp = parts[0];
      if (parts[1]) cleanPort = parts[1];
    }

    if (!cleanIp) {
      setWifiModalError('Please enter device IP address (e.g. 192.168.1.45)');
      return;
    }

    setIsConnectingIp(true);
    try {
      if (isPairingMode) {
        if (!wifiPairingCode.trim()) {
          setWifiModalError('Please enter 6-digit pairing code shown on your phone');
          setIsConnectingIp(false);
          return;
        }
        const pairRes = await fetch('/api/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'pair_wifi',
            ip: cleanIp,
            port: cleanPort,
            code: wifiPairingCode.trim(),
          }),
        });
        const pairData = await pairRes.json();
        if (!pairData.success) {
          throw new Error(pairData.error || 'Pairing failed. Verify pairing port and code from phone popup.');
        }

        // Android 11+ pairing succeeded! Give mDNS daemon 1.2s to register the paired connection
        setWifiModalSuccess(`🎉 Paired successfully with ${cleanIp}! Initializing wireless link...`);
        await new Promise((r) => setTimeout(r, 1200));

        const refreshRes = await fetch('/api/devices');
        const refreshData = await refreshRes.json();
        if (refreshData.devices && refreshData.devices.length > 0) {
          setDevices(refreshData.devices);
          const found = refreshData.devices.find((d: ConnectedDevice) => d.type === 'wifi') || refreshData.devices[0];
          if (found) setSelectedDevice(found.id);
        }

        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastMessage(`📶 Successfully paired with phone!`);
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);

        setTimeout(() => {
          setIsWifiModalOpen(false);
          setWifiIpInput('');
          setWifiPairingCode('');
          setWifiModalSuccess(null);
        }, 1000);
        return;
      }

      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect_ip',
          ip: cleanIp,
          port: cleanPort,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.devices) setDevices(data.devices);
        if (data.endpoint) setSelectedDevice(data.endpoint);
        setWifiModalSuccess(`Connected successfully to ${data.endpoint}!`);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastMessage(`📶 Connected to wireless device ${data.endpoint}!`);
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);

        setTimeout(() => {
          setIsWifiModalOpen(false);
          setWifiIpInput('');
          setWifiPairingCode('');
          setWifiModalSuccess(null);
        }, 800);
      } else {
        setWifiModalError(data.error || 'Connection failed');
      }
    } catch (err) {
      setWifiModalError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsConnectingIp(false);
    }
  };

  const selectScreen = async (index: number) => {
    if (index < 0 || index >= screens.length) return;
    isSelectingScreenRef.current = true;
    setActiveScreenIndex(index);
    const target = screens[index];
    if (target.customTitle !== undefined) setTitle(target.customTitle);
    if (target.subtitle !== undefined) setSubtitle(target.subtitle);
    if (target.themeId) setThemeId(target.themeId);
    if (target.bezelId) setBezelId(target.bezelId);
    if (target.layout) setLayout(target.layout);
    if (target.font) setFont(target.font);
    if (target.headlineFont) setHeadlineFont(target.headlineFont);
    if (target.subtitleFont) setSubtitleFont(target.subtitleFont);
    if (target.textAlign) setTextAlign(target.textAlign);
    if (target.titleScale !== undefined) setTitleScale(target.titleScale);
    if (target.subtitleScale !== undefined) setSubtitleScale(target.subtitleScale);
    if (target.titleWeight) setTitleWeight(target.titleWeight);
    if (target.isItalic !== undefined) setIsItalic(target.isItalic);
    if (target.textOffset !== undefined) setTextOffset(target.textOffset);
    if (target.showStars !== undefined) setShowStars(target.showStars);
    if (target.ambientGlow !== undefined) setAmbientGlow(target.ambientGlow);
    if (target.phoneScale !== undefined) setPhoneScale(target.phoneScale);
    if (target.phoneOffset !== undefined) setPhoneOffset(target.phoneOffset);
    if (target.customColor1) setCustomColor1(target.customColor1);
    if (target.customColor2) setCustomColor2(target.customColor2);
    setUseCustomColors(target.useCustomColors ?? false);
    if (target.typographyPosition) setTypographyPosition(target.typographyPosition);

    setScreenshotBase64(target.base64);
    await refreshPreview(target.base64, target);
  };

  const deleteScreen = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    setScreens((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setActiveScreenIndex(0);
        setScreenshotBase64(null);
        setPreviewBase64(null);
      } else if (activeScreenIndex === index) {
        const nextIdx = Math.min(index, updated.length - 1);
        setActiveScreenIndex(nextIdx);
        setScreenshotBase64(updated[nextIdx].base64);
        refreshPreview(updated[nextIdx].base64);
      } else if (activeScreenIndex > index) {
        setActiveScreenIndex(activeScreenIndex - 1);
      }
      return updated;
    });
  };

  const clearAllScreens = () => {
    setScreens([]);
    setActiveScreenIndex(0);
    setScreenshotBase64(null);
    setPreviewBase64(null);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage('Session filmstrip cleared');
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2000);
  };

  // Move screen card left or right in export order
  const moveScreen = (e: React.MouseEvent, index: number, direction: 'left' | 'right') => {
    e.stopPropagation();
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= screens.length) return;

    setScreens((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });

    if (activeScreenIndex === index) {
      setActiveScreenIndex(targetIdx);
    } else if (activeScreenIndex === targetIdx) {
      setActiveScreenIndex(index);
    }
  };

  // Import local images from disk or drag-and-drop
  const handleImportFiles = (files: FileList | File[]) => {
    const fileList = Array.from(files);
    const validFiles = fileList.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    validFiles.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) return;
        const base64Data = result.includes(',') ? result.split(',')[1] : result;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const label = file.name.replace(/\.[^/.]+$/, '').slice(0, 20);

        setScreens((prev) => {
          const nextIdx = prev.length + 1;
          const newScreen: SessionScreen = {
            id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            index: nextIdx,
            label: label || `Image #${nextIdx}`,
            base64: base64Data,
            timestamp: timeStr,
            themeId,
            bezelId,
            layout,
            font: headlineFont,
            headlineFont,
            subtitleFont,
            textAlign,
            titleScale,
            subtitleScale,
            titleWeight,
            isItalic,
            textOffset,
            showStars,
            ambientGlow,
            phoneScale,
            phoneOffset,
            customColor1,
            customColor2,
            useCustomColors,
            typographyPosition,
          };
          if (prev.length === 0 && i === 0) {
            setScreenshotBase64(base64Data);
            setActiveScreenIndex(0);
          }
          return [...prev, newScreen];
        });
      };
      reader.readAsDataURL(file);
    });

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(`📂 Imported ${validFiles.length} image${validFiles.length > 1 ? 's' : ''}`);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2200);
  };

  // Copy framed mockup to clipboard
  const handleCopyImage = async () => {
    if (!previewBase64) return;
    setIsCopying(true);
    try {
      const byteCharacters = atob(previewBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToastMessage('📋 Mockup copied to clipboard! Paste in Figma or Slack');
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      setStatusMessage(`Copy failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCopying(false);
    }
  };

  // Download raw, untouched mobile screenshot directly
  const handleDownloadRaw = () => {
    if (!screenshotBase64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${screenshotBase64}`;
    link.download = `adbsnap-raw-${Date.now()}.png`;
    link.click();
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage('📥 Downloaded raw 1:1 mobile screenshot');
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2000);
  };

  // Open Story Maker modal and fetch framed preview frames
  const openStoryModal = async () => {
    if (screens.length === 0) {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToastMessage('⚠️ Capture at least 1 screen in filmstrip first');
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    setIsStoryModalOpen(true);
    setIsLoadingFrames(true);
    setStoryPreviewIndex(0);
    setIsStoryPlaying(true);

    try {
      const res = await fetch('/api/animate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          screens,
          bezelId,
          gradientPreset: themeId,
          layout,
          font,
          title,
          subtitle,
          showStarBadge: showStars,
          useCustomColors,
          customColors: useCustomColors ? [customColor1, customColor2] : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.frames) {
        setStoryFrames(data.frames);
      }
    } catch (err) {
      console.error('Failed to load story preview frames:', err);
    } finally {
      setIsLoadingFrames(false);
    }
  };

  // Cycling playback for Story Maker modal preview
  useEffect(() => {
    if (!isStoryModalOpen || !isStoryPlaying || storyFrames.length <= 1) return;
    const timer = setInterval(() => {
      setStoryPreviewIndex((prev) => (prev + 1) % storyFrames.length);
    }, storyPaceMs);
    return () => clearInterval(timer);
  }, [isStoryModalOpen, isStoryPlaying, storyFrames.length, storyPaceMs]);

  // Download animated GIF story
  const handleDownloadStory = async () => {
    if (screens.length === 0) return;
    setIsGeneratingStory(true);
    setStatusMessage(`Compiling ${screens.length} screens into animated GIF story...`);
    try {
      const res = await fetch('/api/animate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screens,
          delayMs: storyPaceMs,
          bezelId,
          gradientPreset: themeId,
          layout,
          font,
          title,
          subtitle,
          showStarBadge: showStars,
          useCustomColors,
          customColors: useCustomColors ? [customColor1, customColor2] : undefined,
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adbsnap-${screens.length}-screens-story.gif`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToastMessage(`✨ Animated story downloaded (${screens.length} screens loop)!`);
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
      setStatusMessage('Animated story downloaded successfully!');
    } catch (err) {
      setStatusMessage(`Story export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // Auto-snap initial frame when device is selected
  useEffect(() => {
    if (selectedDevice && !initialSnapTakenRef.current) {
      initialSnapTakenRef.current = true;
      handleSnap(true);
    }
  }, [selectedDevice, handleSnap]);

  // 4. Export Multi-Store ZIP Package
  const handleExportZip = async (overrideScope?: 'all' | 'active') => {
    const scope = overrideScope || exportScope;
    const isMulti = scope === 'all' && screens.length > 1;
    setIsExporting(true);
    setStatusMessage(
      isMulti
        ? `Generating multi-store packages for all ${screens.length} screens...`
        : 'Generating 4K multi-store package & ZIP archive...'
    );
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshotBase64,
          screens: scope === 'all' && screens.length > 0 ? screens : undefined,
          exportMode: scope,
          deviceId: selectedDevice || undefined,
          bezelId,
          gradientPreset: themeId,
          layout,
          font: headlineFont,
          headlineFont,
          subtitleFont: subtitleFont === 'match' ? headlineFont : subtitleFont,
          textAlign,
          titleScaleMultiplier: titleScale,
          subtitleScaleMultiplier: subtitleScale,
          titleWeight,
          isItalic,
          textYOffset: textOffset,
          useCustomColors,
          customColors: useCustomColors ? [customColor1, customColor2] : undefined,
          title,
          subtitle,
          showStarBadge: showStars,
          typographyPosition,
          phoneScaleMultiplier: phoneScale,
          phoneTopOffset: phoneOffset,
          enableAmbientGlow: ambientGlow,
          format: 'zip',
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = isMulti
        ? `adbsnap-${screens.length}-screens-${themeId}.zip`
        : `adbsnap-store-assets-${themeId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      const successMsg = isMulti
        ? `Successfully exported all ${screens.length} screens into ZIP archive!`
        : 'ZIP archive downloaded successfully!';
      setStatusMessage(successMsg);

      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToastMessage(`📦 Exported ${isMulti ? `${screens.length} screens` : 'active screen'} (.zip)`);
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setStatusMessage(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Sync styling across all screens in the filmstrip
  const handleSyncStyleToAll = () => {
    if (screens.length === 0) return;
    setScreens((prev) =>
      prev.map((s) => ({
        ...s,
        themeId,
        bezelId,
        layout,
        font: headlineFont,
        headlineFont,
        subtitleFont,
        textAlign,
        titleScale,
        subtitleScale,
        titleWeight,
        isItalic,
        textOffset,
        showStars,
        ambientGlow,
        phoneScale,
        phoneOffset,
        customColor1,
        customColor2,
        useCustomColors,
        customColors: useCustomColors ? [customColor1, customColor2] : undefined,
        typographyPosition,
      }))
    );

    refreshPreview();

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(`✨ Applied current style & layout across all ${screens.length} screen${screens.length > 1 ? 's' : ''}!`);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
    setStatusMessage(`Style synchronized across all ${screens.length} screens.`);
  };

  // 1-Click Designer Aesthetic Recipe Application
  const applyDesignerAesthetic = (aesthetic: DesignerAesthetic) => {
    const { config } = aesthetic;
    setThemeId(config.themeId);
    setUseCustomColors(config.useCustomColors);
    setHeadlineFont(config.headlineFont);
    setSubtitleFont(config.subtitleFont);
    setTitleWeight(config.titleWeight);
    setIsItalic(config.isItalic);
    setBezelId(config.bezelId);
    setAmbientGlow(config.ambientGlow);
    setTextAlign(config.textAlign);
    setPhoneScale(config.phoneScale);
    setLayout(config.layout);

    setScreens((prev) => {
      if (!prev[activeScreenIndex]) return prev;
      const next = [...prev];
      next[activeScreenIndex] = {
        ...next[activeScreenIndex],
        themeId: config.themeId,
        useCustomColors: config.useCustomColors,
        customColors: undefined,
        headlineFont: config.headlineFont,
        subtitleFont: config.subtitleFont,
        titleWeight: config.titleWeight,
        isItalic: config.isItalic,
        bezelId: config.bezelId,
        ambientGlow: config.ambientGlow,
        textAlign: config.textAlign,
        phoneScale: config.phoneScale,
        layout: config.layout,
      };
      return next;
    });

    refreshPreview(undefined, {
      themeId: config.themeId,
      useCustomColors: config.useCustomColors,
      headlineFont: config.headlineFont,
      subtitleFont: config.subtitleFont === 'match' ? config.headlineFont : config.subtitleFont,
      titleWeight: config.titleWeight,
      isItalic: config.isItalic,
      bezelId: config.bezelId,
      ambientGlow: config.ambientGlow,
      textAlign: config.textAlign,
      phoneScale: config.phoneScale,
      layout: config.layout,
    });

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(`✨ Applied "${aesthetic.name}" aesthetic!`);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
    setStatusMessage(`Applied ${aesthetic.name} style preset.`);
  };

  // 5. Autonomous Tab Crawler
  const handleAutonomousCrawl = async () => {
    setIsCrawling(true);
    setStatusMessage('Autonomous Crawler scanning tabs on mobile device...');
    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice || undefined,
          theme: themeId,
          frame: bezelId,
          layout,
          font,
          stars: showStars,
        }),
      });

      const data = await res.json();
      if (data.success && data.screens && data.screens.length > 0) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        setScreens((prev) => {
          const startingIdx = prev.length;
          const crawledItems: SessionScreen[] = data.screens.map(
            (s: { title: string; base64: string; rawBase64?: string }, i: number) => ({
              id: `crawl-${Date.now()}-${i}`,
              index: startingIdx + i + 1,
              label: s.title || `Tab #${i + 1}`,
              base64: s.rawBase64 || s.base64,
              timestamp: timeStr,
              customTitle: s.title,
            })
          );
          setActiveScreenIndex(startingIdx);
          return [...prev, ...crawledItems];
        });

        const first = data.screens[0];
        setScreenshotBase64(first.rawBase64 || first.base64);
        if (first.title) setTitle(first.title);
        setPreviewBase64(first.base64);

        // Trigger camera shutter flash feedback
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 200);

        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastMessage(`✨ Crawled & added ${data.screens.length} tabs to filmstrip!`);
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);

        setStatusMessage(`Auto-crawled & captured ${data.screens.length} tabs hands-free!`);
      } else {
        setStatusMessage(`Crawl failed: ${data.error || 'No bottom tabs detected'}`);
      }
    } catch (err) {
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCrawling(false);
    }
  };

  // Keyboard shortcut: Space to Snap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleSnap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const activeDevice = devices.find((d) => d.id === selectedDevice) || devices[0];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0b0e] text-slate-100 font-sans">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-[#232733] bg-[#0f1117] px-4 sm:px-5 flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white whitespace-nowrap">ADBSnap Studio</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v1.1.3
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden xl:block">Marketing Asset & Screenshot Studio</p>
          </div>
        </div>

        {/* Live Device Status & USB/Wi-Fi Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#161922] border border-[#232733] shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-0.5">
              {activeDevice ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[90px] sm:max-w-[125px]" title={activeDevice.id}>
                    {activeDevice.model}
                  </span>
                  {devices.length > 1 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const otherDev = devices.find((d) => d.id !== activeDevice.id && d.isAuthorized) || devices.find((d) => d.id !== activeDevice.id);
                        if (otherDev) {
                          setSelectedDevice(otherDev.id);
                          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                          setToastMessage(`Switched transport to ${otherDev.type === 'usb' ? '🔌 USB' : '📶 Wi-Fi'}`);
                          toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
                        }
                      }}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 shrink-0 transition cursor-pointer border border-slate-700/60"
                      title={`Multiple connections active. Click to switch to ${activeDevice.type === 'wifi' ? 'USB' : 'Wi-Fi'}`}
                    >
                      {activeDevice.type === 'wifi' ? (
                        <>
                          <Wifi className="w-2.5 h-2.5 text-cyan-400" />
                          <span>Wi-Fi ▾</span>
                        </>
                      ) : (
                        <>
                          <Cable className="w-2.5 h-2.5 text-amber-400" />
                          <span>USB ▾</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1 shrink-0">
                      {activeDevice.type === 'wifi' ? (
                        <>
                          <Wifi className="w-2.5 h-2.5 text-cyan-400" />
                          <span>Wi-Fi</span>
                        </>
                      ) : (
                        <>
                          <Cable className="w-2.5 h-2.5 text-amber-400" />
                          <span>USB</span>
                        </>
                      )}
                    </span>
                  )}
                  {activeApp && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(activeApp);
                        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                        setToastMessage(`📋 Copied package: ${activeApp}`);
                        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
                      }}
                      className="group/app flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950/70 hover:bg-blue-900/90 text-blue-300 border border-blue-800/40 transition cursor-pointer text-[10px] shrink-0"
                      title={`Active App: ${formatAppName(activeApp)}\nPackage: ${activeApp}\n(Click to copy package name)`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="font-semibold text-white tracking-wide truncate max-w-[85px] sm:max-w-[125px]">
                        {formatAppName(activeApp)}
                      </span>
                      <Copy className="w-2.5 h-2.5 text-blue-400/80 group-hover/app:text-white shrink-0 ml-0.5" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-xs text-amber-300">No device</span>
                </>
              )}
            </div>

            {/* Switch to Wi-Fi Quick Button (When on USB) */}
            {activeDevice && activeDevice.type === 'usb' && (
              <button
                type="button"
                onClick={handleSwitchToWifi}
                disabled={isSwitchingWireless}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition cursor-pointer disabled:opacity-50 shrink-0"
                title="Switch from USB to Wi-Fi mode automatically so you can unplug the USB cable"
              >
                {isSwitchingWireless ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Wifi className="w-3 h-3 text-cyan-400" />
                )}
                <span className="hidden lg:inline">Wi-Fi Switch</span>
              </button>
            )}

            {/* Disconnect Wi-Fi Quick Button (When on Wi-Fi) */}
            {activeDevice && activeDevice.type === 'wifi' && (
              <button
                type="button"
                onClick={handleDisconnectWifi}
                disabled={isSwitchingWireless}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition cursor-pointer disabled:opacity-50 shrink-0"
                title="Disconnect wireless ADB session and revert to USB mode"
              >
                {isSwitchingWireless ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Cable className="w-3 h-3 text-amber-400" />
                )}
                <span className="hidden lg:inline">Disconnect</span>
              </button>
            )}

            {/* Manual Connect / Pair Popover Trigger */}
            <button
              type="button"
              onClick={() => {
                setWifiModalError(null);
                setWifiModalSuccess(null);
                setIsWifiModalOpen(true);
              }}
              className="px-2.5 py-1 text-slate-300 hover:text-white rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 transition cursor-pointer flex items-center gap-1 text-[11px] font-medium shadow-sm shrink-0"
              title="Connect to a phone via Wi-Fi IP address or Android 11+ wireless debugging"
            >
              <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">IP Connect</span>
            </button>
          </div>

          {/* Screens Collected Counter Badge */}
          {screens.length > 0 && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 animate-in fade-in select-none shrink-0"
              title={`${screens.length} screens in studio`}
            >
              <span className="font-semibold">📸 {screens.length}</span>
              <span className="text-cyan-400/80 hidden 2xl:inline">
                {screens.length === 1 ? 'screen' : 'screens'}
              </span>
            </div>
          )}

          {/* Local File Upload Action */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161922] hover:bg-[#202533] border border-[#232733] text-slate-300 hover:text-white font-medium text-xs shadow-sm transition cursor-pointer shrink-0"
            title="Import screenshots from your computer (PNG, JPG, WebP)"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {/* Autonomous Crawl Action */}
          <button
            onClick={handleAutonomousCrawl}
            disabled={isCrawling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer shrink-0"
            title="Automatically explore app tabs and capture screens"
          >
            {isCrawling ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">Auto-Crawl</span>
          </button>

          {/* Primary Sync Action */}
          <button
            onClick={() => handleSnap(false)}
            disabled={isCapturing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-md shadow-cyan-500/20 transition disabled:opacity-50 cursor-pointer shrink-0"
            title="Pull current screen from your phone into the canvas (Spacebar)"
          >
            {isCapturing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Sync</span>
            <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 bg-cyan-600/30 text-slate-950 rounded font-mono font-bold">Space</kbd>
          </button>
        </div>
      </header>

      {/* Main Workspace (Split View) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Controls */}
        <aside className="w-84 border-r border-[#232733] bg-[#0f1117] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* 1-Click Designer Aesthetics */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  Designer Aesthetics
                </label>
                <span className="text-[10px] text-amber-400 font-medium">1-Click Combos</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {DESIGNER_AESTHETICS.map((aesthetic) => {
                  const isActive =
                    !useCustomColors &&
                    themeId === aesthetic.config.themeId &&
                    headlineFont === aesthetic.config.headlineFont &&
                    titleWeight === aesthetic.config.titleWeight;
                  return (
                    <button
                      key={aesthetic.id}
                      type="button"
                      onClick={() => applyDesignerAesthetic(aesthetic)}
                      className={`group relative flex items-center justify-between p-2 rounded-lg border text-left transition cursor-pointer ${
                        isActive
                          ? 'border-amber-400/80 bg-amber-400/10 shadow-sm shadow-amber-400/15'
                          : 'border-[#232733] hover:border-slate-600 bg-[#161922] hover:bg-[#1c202d]'
                      }`}
                      title={aesthetic.subtitle}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base select-none shrink-0">{aesthetic.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white truncate">{aesthetic.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-medium shrink-0">
                              {aesthetic.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">{aesthetic.subtitle}</span>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition ${
                          isActive
                            ? 'border-amber-400 bg-amber-400 text-black'
                            : 'border-slate-700 bg-black/40 group-hover:border-slate-500'
                        }`}
                      >
                        {isActive && <span className="text-[9px] font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Curated Themes ({THEMES.length})
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomColors(!useCustomColors)}
                  className={`text-[10px] px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                    useCustomColors
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  }`}
                  title="Pick your own custom brand gradient colors"
                >
                  <Palette className="w-3 h-3 text-cyan-400" />
                  Custom Brand
                </button>
              </div>

              {useCustomColors && (
                <div className="mb-2.5 p-2 rounded-lg bg-[#161922] border border-cyan-500/30 space-y-2">
                  <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider block">Custom Dual Gradient</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-1">Color 1 (Start)</span>
                      <div className="flex items-center gap-1.5 bg-[#0f1117] p-1 rounded border border-[#232733]">
                        <input
                          type="color"
                          value={customColor1}
                          onChange={(e) => setCustomColor1(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                        />
                        <span className="text-[10px] font-mono text-slate-300 uppercase">{customColor1}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-1">Color 2 (End)</span>
                      <div className="flex items-center gap-1.5 bg-[#0f1117] p-1 rounded border border-[#232733]">
                        <input
                          type="color"
                          value={customColor2}
                          onChange={(e) => setCustomColor2(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                        />
                        <span className="text-[10px] font-mono text-slate-300 uppercase">{customColor2}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="h-3.5 rounded border border-white/20 shadow-inner w-full"
                    style={{ background: `linear-gradient(135deg, ${customColor1}, ${customColor2})` }}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setUseCustomColors(false);
                      setThemeId(theme.id);
                    }}
                    className={`flex items-center justify-between p-1.5 rounded-lg border text-left text-xs transition cursor-pointer ${
                      !useCustomColors && themeId === theme.id
                        ? 'border-cyan-500 bg-cyan-500/10 text-white font-medium'
                        : 'border-[#232733] hover:border-slate-700 bg-[#161922] text-slate-300'
                    }`}
                  >
                    <span className={`truncate text-[11px] ${theme.isNone ? 'text-amber-300 font-semibold' : ''}`}>{theme.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {theme.isNone ? (
                        <span className="text-[8px] font-mono font-bold tracking-wider px-1 py-0.2 rounded bg-amber-400/15 border border-amber-400/30 text-amber-300">
                          RAW
                        </span>
                      ) : (
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-inner"
                          style={{
                            background: `linear-gradient(135deg, ${theme.colors.join(', ')})`,
                          }}
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Device Chassis & Framing */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  Device Chassis
                </label>
                <span className="text-[10px] text-cyan-400/90 font-mono truncate max-w-[130px]">
                  {BEZELS.find((b) => b.id === bezelId)?.name || 'Custom'}
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1 p-1 bg-[#12141a] rounded-lg border border-[#232733] mb-2 overflow-x-auto">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'frameless', label: 'Frameless' },
                  { id: 'apple', label: 'Apple' },
                  { id: 'android', label: 'Android' },
                  { id: 'tablet', label: 'Tablets' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setBezelCategory(cat.id as any)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer shrink-0 ${
                      bezelCategory === cat.id
                        ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Visual Device Cards List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 mb-2.5 scrollbar-thin">
                {BEZELS.filter(
                  (b) => bezelCategory === 'all' || b.category === bezelCategory || (bezelCategory === 'frameless' && b.id === 'none')
                ).map((b) => {
                  const isSelected = b.id === bezelId;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBezelId(b.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/15 shadow-sm shadow-cyan-500/20 text-white'
                          : 'border-[#232733] bg-[#161922] hover:border-slate-600 hover:bg-[#1c202c] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isSelected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                          }`}
                        />
                        <div className="truncate">
                          <div className="text-xs font-medium truncate">{b.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{b.platform}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                          isSelected
                            ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40'
                            : 'bg-white/5 text-slate-400 border border-white/5'
                        }`}
                      >
                        {b.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className={`space-y-2 transition ${themeId === 'none' ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLayout('appstore')}
                    className={`p-2 rounded-lg border text-xs text-center transition cursor-pointer ${
                      layout === 'appstore'
                        ? 'border-cyan-500 bg-cyan-500/10 text-white font-medium'
                        : 'border-[#232733] bg-[#161922] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    App Store (Bleed)
                  </button>
                  <button
                    onClick={() => setLayout('social')}
                    className={`p-2 rounded-lg border text-xs text-center transition cursor-pointer ${
                      layout === 'social'
                        ? 'border-cyan-500 bg-cyan-500/10 text-white font-medium'
                        : 'border-[#232733] bg-[#161922] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Social (Floating)
                  </button>
                </div>
              </div>
            </div>

            {/* Typography & Marketing Copy */}
            <div className={`transition ${themeId === 'none' ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-cyan-400" />
                  Marketing Typography
                </label>
                {themeId === 'none' && (
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded font-mono">
                    Disabled in Raw Mode
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {/* Text Positioning: Top, Bottom, Both */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Text Position</span>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#161922] border border-[#232733] rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setTypographyPosition('top')}
                      className={`py-1.5 px-2 rounded font-medium transition cursor-pointer ${
                        typographyPosition === 'top'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Headline and subtitle rendered above phone with bottom-bleed frame"
                    >
                      ⬆ Top
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypographyPosition('bottom')}
                      className={`py-1.5 px-2 rounded font-medium transition cursor-pointer ${
                        typographyPosition === 'bottom'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Headline and subtitle rendered below phone with top-positioned frame"
                    >
                      ⬇ Bottom
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypographyPosition('both')}
                      className={`py-1.5 px-2 rounded font-medium transition cursor-pointer ${
                        typographyPosition === 'both'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Top headline & star rating chip with bottom subtitle / callout text"
                    >
                      ↕ Both
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400">Headline</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-[#161922] border border-[#232733] rounded px-1.5 py-0.5">
                        <Wand2 className="w-3 h-3 text-cyan-400 shrink-0" />
                        <select
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__clear__') {
                              setTitle('');
                              setSubtitle('');
                              if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                              setToastMessage('✕ Cleared headline and subtitle');
                              toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2000);
                            } else if (val === '__reset__') {
                              setTitle('Transform Your Workflow');
                              setSubtitle('Effortless automated mobile screenshot studio.');
                              if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                              setToastMessage('↺ Restored default studio copy');
                              toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2000);
                            } else {
                              const t = MAGIC_COPY_TEMPLATES.find((tpl) => tpl.name === val);
                              if (t) {
                                setTitle(t.title);
                                setSubtitle(t.subtitle);
                                if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                                setToastMessage(`✨ Applied "${t.name}"`);
                                toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2000);
                              }
                            }
                          }}
                          className="text-[10px] bg-transparent text-cyan-300 cursor-pointer focus:outline-none"
                        >
                          <option value="" disabled>Magic Copy...</option>
                          <option value="__clear__" className="text-rose-400 font-medium">✕ Clear All Copy</option>
                          <option value="__reset__" className="text-amber-300 font-medium">↺ Reset Default Copy</option>
                          <option disabled className="text-slate-600">──────────</option>
                          {MAGIC_COPY_TEMPLATES.map((tpl) => (
                            <option key={tpl.name} value={tpl.name} className="text-slate-200">
                              {tpl.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {(title || subtitle) && (
                        <button
                          type="button"
                          onClick={() => {
                            setTitle('');
                            setSubtitle('');
                            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                            setToastMessage('✕ Cleared copy');
                            toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 1800);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition cursor-pointer"
                          title="Clear headline & subtitle"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter punchy headline (press Enter for new line)..."
                    className="w-full bg-[#161922] border border-[#232733] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none font-sans leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Tip: Use <span className="text-cyan-400 font-mono font-bold">**bold radiant**</span> and <span className="text-cyan-300 font-mono italic">*italic*</span> for accents.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400">
                      {typographyPosition === 'both' ? 'Bottom Callout / Footer' : 'Subtitle'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Multi-line (Enter ↵)</span>
                  </div>
                  <textarea
                    rows={2}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder={typographyPosition === 'both' ? 'Enter bottom callout or feature copy...' : 'Enter explanatory copy...'}
                    className="w-full bg-[#161922] border border-[#232733] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none font-sans leading-relaxed"
                  />
                </div>

                {/* Alignment, Weight & Italic Bar */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#161922] border border-[#232733] rounded-lg items-center">
                  {/* Alignment Buttons */}
                  <div className="flex items-center justify-around bg-[#0f1117] p-0.5 rounded border border-[#232733]">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => setTextAlign(align)}
                        className={`p-1 rounded transition cursor-pointer ${
                          textAlign === align ? 'bg-cyan-500/25 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={`Align text ${align}`}
                      >
                        {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>

                  {/* Weight Selector */}
                  <select
                    value={titleWeight}
                    onChange={(e) => setTitleWeight(e.target.value)}
                    className="bg-[#0f1117] border border-[#232733] text-slate-300 rounded px-1.5 py-1 text-[11px] focus:outline-none cursor-pointer"
                    title="Headline Font Weight"
                  >
                    <option value="400">Regular (400)</option>
                    <option value="600">Semi (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra (800)</option>
                    <option value="900">Black (900)</option>
                  </select>

                  {/* Italic Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsItalic(!isItalic)}
                    className={`flex items-center justify-center gap-1 rounded border text-[11px] py-1 font-medium transition cursor-pointer ${
                      isItalic
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                        : 'bg-[#0f1117] border-[#232733] text-slate-400 hover:text-slate-200'
                    }`}
                    title="Toggle Italic typography"
                  >
                    <Italic className="w-3 h-3" />
                    <span>Italic</span>
                  </button>
                </div>

                {/* Font Pairing Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      {typographyPosition === 'both' ? 'Top Font (Headline)' : 'Headline Font'}
                    </span>
                    <select
                      value={headlineFont}
                      onChange={(e) => {
                        setHeadlineFont(e.target.value);
                        setFont(e.target.value);
                      }}
                      className="w-full bg-[#161922] border border-[#232733] rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {FONTS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name.split(' ')[0]} {f.name.includes('Serif') ? 'Serif' : f.name.includes('Mono') ? 'Mono' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      {typographyPosition === 'both' ? 'Bottom Font (Callout)' : 'Subtitle Font'}
                    </span>
                    <select
                      value={subtitleFont}
                      onChange={(e) => setSubtitleFont(e.target.value)}
                      className="w-full bg-[#161922] border border-[#232733] rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="match">Match Headline</option>
                      {FONTS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name.split(' ')[0]} {f.name.includes('Serif') ? 'Serif' : f.name.includes('Mono') ? 'Mono' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Precision Sliders */}
                <div className="p-2.5 rounded-lg bg-[#161922] border border-[#232733] space-y-2">
                  {/* Headline Scale */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">Headline Scale</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-cyan-400 text-[11px] font-semibold">{Math.round(titleScale * 100)}%</span>
                        {titleScale !== 1.0 && (
                          <button
                            type="button"
                            onClick={() => setTitleScale(1.0)}
                            className="text-[9px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.5"
                      step="0.01"
                      value={titleScale}
                      onChange={(e) => setTitleScale(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer h-1 bg-[#232733] rounded-lg appearance-none"
                    />
                  </div>

                  {/* Subtitle Scale */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">Subtitle Scale</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-cyan-400 text-[11px] font-semibold">{Math.round(subtitleScale * 100)}%</span>
                        {subtitleScale !== 1.0 && (
                          <button
                            type="button"
                            onClick={() => setSubtitleScale(1.0)}
                            className="text-[9px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.3"
                      step="0.01"
                      value={subtitleScale}
                      onChange={(e) => setSubtitleScale(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer h-1 bg-[#232733] rounded-lg appearance-none"
                    />
                  </div>

                  {/* Vertical Offset (Nudge) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">Vertical Nudge</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-cyan-400 text-[11px] font-semibold">{textOffset > 0 ? `+${textOffset}px` : `${textOffset}px`}</span>
                        {textOffset !== 0 && (
                          <button
                            type="button"
                            onClick={() => setTextOffset(0)}
                            className="text-[9px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      step="1"
                      value={textOffset}
                      onChange={(e) => setTextOffset(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-500 cursor-pointer h-1 bg-[#232733] rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500">
                      <span>-200px (Higher)</span>
                      <span>0px (Safe)</span>
                      <span>+200px (Lower)</span>
                    </div>
                  </div>
                </div>

                {/* Star Badge Toggle */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#161922] border border-[#232733]">
                  <span className="text-xs text-slate-300 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    5-Star Review Chip
                  </span>
                  <input
                    type="checkbox"
                    checked={showStars}
                    onChange={(e) => setShowStars(e.target.checked)}
                    className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Device Layout & 3D Lighting */}
            <div className={`transition ${themeId === 'none' ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Chassis Layout & 3D Lighting
                </label>
              </div>
              <div className="space-y-3">
                {/* 3D Ambient Mesh Glow Toggle */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#161922] border border-[#232733]">
                  <div>
                    <span className="text-xs text-slate-200 block font-medium">Ambient 3D Radial Glow</span>
                    <span className="text-[10px] text-slate-500">Diffuse lighting mesh behind phone chassis</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={ambientGlow}
                    onChange={(e) => setAmbientGlow(e.target.checked)}
                    className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Phone Scale Slider */}
                <div className="p-2.5 rounded-lg bg-[#161922] border border-[#232733] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Device Scale</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-cyan-400 font-semibold">{Math.round(phoneScale * 100)}%</span>
                      {phoneScale !== 1.0 && (
                        <button
                          type="button"
                          onClick={() => setPhoneScale(1.0)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.15"
                    step="0.01"
                    value={phoneScale}
                    onChange={(e) => setPhoneScale(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-[#232733] rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>60% (Compact)</span>
                    <span>100% (Default)</span>
                    <span>115% (Hero)</span>
                  </div>
                </div>

                {/* Phone Vertical Nudge Offset Slider */}
                <div className="p-2.5 rounded-lg bg-[#161922] border border-[#232733] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Vertical Nudge (Y-Offset)</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-cyan-400 font-semibold">{phoneOffset > 0 ? `+${phoneOffset}px` : `${phoneOffset}px`}</span>
                      {phoneOffset !== 0 && (
                        <button
                          type="button"
                          onClick={() => setPhoneOffset(0)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    step="1"
                    value={phoneOffset}
                    onChange={(e) => setPhoneOffset(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-[#232733] rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>-150px (Higher)</span>
                    <span>0px (Auto)</span>
                    <span>+150px (Lower)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Export Action Buttons */}
          <div className="mt-auto p-4 border-t border-[#232733] bg-[#0f1117] space-y-2">
            {screens.length > 1 && (
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#161922] rounded-lg border border-[#232733] text-[11px]">
                <button
                  type="button"
                  onClick={() => setExportScope('all')}
                  className={`py-1 px-2 rounded font-medium transition cursor-pointer text-center ${
                    exportScope === 'all'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({screens.length}) Screens
                </button>
                <button
                  type="button"
                  onClick={() => setExportScope('active')}
                  className={`py-1 px-2 rounded font-medium transition cursor-pointer text-center ${
                    exportScope === 'active'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Active Only
                </button>
              </div>
            )}

            <button
              onClick={() => handleExportZip()}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FolderArchive className="w-4 h-4" />
              )}
              <span>
                {isExporting
                  ? 'Packaging Assets...'
                  : themeId === 'none'
                  ? screens.length > 1 && exportScope === 'all'
                    ? `Export All (${screens.length} Raw Screens) (.zip)`
                    : 'Export Raw Screens (.zip)'
                  : screens.length > 1 && exportScope === 'all'
                  ? `Export All (${screens.length} Screens) (.zip)`
                  : 'Export Stores (.zip)'}
              </span>
            </button>

            {screens.length > 1 && (
              <button
                type="button"
                onClick={openStoryModal}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium text-xs transition cursor-pointer"
                title="Open the Animated Product Story Maker to preview and export GIF animations"
              >
                <Film className="w-3.5 h-3.5 text-indigo-400" />
                <span>Create Animated Story ({screens.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadRaw}
              disabled={!screenshotBase64}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-[#161922] hover:bg-[#1f2433] text-slate-300 border border-[#232733] font-medium text-xs transition cursor-pointer disabled:opacity-40"
              title="Download pristine 1:1 mobile screenshot without canvas framing"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download Raw Screen (1:1)</span>
            </button>
          </div>
        </aside>

        {/* Hidden File Input for Local Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleImportFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />

        {/* Center Live Canvas Preview with Drag & Drop */}
        <main
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.types.includes('Files')) {
              setIsDragging(true);
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            if (e.dataTransfer.types.includes('Files') && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleImportFiles(e.dataTransfer.files);
            }
          }}
          className="flex-1 bg-[#0a0b0e] flex flex-col items-center justify-center p-6 relative overflow-hidden"
        >
          {/* Subtle Studio Background Grid */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Drag & Drop Visual Overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-cyan-950/85 border-2 border-dashed border-cyan-400 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
              <Upload className="w-12 h-12 text-cyan-400 mb-2 animate-bounce" />
              <h3 className="text-lg font-bold text-white">Drop screenshots here</h3>
              <p className="text-xs text-cyan-200">Import PNG, JPG, or WebP files into your workspace</p>
            </div>
          )}

          {/* Floating Toast Notification */}
          {toastMessage && (
            <div className="absolute top-5 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-[#12141a]/95 border border-cyan-500/50 shadow-2xl text-xs text-cyan-300 backdrop-blur pointer-events-none animate-in fade-in slide-in-from-top-2 duration-150">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
          )}

          {/* Canvas Wrapper */}
          <div className="relative max-h-[72vh] max-w-[85vw] flex items-center justify-center">
            {previewBase64 ? (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 group transition duration-300">
                {/* Camera Shutter Flash Animation */}
                {isFlashing && (
                  <div className="absolute inset-0 bg-white/70 z-30 pointer-events-none transition-opacity duration-150 rounded-xl" />
                )}

                <img
                  src={`data:image/png;base64,${previewBase64}`}
                  alt="ADBSnap Canvas Preview"
                  draggable={false}
                  className="max-h-[66vh] w-auto object-contain rounded-xl select-none pointer-events-none"
                />

                {/* Direct On-Canvas Draggable Text Zone (Top Headline Area) */}
                {themeId !== 'none' && (typographyPosition === 'top' || typographyPosition === 'both') && (
                  <div
                    onMouseDown={handleTextDragStart}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setTextOffset(0);
                    }}
                    className="absolute top-0 inset-x-0 h-[32%] z-20 cursor-ns-resize group/drag flex flex-col items-center justify-start pt-3 transition-all select-none rounded-t-xl hover:bg-cyan-500/[0.04]"
                    title="Click and drag up/down to reposition text. Double-click to reset."
                  >
                    <div className="opacity-0 group-hover/drag:opacity-100 transition-opacity duration-150 px-3 py-1 rounded-full bg-slate-900/90 text-cyan-300 text-[11px] font-medium border border-cyan-500/50 shadow-2xl flex items-center gap-1.5 select-none pointer-events-none">
                      <MoveVertical className="w-3 h-3 text-cyan-400" />
                      <span>Drag to Reposition Text</span>
                      {textOffset !== 0 && (
                        <span className="font-mono text-[10px] text-cyan-400 font-bold ml-1">
                          ({textOffset > 0 ? `+${textOffset}px` : `${textOffset}px`})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Direct On-Canvas Draggable Text Zone (Bottom Callout Area) */}
                {themeId !== 'none' && (typographyPosition === 'bottom' || typographyPosition === 'both') && (
                  <div
                    onMouseDown={handleTextDragStart}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setTextOffset(0);
                    }}
                    className="absolute bottom-0 inset-x-0 h-[30%] z-20 cursor-ns-resize group/drag flex flex-col items-center justify-end pb-3 transition-all select-none rounded-b-xl hover:bg-cyan-500/[0.04]"
                    title="Click and drag up/down to reposition text. Double-click to reset."
                  >
                    <div className="opacity-0 group-hover/drag:opacity-100 transition-opacity duration-150 px-3 py-1 rounded-full bg-slate-900/90 text-cyan-300 text-[11px] font-medium border border-cyan-500/50 shadow-2xl flex items-center gap-1.5 select-none pointer-events-none">
                      <MoveVertical className="w-3 h-3 text-cyan-400" />
                      <span>Drag to Reposition Text</span>
                      {textOffset !== 0 && (
                        <span className="font-mono text-[10px] text-cyan-400 font-bold ml-1">
                          ({textOffset > 0 ? `+${textOffset}px` : `${textOffset}px`})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Dynamic Live HUD Badge only when dragging */}
                {isDraggingText && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-cyan-400 text-cyan-300 text-xs font-mono font-semibold shadow-2xl backdrop-blur flex items-center gap-2 pointer-events-none animate-in fade-in duration-100">
                    <MoveVertical className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                    <span>Nudge: {textOffset > 0 ? `+${textOffset}px` : `${textOffset}px`}</span>
                  </div>
                )}

                {/* Subtle Non-Blocking Updating Badge */}
                {isRendering && (
                  <div className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur border border-cyan-500/40 text-cyan-300 text-[10px] font-medium flex items-center gap-1.5 shadow-lg pointer-events-none animate-in fade-in duration-100">
                    <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                    <span>Updating...</span>
                  </div>
                )}

                {/* Floating Quick Action Buttons on Canvas Hover */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  {themeId !== 'none' && (
                    <button
                      type="button"
                      onMouseDown={handleTextDragStart}
                      onDoubleClick={() => setTextOffset(0)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border shadow-xl backdrop-blur flex items-center gap-1.5 cursor-ns-resize select-none transition cursor-pointer ${
                        isDraggingText
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-cyan-500/30'
                          : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-white/15'
                      }`}
                      title="Click & drag vertically to reposition text. Double-click to reset."
                    >
                      <MoveVertical className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {textOffset !== 0
                          ? `Nudge (${textOffset > 0 ? `+${textOffset}px` : `${textOffset}px`})`
                          : 'Drag Nudge'}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={handleCopyImage}
                    disabled={isCopying}
                    className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-white/15 shadow-xl backdrop-blur flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Copy framed mockup directly to clipboard"
                  >
                    <Copy className="w-3 h-3 text-cyan-400" />
                    <span>{isCopying ? 'Copied!' : 'Copy Image'}</span>
                  </button>

                  <button
                    onClick={() => handleSnap(false)}
                    disabled={isCapturing}
                    className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-white/15 shadow-xl backdrop-blur flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Sync current phone screen (Space)"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCapturing ? 'animate-spin' : ''}`} />
                    <span>Sync Screen</span>
                    <kbd className="text-[10px] font-mono text-cyan-400">Space</kbd>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-10 text-center text-slate-500 border-2 border-dashed border-[#232733] hover:border-cyan-500/50 hover:bg-[#12151e]/60 transition rounded-2xl max-w-md cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#161922] group-hover:bg-cyan-950/50 border border-[#232733] group-hover:border-cyan-500/40 flex items-center justify-center mb-3 transition">
                  <ImagePlus className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">Canvas Ready for Framing</h3>
                <p className="text-xs text-slate-400 mb-4 max-w-xs">
                  Drag &amp; drop screenshots here, browse local files, or press <kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded font-mono text-[10px]">Space</kbd> to sync from phone.
                </p>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSnap(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync Phone (Space)</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1c202c] hover:bg-[#252b3b] border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-cyan-400" />
                    <span>Browse Files</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Session Screens Filmstrip Tray */}
          {screens.length > 0 && (
            <div className="mt-3 flex flex-col items-center z-20 w-full max-w-3xl px-4">
              <div className="flex items-center justify-between w-full mb-1.5 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
                    <Camera className="w-3 h-3 text-cyan-400" />
                    Session Filmstrip ({screens.length})
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    Hover card to reorder ⇄ • Space to capture
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {screens.length > 1 && (
                    <button
                      onClick={handleSyncStyleToAll}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-medium flex items-center gap-1 cursor-pointer transition shadow-sm"
                      title="Apply current theme, typography, font scales, and offset to all screens in filmstrip"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Sync Style to All</span>
                    </button>
                  )}

                  <button
                    onClick={openStoryModal}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/25 transition"
                    title="Open the Animated Product Story Maker to preview and export GIF animations"
                  >
                    <Film className="w-3.5 h-3.5 text-white" />
                    <span>Create Story</span>
                  </button>

                  <button
                    onClick={clearAllScreens}
                    className="text-[11px] px-2 py-1 text-slate-400 hover:text-rose-400 transition flex items-center gap-1 cursor-pointer"
                    title="Clear all captured screens"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full py-1.5 px-2 bg-[#12141a]/95 backdrop-blur-md rounded-xl border border-[#232733] shadow-lg">
                {/* Quick Add Local Image Card in Tray */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-20 rounded-lg border border-dashed border-[#2c3242] hover:border-cyan-500/60 bg-[#151822] hover:bg-cyan-950/20 text-slate-400 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 shrink-0 transition cursor-pointer"
                  title="Upload another screenshot from your computer"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[9px] font-medium">Add</span>
                </button>
                {screens.map((s, idx) => {
                  const isActive = idx === activeScreenIndex;
                  return (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setDraggedIndex(idx);
                        e.dataTransfer.setData('text/plain', String(idx));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDragEnd={(e) => {
                        e.stopPropagation();
                        setDraggedIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const raw = e.dataTransfer.getData('text/plain');
                        const srcIdx = draggedIndex !== null ? draggedIndex : (raw !== '' ? Number(raw) : null);
                        if (srcIdx !== null && !isNaN(srcIdx) && srcIdx !== idx) {
                          setScreens((prev) => {
                            const copy = [...prev];
                            const [moved] = copy.splice(srcIdx, 1);
                            copy.splice(idx, 0, moved);
                            return copy;
                          });
                          setActiveScreenIndex(idx);
                        }
                        setDraggedIndex(null);
                      }}
                      onClick={() => selectScreen(idx)}
                      className={`group relative flex flex-col items-center p-1 rounded-lg border transition cursor-grab active:cursor-grabbing shrink-0 select-none ${
                        isActive
                          ? 'border-cyan-500 bg-cyan-500/15 shadow-md shadow-cyan-500/20'
                          : 'border-[#232733] hover:border-slate-600 bg-[#161922]'
                      } ${draggedIndex === idx ? 'opacity-40 scale-95 border-cyan-400' : ''}`}
                    >
                      <div className="relative w-12 h-20 rounded overflow-hidden bg-black/50 flex items-center justify-center border border-white/5">
                        <img
                          src={`data:image/png;base64,${s.base64}`}
                          alt={s.label}
                          draggable={false}
                          className="w-full h-full object-cover select-none pointer-events-none"
                        />
                        {isActive && (
                          <div className="absolute inset-0 border-2 border-cyan-400 rounded pointer-events-none" />
                        )}

                        {/* Top Right: Delete Screen */}
                        <button
                          type="button"
                          onClick={(e) => deleteScreen(e, idx)}
                          className="absolute top-0.5 right-0.5 p-1 rounded bg-black/80 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow cursor-pointer z-20 pointer-events-auto"
                          title="Remove screen"
                        >
                          <Trash2 className="w-2.5 h-2.5 pointer-events-none" />
                        </button>

                        {/* Bottom Left: Move Left in Order */}
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={(e) => moveScreen(e, idx, 'left')}
                            className="absolute bottom-0.5 left-0.5 p-0.5 rounded bg-black/80 hover:bg-cyan-600 text-white opacity-0 group-hover:opacity-100 transition shadow cursor-pointer z-20 pointer-events-auto"
                            title="Move left in export order"
                          >
                            <ChevronLeft className="w-2.5 h-2.5 pointer-events-none" />
                          </button>
                        )}

                        {/* Bottom Right: Move Right in Order */}
                        {idx < screens.length - 1 && (
                          <button
                            type="button"
                            onClick={(e) => moveScreen(e, idx, 'right')}
                            className="absolute bottom-0.5 right-0.5 p-0.5 rounded bg-black/80 hover:bg-cyan-600 text-white opacity-0 group-hover:opacity-100 transition shadow cursor-pointer z-20 pointer-events-auto"
                            title="Move right in export order"
                          >
                            <ChevronRight className="w-2.5 h-2.5 pointer-events-none" />
                          </button>
                        )}
                      </div>
                      <span
                        className={`text-[9px] mt-0.5 font-medium max-w-[56px] truncate text-center ${
                          isActive ? 'text-cyan-300 font-bold' : 'text-slate-400'
                        }`}
                        title={s.customTitle || s.label}
                      >
                        {s.customTitle || `#${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Status / Latency Bar */}
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[11px] text-slate-400 pointer-events-none">
            <div className="flex items-center gap-2 bg-[#12141a]/90 backdrop-blur px-3 py-1.5 rounded-full border border-[#232733] pointer-events-auto">
              <span className="text-slate-300">Status:</span>
              <span className="text-cyan-400 font-medium">
                {statusMessage || 'Studio ready. Connected to local ADB daemon.'}
              </span>
            </div>

            {lastLatencyMs && (
              <div className="bg-[#12141a]/90 backdrop-blur px-3 py-1.5 rounded-full border border-[#232733] pointer-events-auto font-mono text-slate-400">
                Latency: <span className="text-emerald-400 font-bold">{lastLatencyMs}ms</span>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Animated Product Story Maker Modal */}
      {isStoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#0f1117] border border-[#232733] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#232733] flex items-center justify-between shrink-0 bg-[#12141a]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow">
                  <Film className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Animated Product Story Maker</h3>
                  <p className="text-[11px] text-slate-400">
                    Stitch your framed screens into a lightweight looping teaser for GitHub README &amp; socials
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsStoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Split View (Live Player on Left, Settings on Right) */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Live Cycling Playback Player */}
              <div className="md:col-span-7 flex flex-col items-center justify-center bg-[#0a0b0e] rounded-xl border border-[#232733] p-4 min-h-[440px] relative">
                {isLoadingFrames ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-cyan-400 text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Framing {screens.length} screens for story player...</span>
                  </div>
                ) : storyFrames.length > 0 ? (
                  <div className="flex flex-col items-center w-full">
                    {/* Active Cycling Frame */}
                    <div className="relative max-h-[48vh] rounded-xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
                      <img
                        src={`data:image/png;base64,${storyFrames[storyPreviewIndex]}`}
                        alt={`Story Frame ${storyPreviewIndex + 1}`}
                        className="max-h-[45vh] w-auto object-contain select-none"
                      />

                      {/* Frame Tag Overlay */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur border border-white/15 text-[10px] text-slate-300 font-medium">
                        Slide {storyPreviewIndex + 1} of {storyFrames.length}
                        {screens[storyPreviewIndex]?.customTitle && (
                          <span className="text-cyan-300 ml-1 font-semibold">
                            • {screens[storyPreviewIndex].customTitle}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* In-Browser Player Bar */}
                    <div className="mt-3 flex items-center gap-3 bg-[#12141a] px-3.5 py-1.5 rounded-full border border-[#232733] shadow">
                      {/* Step Prev */}
                      <button
                        onClick={() =>
                          setStoryPreviewIndex((prev) => (prev - 1 + storyFrames.length) % storyFrames.length)
                        }
                        className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
                        title="Previous Frame"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Play / Pause */}
                      <button
                        onClick={() => setIsStoryPlaying(!isStoryPlaying)}
                        className="p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer shadow"
                        title={isStoryPlaying ? 'Pause Loop' : 'Play Loop'}
                      >
                        {isStoryPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>

                      {/* Step Next */}
                      <button
                        onClick={() =>
                          setStoryPreviewIndex((prev) => (prev + 1) % storyFrames.length)
                        }
                        className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
                        title="Next Frame"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <div className="w-px h-3 bg-slate-800" />

                      {/* Timeline dots */}
                      <div className="flex items-center gap-1.5">
                        {storyFrames.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setStoryPreviewIndex(i);
                              setIsStoryPlaying(false);
                            }}
                            className={`w-2 h-2 rounded-full transition cursor-pointer ${
                              i === storyPreviewIndex ? 'bg-cyan-400 scale-125' : 'bg-slate-700 hover:bg-slate-500'
                            }`}
                            title={`Jump to slide ${i + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 text-xs">
                    No frames loaded. Make sure your filmstrip has screens.
                  </div>
                )}
              </div>

              {/* Right Column: Story Settings & Export */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
                    Story Settings
                  </h4>

                  {/* Slide Pace / Speed */}
                  <div className="space-y-2 mb-5">
                    <label className="text-xs text-slate-400 font-medium block">Slide Transition Pace</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: '1.0s', ms: 1000 },
                        { label: '1.5s', ms: 1500 },
                        { label: '1.8s', ms: 1800 },
                        { label: '2.5s', ms: 2500 },
                      ].map((item) => (
                        <button
                          key={item.ms}
                          onClick={() => setStoryPaceMs(item.ms)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition cursor-pointer text-center ${
                            storyPaceMs === item.ms
                              ? 'border-indigo-500 bg-indigo-500/20 text-white'
                              : 'border-[#232733] bg-[#161922] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Format Card */}
                  <div className="space-y-2 mb-5">
                    <label className="text-xs text-slate-400 font-medium block">Export Format</label>
                    <div className="p-3 rounded-xl border border-indigo-500/40 bg-indigo-500/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Looping Animated GIF</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-600/40 text-indigo-300">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Ultra-lightweight (<span className="text-emerald-400 font-medium">&lt;1 MB</span>), infinite loop. Zero-lag previews on GitHub READMEs, Product Hunt, &amp; Twitter.
                      </p>
                    </div>
                  </div>

                  {/* Estimated Stats */}
                  <div className="p-3 rounded-xl bg-[#161922] border border-[#232733] space-y-2 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Total Slides:</span>
                      <span className="text-slate-200 font-bold font-mono">{screens.length} screens</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Loop Duration:</span>
                      <span className="text-slate-200 font-bold font-mono">
                        {((screens.length * storyPaceMs) / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Target File Size:</span>
                      <span className="text-emerald-400 font-bold font-mono">~400 KB - 900 KB</span>
                    </div>
                  </div>
                </div>

                {/* Primary Download Action */}
                <button
                  onClick={handleDownloadStory}
                  disabled={isGeneratingStory || screens.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingStory ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>
                    {isGeneratingStory
                      ? 'Compiling Animated Story...'
                      : `Download Animated Story (${screens.length} Screens)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wireless ADB Connection Modal */}
      {isWifiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#12151e] border border-[#232733] rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#232733] bg-[#0c0e14]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Wireless ADB Connection</h3>
                  <p className="text-[11px] text-slate-400">Connect to Android over your local Wi-Fi network</p>
                </div>
              </div>
              <button
                onClick={() => setIsWifiModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#0a0b0e] border border-[#232733] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsPairingMode(false);
                    setWifiModalError(null);
                    if (!wifiPortInput || wifiPortInput !== '5555') setWifiPortInput('5555');
                  }}
                  className={`py-1.5 px-3 rounded-md font-medium transition cursor-pointer text-center ${
                    !isPairingMode
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Direct IP Connect
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPairingMode(true);
                    setWifiModalError(null);
                    if (wifiPortInput === '5555') setWifiPortInput('');
                  }}
                  className={`py-1.5 px-3 rounded-md font-medium transition cursor-pointer text-center ${
                    isPairingMode
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pair Device (Android 11+)
                </button>
              </div>

              {/* In-Modal Error Feedback */}
              {wifiModalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-mono text-[11px] leading-relaxed break-all">
                    {wifiModalError}
                  </div>
                </div>
              )}

              {/* In-Modal Success Feedback */}
              {wifiModalSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{wifiModalSuccess}</span>
                </div>
              )}

              {!isPairingMode ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Connect directly to an Android device already listening on TCP/IP or with wireless debugging enabled.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[11px] text-slate-300 font-medium block mb-1">Device IP Address</label>
                      <input
                        type="text"
                        value={wifiIpInput}
                        onChange={(e) => {
                          setWifiModalError(null);
                          const val = e.target.value.trim();
                          if (val.includes(':')) {
                            const parts = val.split(':');
                            setWifiIpInput(parts[0]);
                            if (parts[1]) setWifiPortInput(parts[1]);
                          } else {
                            setWifiIpInput(val);
                          }
                        }}
                        placeholder="e.g. 192.168.1.45"
                        className="w-full bg-[#161922] border border-[#232733] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 font-medium block mb-1">Port</label>
                      <input
                        type="text"
                        value={wifiPortInput}
                        onChange={(e) => {
                          setWifiModalError(null);
                          setWifiPortInput(e.target.value.trim());
                        }}
                        placeholder="5555"
                        className="w-full bg-[#161922] border border-[#232733] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    💡 Tip: If your phone shows <code className="text-cyan-400">192.168.1.45:41235</code>, pasting it into the IP box automatically splits the port.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-[11px] text-indigo-300 leading-relaxed">
                    On your phone: go to <strong>Settings → Developer options → Wireless debugging → Pair device with pairing code</strong>.
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[11px] text-slate-300 font-medium block mb-1">Device IP Address</label>
                      <input
                        type="text"
                        value={wifiIpInput}
                        onChange={(e) => {
                          setWifiModalError(null);
                          const val = e.target.value.trim();
                          if (val.includes(':')) {
                            const parts = val.split(':');
                            setWifiIpInput(parts[0]);
                            if (parts[1]) setWifiPortInput(parts[1]);
                          } else {
                            setWifiIpInput(val);
                          }
                        }}
                        placeholder="e.g. 192.168.1.45"
                        className="w-full bg-[#161922] border border-[#232733] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 font-medium block mb-1">Pairing Port</label>
                      <input
                        type="text"
                        value={wifiPortInput}
                        onChange={(e) => {
                          setWifiModalError(null);
                          setWifiPortInput(e.target.value.trim());
                        }}
                        placeholder="e.g. 38491"
                        className="w-full bg-[#161922] border border-[#232733] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 font-medium block mb-1">6-Digit Pairing Code</label>
                    <input
                      type="text"
                      value={wifiPairingCode}
                      onChange={(e) => {
                        setWifiModalError(null);
                        setWifiPairingCode(e.target.value.trim());
                      }}
                      placeholder="e.g. 123456"
                      maxLength={6}
                      className="w-full bg-[#161922] border border-[#232733] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono tracking-widest text-center text-sm font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWifiModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#161922] hover:bg-[#1f2433] text-slate-300 text-xs font-medium border border-[#232733] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConnectIp}
                  disabled={isConnectingIp || !wifiIpInput.trim()}
                  className="flex-1 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isConnectingIp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isPairingMode ? 'Pairing...' : 'Connecting...'}</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3.5 h-3.5" />
                      <span>{isPairingMode ? 'Pair Device' : 'Connect Device'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
