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
  Check,
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
  Sliders,
} from 'lucide-react';

interface ConnectedDevice {
  id: string;
  platform: 'android' | 'ios';
  type: 'usb' | 'wifi' | 'emulator';
  model: string;
  product: string;
  isAuthorized: boolean;
}

interface IOSSimulatorApp {
  bundleIdentifier: string;
  name: string;
  isDemo: boolean;
}

function deviceConnectionLabel(device: ConnectedDevice): string {
  if (device.platform === 'ios') {
    return device.type === 'emulator' ? 'iOS Sim' : `iOS ${device.type === 'wifi' ? 'Wi-Fi' : 'Device'}`;
  }
  return device.type === 'wifi' ? 'Wi-Fi' : device.type === 'emulator' ? 'Emulator' : 'USB';
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
  layout?: 'appstore' | 'social' | 'duo-overlap' | 'duo-split';
  secondaryScreenIndex?: number | null;
  font?: string;
  headlineFont?: string;
  subtitleFont?: string;
  textAlign?: 'left' | 'center' | 'right';
  titleScale?: number;
  subtitleScale?: number;
  titleWeight?: string;
  subtitleWeight?: string;
  isItalic?: boolean;
  subtitleItalic?: boolean;
  textOffset?: number;
  bottomTextOffset?: number;
  showStars?: boolean;
  ambientGlow?: boolean;
  phoneScale?: number;
  phoneOffset?: number;
  customColor1?: string;
  customColor2?: string;
  useCustomColors?: boolean;
  typographyPosition?: 'top' | 'bottom' | 'both';
  aspectRatio?: 'portrait' | 'landscape' | 'square';
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
    layout: 'appstore' | 'social' | 'duo-overlap' | 'duo-split';
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
  const [isIOSAppPickerOpen, setIsIOSAppPickerOpen] = useState(false);
  const [iosApps, setIOSApps] = useState<IOSSimulatorApp[]>([]);
  const [iosAppSearch, setIOSAppSearch] = useState('');
  const [selectedIOSBundleIdentifier, setSelectedIOSBundleIdentifier] = useState('');
  const [iosDevelopmentTeam, setIOSDevelopmentTeam] = useState('');
  const [isLoadingIOSApps, setIsLoadingIOSApps] = useState(false);
  const [iosAppsError, setIOSAppsError] = useState<string | null>(null);
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
  const [isCopySuccess, setIsCopySuccess] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Screen Recording Video State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordDurationSec, setRecordDurationSec] = useState<number>(10);
  const [recordedVideoBase64, setRecordedVideoBase64] = useState<string | null>(null);
  const [recordingCountdown, setRecordingCountdown] = useState<number>(0);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Customization Options
  const [themeId, setThemeId] = useState('studioLight');
  const [bezelId, setBezelId] = useState('iphone-16-pro');
  const [bezelCategory, setBezelCategory] = useState<'all' | 'apple' | 'android' | 'tablet' | 'frameless'>('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [layout, setLayout] = useState<'appstore' | 'social' | 'duo-overlap' | 'duo-split'>('appstore');
  const [secondaryScreenIndex, setSecondaryScreenIndex] = useState<number | null>(null);
  const [font, setFont] = useState('modern');
  const [headlineFont, setHeadlineFont] = useState('modern');
  const [subtitleFont, setSubtitleFont] = useState('match');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [titleScale, setTitleScale] = useState<number>(1.0);
  const [subtitleScale, setSubtitleScale] = useState<number>(1.0);
  const [activeTextLayer, setActiveTextLayer] = useState<'headline' | 'callout'>('headline');
  const [titleWeight, setTitleWeight] = useState<'400' | '600' | '700' | '800' | '900'>('800');
  const [subtitleWeight, setSubtitleWeight] = useState<string>('500');
  const [isItalic, setIsItalic] = useState(false);
  const [subtitleItalic, setSubtitleItalic] = useState(false);
  const [textOffset, setTextOffset] = useState<number>(0);
  const [bottomTextOffset, setBottomTextOffset] = useState<number>(0);
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
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'landscape' | 'square'>('portrait');
  const [isFitMode, setIsFitMode] = useState<boolean>(true);

  // Images & Screen Session History
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string>('image/webp');
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
  const screensRef = useRef<SessionScreen[]>(screens);
  screensRef.current = screens;
  const activeScreenIndexRef = useRef<number>(activeScreenIndex);
  activeScreenIndexRef.current = activeScreenIndex;
  const secondaryScreenIndexRef = useRef<number | null>(secondaryScreenIndex);
  secondaryScreenIndexRef.current = secondaryScreenIndex;
  const layoutRef = useRef<'appstore' | 'social' | 'duo-overlap' | 'duo-split'>(layout);
  layoutRef.current = layout;

  // Interactive on-canvas text dragging state & refs
  const [isDraggingText, setIsDraggingText] = useState<'top' | 'bottom' | null>(null);
  const dragTargetRef = useRef<'top' | 'bottom'>('top');
  const dragStartYRef = useRef(0);
  const startOffsetRef = useRef(0);
  const currentDragOffsetRef = useRef(0);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);

  const handleTextDragStart = (e: React.MouseEvent, target: 'top' | 'bottom' = 'top') => {
    e.preventDefault();
    e.stopPropagation();
    setActiveTextLayer(target === 'top' ? 'headline' : 'callout');
    dragTargetRef.current = target;
    setIsDraggingText(target);
    dragStartYRef.current = e.clientY;
    const initialOffset = target === 'top' ? textOffset : bottomTextOffset;
    startOffsetRef.current = initialOffset;
    currentDragOffsetRef.current = initialOffset;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaY = moveEvent.clientY - dragStartYRef.current;
      const newOffset = Math.max(-200, Math.min(200, Math.round(startOffsetRef.current + deltaY * 1.5)));
      currentDragOffsetRef.current = newOffset;
      if (dragGhostRef.current) {
        dragGhostRef.current.style.transform = `translate3d(0, ${deltaY}px, 0)`;
      }
    };

    const handleMouseUp = async () => {
      const finalOffset = currentDragOffsetRef.current;
      const targetType = dragTargetRef.current;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      // Update state immediately
      if (targetType === 'top') {
        setTextOffset(finalOffset);
      } else {
        setBottomTextOffset(finalOffset);
      }

      // Optimistically hold ghost at final location until server composite completes
      try {
        await refreshPreview(undefined, {
          [targetType === 'top' ? 'textOffset' : 'bottomTextOffset']: finalOffset,
        });
      } finally {
        setIsDraggingText(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // 1. Setup Live Device Discovery (Immediate REST fetch + SSE with polling fallback)
  useEffect(() => {
    let fallbackInterval: NodeJS.Timeout | null = null;

    const processDevicePayload = (data: { devices?: ConnectedDevice[]; activeApp?: string | null }) => {
      if (data.devices) {
        const newDevices: ConnectedDevice[] = data.devices;
        setDevices(newDevices);
        setSelectedDevice((prevSelected) => {
          if (!newDevices || newDevices.length === 0) return '';
          const usbDev = newDevices.find((d) => d.platform === 'android' && d.type === 'usb' && d.isAuthorized);
          const currentDev = newDevices.find((d) => d.id === prevSelected);

          if (!currentDev) {
            return usbDev ? usbDev.id : newDevices[0].id;
          }

          if (currentDev.platform === 'android' && currentDev.type === 'wifi' && usbDev && usbDev.id !== prevSelected) {
            return usbDev.id;
          }

          return prevSelected;
        });
      }
      if (data.activeApp !== undefined) {
        setActiveApp((prev) => {
          if (prev && prev !== data.activeApp) {
            setTimeout(() => handleSnap(true), 300);
          }
          return data.activeApp;
        });
      }
    };

    // Immediate REST discovery on mount (returns in ~10ms without waiting for SSE)
    const fetchImmediateDevices = async () => {
      try {
        const res = await fetch('/api/devices');
        if (res.ok) {
          const data = await res.json();
          processDevicePayload(data);
        }
      } catch {}
    };
    fetchImmediateDevices();

    const sse = new EventSource('/api/events');

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        processDevicePayload(data);
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    };

    sse.onerror = () => {
      // Fallback polling if SSE disconnects or isn't supported in iframe
      if (!fallbackInterval) {
        fallbackInterval = setInterval(fetchImmediateDevices, 3000);
      }
    };

    return () => {
      sse.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
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
        const effSubtitleWeight = overrides?.subtitleWeight !== undefined ? overrides.subtitleWeight : subtitleWeight;
        const effIsItalic = overrides?.isItalic !== undefined ? overrides.isItalic : isItalic;
        const effSubtitleItalic = overrides?.subtitleItalic !== undefined ? overrides.subtitleItalic : subtitleItalic;
        const effTextOffset = overrides?.textOffset !== undefined ? overrides.textOffset : textOffset;
        const effBottomTextOffset = overrides?.bottomTextOffset !== undefined ? overrides.bottomTextOffset : bottomTextOffset;
        const effTitle = overrides?.customTitle !== undefined ? overrides.customTitle : title;
        const effSubtitle = overrides?.subtitle !== undefined ? overrides.subtitle : subtitle;
        const effShowStars = overrides?.showStars !== undefined ? overrides.showStars : showStars;
        const effTypoPos = overrides?.typographyPosition !== undefined ? overrides.typographyPosition : typographyPosition;
        const effPhoneScale = overrides?.phoneScale !== undefined ? overrides.phoneScale : phoneScale;
        const effPhoneOffset = overrides?.phoneOffset !== undefined ? overrides.phoneOffset : phoneOffset;
        const effAmbientGlow = overrides?.ambientGlow !== undefined ? overrides.ambientGlow : ambientGlow;
        const currentScreens = screensRef.current.length > 0 ? screensRef.current : screens;
        const currentActiveIdx = activeScreenIndexRef.current;
        const currentScreen = currentScreens[currentActiveIdx];
        const effAspectRatio = overrides?.aspectRatio || currentScreen?.aspectRatio || aspectRatio;
        const effSecIdx = overrides?.secondaryScreenIndex !== undefined ? overrides.secondaryScreenIndex : secondaryScreenIndex;

        let effSecondaryBase64: string | undefined = undefined;
        if (effLayout === 'duo-overlap' || effLayout === 'duo-split') {
          if (effSecIdx !== null && effSecIdx !== undefined && currentScreens[effSecIdx]) {
            effSecondaryBase64 = currentScreens[effSecIdx].base64;
          } else if (currentScreens.length > 1) {
            const nextIdx = (currentActiveIdx + 1) % currentScreens.length;
            effSecondaryBase64 = currentScreens[nextIdx].base64;
          } else {
            effSecondaryBase64 = rawScreenshot || overrides?.base64 || screenshotBase64 || undefined;
          }
        }

        const effRawScreenshot =
          rawScreenshot ||
          overrides?.base64 ||
          screenshotBase64 ||
          currentScreens[currentActiveIdx]?.base64 ||
          currentScreens[0]?.base64 ||
          undefined;

        if (!effRawScreenshot) {
          setIsRendering(false);
          return;
        }

        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            screenshotBase64: effRawScreenshot,
            secondaryScreenshotBase64: effSecondaryBase64,
            deviceId: selectedDevice || undefined,
            bezelId: effBezelId,
            gradientPreset: effThemeId,
            layout: effLayout,
            aspectRatio: effAspectRatio,
            font: effHeadlineFont,
            headlineFont: effHeadlineFont,
            subtitleFont: effSubtitleFont === 'match' ? effHeadlineFont : effSubtitleFont,
            textAlign: effTextAlign,
            titleScaleMultiplier: effTitleScale,
            subtitleScaleMultiplier: effSubtitleScale,
            titleWeight: effTitleWeight,
            subtitleWeight: effSubtitleWeight,
            isItalic: effIsItalic,
            subtitleItalic: effSubtitleItalic,
            textYOffset: effTextOffset,
            bottomTextOffset: effBottomTextOffset,
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
          if (data.mime) setPreviewMime(data.mime);
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
      secondaryScreenIndex,
      headlineFont,
      subtitleFont,
      textAlign,
      titleScale,
      subtitleScale,
      titleWeight,
      subtitleWeight,
      isItalic,
      subtitleItalic,
      textOffset,
      bottomTextOffset,
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
      aspectRatio,
    ]
  );

  // Debounced auto-preview when styling knobs change
  useEffect(() => {
    if (isSelectingScreenRef.current) {
      isSelectingScreenRef.current = false;
      return;
    }
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
    aspectRatio,
    layout,
    secondaryScreenIndex,
    headlineFont,
    subtitleFont,
    textAlign,
    titleScale,
    subtitleScale,
    titleWeight,
    subtitleWeight,
    isItalic,
    subtitleItalic,
    textOffset,
    bottomTextOffset,
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
          subtitleWeight,
          isItalic,
          subtitleItalic,
          textOffset,
          bottomTextOffset,
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
    subtitleWeight,
    isItalic,
    subtitleItalic,
    textOffset,
    bottomTextOffset,
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

  // 1-Click Load Crisp Mobile Demo Sample
  const handleLoadDemoScreen = useCallback(async () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 2400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 2400);
      bgGrad.addColorStop(0, '#0a0d14');
      bgGrad.addColorStop(1, '#05070a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 2400);

      // Status Bar (Top)
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 44px -apple-system, sans-serif';
      ctx.fillText('9:41', 70, 100);

      // Top icons (Wi-Fi, Battery)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(930, 70, 70, 36);
      ctx.fillRect(936, 76, 50, 24);
      ctx.fillRect(1002, 82, 6, 12);

      // App Bar
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 36px -apple-system, sans-serif';
      ctx.fillText('FINANCE PULSE', 70, 210);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px -apple-system, sans-serif';
      ctx.fillText('Alex Morgan', 70, 285);

      // Profile Avatar circle
      ctx.beginPath();
      ctx.arc(970, 245, 50, 0, Math.PI * 2);
      const avatarGrad = ctx.createLinearGradient(920, 195, 1020, 295);
      avatarGrad.addColorStop(0, '#38bdf8');
      avatarGrad.addColorStop(1, '#6366f1');
      ctx.fillStyle = avatarGrad;
      ctx.fill();

      // Hero Card
      const heroGrad = ctx.createLinearGradient(70, 360, 1010, 840);
      heroGrad.addColorStop(0, '#1e1b4b');
      heroGrad.addColorStop(0.5, '#312e81');
      heroGrad.addColorStop(1, '#4338ca');
      ctx.fillStyle = heroGrad;
      ctx.beginPath();
      ctx.roundRect(70, 360, 940, 500, 48);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Hero Card Content
      ctx.fillStyle = '#a5b4fc';
      ctx.font = '600 38px -apple-system, sans-serif';
      ctx.fillText('Total Portfolio Value', 130, 445);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 96px -apple-system, sans-serif';
      ctx.fillText('$84,290.40', 130, 560);

      // Badge pill
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.beginPath();
      ctx.roundRect(130, 610, 280, 60, 30);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 34px -apple-system, sans-serif';
      ctx.fillText('▲ +14.8% this week', 150, 652);

      // Action Pills
      const actions = ['Send', 'Receive', 'Swap', 'Vault'];
      actions.forEach((act, i) => {
        const x = 70 + i * 242;
        ctx.fillStyle = '#161b26';
        ctx.beginPath();
        ctx.roundRect(x, 910, 212, 130, 32);
        ctx.fill();
        ctx.strokeStyle = '#273142';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 38px -apple-system, sans-serif';
        ctx.fillText('●', x + 92, 965);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '600 32px -apple-system, sans-serif';
        ctx.fillText(act, x + 62, 1010);
      });

      // Section: Highlights
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px -apple-system, sans-serif';
      ctx.fillText('Market Highlights', 70, 1130);

      // 4 Feature Cards
      const items = [
        { title: 'Ethereum Staking', sub: 'Yield reward distributed', amt: '+$420.00', color: '#6366f1' },
        { title: 'Apple Inc. (AAPL)', sub: 'Dividend payout received', amt: '+$84.50', color: '#10b981' },
        { title: 'Cloud Infrastructure', sub: 'Monthly subscription', amt: '-$12.00', color: '#f43f5e' },
        { title: 'Solana Network', sub: 'Validator fee earned', amt: '+$190.20', color: '#8b5cf6' },
      ];

      items.forEach((item, idx) => {
        const y = 1180 + idx * 200;
        ctx.fillStyle = '#11151f';
        ctx.beginPath();
        ctx.roundRect(70, y, 940, 170, 32);
        ctx.fill();
        ctx.strokeStyle = '#202636';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(150, y + 85, 42, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px -apple-system, sans-serif';
        ctx.fillText(item.title, 220, y + 78);

        ctx.fillStyle = '#64748b';
        ctx.font = '400 32px -apple-system, sans-serif';
        ctx.fillText(item.sub, 220, y + 124);

        ctx.fillStyle = item.amt.startsWith('+') ? '#34d399' : '#f87171';
        ctx.font = 'bold 40px -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(item.amt, 950, y + 100);
        ctx.textAlign = 'left';
      });

      // Bottom Navigation Bar
      ctx.fillStyle = '#0d111a';
      ctx.fillRect(0, 2200, 1080, 200);
      ctx.strokeStyle = '#1e2535';
      ctx.beginPath();
      ctx.moveTo(0, 2200);
      ctx.lineTo(1080, 2200);
      ctx.stroke();

      // Home indicator pill
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(380, 2360, 320, 12, 6);
      ctx.fill();

      const demoBase64 = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
      setScreenshotBase64(demoBase64);
      lastScreenBase64Ref.current = demoBase64;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newScreen: SessionScreen = {
        id: `demo-${Date.now()}`,
        index: screens.length + 1,
        label: `Sample #${screens.length + 1}`,
        base64: demoBase64,
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

      setScreens((prev) => {
        setActiveScreenIndex(prev.length);
        return [...prev, newScreen];
      });

      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToastMessage('🎨 Loaded sample mobile screen!');
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);

      await refreshPreview(demoBase64);
    } catch (err) {
      console.error('Failed to generate demo sample:', err);
    }
  }, [
    screens.length,
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
    showStars,
    ambientGlow,
    phoneScale,
    phoneOffset,
    customColor1,
    customColor2,
    useCustomColors,
    typographyPosition,
    refreshPreview,
  ]);

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
          const usbDev = data.devices.find((d: ConnectedDevice) => d.platform === 'android' && d.type === 'usb' && d.isAuthorized);
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
          const found = refreshData.devices.find((d: ConnectedDevice) => d.platform === 'android' && d.type === 'wifi') || refreshData.devices[0];
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

  const setPhone1Screen = (idx: number) => {
    if (idx < 0 || idx >= screens.length) return;
    isSelectingScreenRef.current = true;
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }

    let newSecIdx = secondaryScreenIndex;
    // Smart Swap: If clicked index is currently Phone 2, swap them
    if (idx === secondaryScreenIndex) {
      newSecIdx = activeScreenIndex;
    } else if (newSecIdx === null && screens.length > 1) {
      newSecIdx = (idx + 1) % screens.length;
    }

    setActiveScreenIndex(idx);
    setScreenshotBase64(screens[idx].base64);
    setSecondaryScreenIndex(newSecIdx);

    setScreens((prev) => {
      const copy = [...prev];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], secondaryScreenIndex: newSecIdx, layout };
      }
      return copy;
    });

    refreshPreview(screens[idx].base64, {
      base64: screens[idx].base64,
      secondaryScreenIndex: newSecIdx,
      layout,
    });
  };

  const setPhone2Screen = (idx: number) => {
    if (idx < 0 || idx >= screens.length) return;
    isSelectingScreenRef.current = true;
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }

    // Smart Swap: If user clicks P2 on current Phone 1, swap them
    if (idx === activeScreenIndex) {
      const oldSec = secondaryScreenIndex !== null ? secondaryScreenIndex : (activeScreenIndex + 1) % screens.length;
      setActiveScreenIndex(oldSec);
      setScreenshotBase64(screens[oldSec].base64);
      setSecondaryScreenIndex(idx);

      setScreens((prev) => {
        const copy = [...prev];
        if (copy[oldSec]) {
          copy[oldSec] = { ...copy[oldSec], secondaryScreenIndex: idx, layout };
        }
        return copy;
      });

      refreshPreview(screens[oldSec].base64, {
        base64: screens[oldSec].base64,
        secondaryScreenIndex: idx,
        layout,
      });
      return;
    }

    setSecondaryScreenIndex(idx);
    setScreens((prev) => {
      if (!prev[activeScreenIndex]) return prev;
      const copy = [...prev];
      copy[activeScreenIndex] = { ...copy[activeScreenIndex], secondaryScreenIndex: idx, layout };
      return copy;
    });

    refreshPreview(undefined, {
      secondaryScreenIndex: idx,
      layout,
    });
  };

  const selectScreen = async (index: number) => {
    if (index < 0 || index >= screens.length) return;
    isSelectingScreenRef.current = true;
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }
    setActiveScreenIndex(index);
    const target = screens[index];
    if (target.customTitle !== undefined) setTitle(target.customTitle);
    if (target.subtitle !== undefined) setSubtitle(target.subtitle);
    if (target.themeId) setThemeId(target.themeId);
    if (target.bezelId) setBezelId(target.bezelId);

    // Protect duo layouts from being automatically reverted back to appstore
    const currentIsDuo = layout.startsWith('duo');
    if (!currentIsDuo && target.layout) {
      setLayout(target.layout);
    }

    let nextSecIdx = secondaryScreenIndex;
    if (!currentIsDuo) {
      nextSecIdx = target.secondaryScreenIndex !== undefined ? target.secondaryScreenIndex : null;
      setSecondaryScreenIndex(nextSecIdx);
    } else {
      // In duo mode, if the newly selected screen was the secondary screen, swap to the old primary
      if (secondaryScreenIndex === index) {
        nextSecIdx = activeScreenIndex;
        setSecondaryScreenIndex(nextSecIdx);
      }
    }

    if (target.font) setFont(target.font);
    if (target.headlineFont) setHeadlineFont(target.headlineFont);
    if (target.subtitleFont) setSubtitleFont(target.subtitleFont);
    if (target.textAlign) setTextAlign(target.textAlign);
    if (target.titleScale !== undefined) setTitleScale(target.titleScale);
    if (target.subtitleScale !== undefined) setSubtitleScale(target.subtitleScale);
    if (target.titleWeight) setTitleWeight(target.titleWeight);
    if (target.subtitleWeight) setSubtitleWeight(target.subtitleWeight);
    if (target.isItalic !== undefined) setIsItalic(target.isItalic);
    if (target.subtitleItalic !== undefined) setSubtitleItalic(target.subtitleItalic);
    if (target.textOffset !== undefined) setTextOffset(target.textOffset);
    setBottomTextOffset(target.bottomTextOffset ?? 0);
    if (target.showStars !== undefined) setShowStars(target.showStars);
    if (target.ambientGlow !== undefined) setAmbientGlow(target.ambientGlow);
    if (target.phoneScale !== undefined) setPhoneScale(target.phoneScale);
    if (target.phoneOffset !== undefined) setPhoneOffset(target.phoneOffset);
    if (target.customColor1) setCustomColor1(target.customColor1);
    if (target.customColor2) setCustomColor2(target.customColor2);
    setUseCustomColors(target.useCustomColors ?? false);
    if (target.typographyPosition) setTypographyPosition(target.typographyPosition);
    if (target.aspectRatio) setAspectRatio(target.aspectRatio);

    setScreenshotBase64(target.base64);
    await refreshPreview(target.base64, {
      ...target,
      layout: currentIsDuo ? layout : (target.layout || layout),
      secondaryScreenIndex: nextSecIdx,
    });
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
    const targetBase64 = previewBase64 || screens[activeScreenIndex]?.base64 || screens[0]?.base64;
    if (!targetBase64) {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToastMessage('⚠️ No screenshot to copy yet. Capture or drop an image first.');
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    if (isCopying) return;
    setIsCopying(true);
    try {
      const byteCharacters = atob(targetBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setIsCopySuccess(true);
      copyTimeoutRef.current = setTimeout(() => setIsCopySuccess(false), 2000);

      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToastMessage('📋 Mockup copied to clipboard! Paste in Figma or Slack');
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);

      try {
        window.parent.postMessage({ type: 'adbsnap-copied' }, '*');
      } catch {}
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Copy failed: ${msg}`);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToastMessage(`⚠️ Copy failed: ${msg.includes('focus') ? 'Click canvas to focus before copying' : msg}`);
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
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
      let secBase64: string | undefined = undefined;
      if (layout === 'duo-overlap' || layout === 'duo-split') {
        if (secondaryScreenIndex !== null && screens[secondaryScreenIndex]) {
          secBase64 = screens[secondaryScreenIndex].base64;
        } else if (screens.length > 1) {
          const nextIdx = (activeScreenIndex + 1) % screens.length;
          secBase64 = screens[nextIdx].base64;
        } else {
          secBase64 = screenshotBase64 || undefined;
        }
      }

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshotBase64,
          secondaryScreenshotBase64: secBase64,
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
          bottomTextOffset,
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
        subtitleWeight,
        isItalic,
        subtitleItalic,
        textOffset,
        bottomTextOffset,
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

  const handleStartRecord = async () => {
    setIsRecordingVideo(true);
    setRecordError(null);
    setRecordedVideoBase64(null);
    setRecordingCountdown(recordDurationSec);

    const timer = setInterval(() => {
      setRecordingCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const res = await fetch('/api/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seconds: recordDurationSec,
          deviceId: selectedDevice || undefined,
        }),
      });
      clearInterval(timer);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Recording failed');
      }
      setRecordedVideoBase64(data.base64);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToastMessage(`🎬 Screen video recording complete (${data.duration}s)!`);
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setRecordError(err.message || 'Error recording device video');
    } finally {
      setIsRecordingVideo(false);
    }
  };

  const handleSwapDuoScreens = () => {
    if (screens.length < 2) return;
    const p1 = activeScreenIndex;
    const p2 = secondaryScreenIndex !== null ? secondaryScreenIndex : (activeScreenIndex + 1) % screens.length;
    if (p1 === p2) return;
    selectScreen(p2);
    setSecondaryScreenIndex(p1);
    setScreens((prev) => {
      if (!prev[p2]) return prev;
      const copy = [...prev];
      copy[p2] = { ...copy[p2], secondaryScreenIndex: p1 };
      return copy;
    });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(`⇄ Swapped Phone 1 (Slide #${p2 + 1}) & Phone 2 (Slide #${p1 + 1})`);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
  };

  const openIOSAppPicker = async () => {
    if (!selectedDevice) {
      setStatusMessage('Select a connected iOS simulator or device first.');
      return;
    }
    setIsIOSAppPickerOpen(true);
    setIsLoadingIOSApps(true);
    setIOSAppsError(null);
    setIOSAppSearch('');
    try {
      const query = new URLSearchParams({ deviceId: selectedDevice });
      const res = await fetch(`/api/ios/apps?${query.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success || !Array.isArray(data.apps)) {
        throw new Error(data.error || `Could not load iOS apps (${res.status}).`);
      }
      const apps = data.apps as IOSSimulatorApp[];
      setIOSApps(apps);
      setSelectedIOSBundleIdentifier((current) => {
        const currentApp = apps.find((app) => app.bundleIdentifier === current);
        if (currentApp && (!currentApp.isDemo || !apps.some((app) => !app.isDemo))) {
          return current;
        }
        return apps.find((app) => !app.isDemo)?.bundleIdentifier || apps[0]?.bundleIdentifier || '';
      });
    } catch (err) {
      setIOSApps([]);
      setIOSAppsError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingIOSApps(false);
    }
  };

  // 5. Autonomous Tab Crawler
  const handleAutonomousCrawl = async (iosBundleIdentifier?: string) => {
    if (activeDevice?.platform === 'ios' && !iosBundleIdentifier) {
      await openIOSAppPicker();
      return;
    }

    setIsCrawling(true);
    setStatusMessage(
      activeDevice?.platform === 'ios'
        ? activeDevice.type === 'emulator'
          ? 'Launching XCTest Auto Explorer on iOS Simulator...'
          : 'Signing and launching XCTest Auto Explorer on the connected iOS device...'
        : 'Autonomous Crawler scanning tabs on mobile device...'
    );
    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice || undefined,
          bundleIdentifier: iosBundleIdentifier,
          developmentTeam: iosDevelopmentTeam.trim().toUpperCase() || undefined,
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

  // Universal Keyboard Shortcuts: Space (Sync), Ctrl+C (Copy), Arrows (Navigate), Delete (Remove)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        (e.target as HTMLElement)?.tagName === 'INPUT' ||
        (e.target as HTMLElement)?.tagName === 'TEXTAREA' ||
        (e.target as HTMLElement)?.isContentEditable;
      if (isInput) return;
      if (e.repeat) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleSnap();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleCopyImage();
      } else if (e.key === 'ArrowLeft') {
        if (screens.length > 1 && activeScreenIndex > 0) {
          e.preventDefault();
          selectScreen(activeScreenIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (screens.length > 1 && activeScreenIndex < screens.length - 1) {
          e.preventDefault();
          selectScreen(activeScreenIndex + 1);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (screens.length > 0) {
          e.preventDefault();
          deleteScreen(e as unknown as React.MouseEvent, activeScreenIndex);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSnap, handleCopyImage, screens.length, activeScreenIndex]);

  const activeDevice = devices.find((d) => d.id === selectedDevice) || devices[0];
  const filteredIOSApps = iosApps.filter((app) =>
    `${app.name} ${app.bundleIdentifier}`.toLowerCase().includes(iosAppSearch.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0b0e] text-slate-100 font-sans">
      {isIOSAppPickerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsIOSAppPickerOpen(false);
          }}
        >
          <section
            aria-labelledby="ios-app-picker-title"
            aria-modal="true"
            className="flex max-h-[min(80vh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#303746] bg-[#11141b] shadow-2xl"
            role="dialog"
          >
            <header className="flex items-start justify-between border-b border-[#232733] p-5">
              <div>
                <h2 id="ios-app-picker-title" className="text-base font-semibold text-white">
                  Choose an iOS app
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Captures tabs and safe navigation links up to 2 levels deep (20 screens max).
                  {activeDevice?.type !== 'emulator' && ' The app may be relaunched during exploration.'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close app picker"
                onClick={() => setIsIOSAppPickerOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="border-b border-[#232733] p-4">
              <input
                autoFocus
                type="search"
                value={iosAppSearch}
                onChange={(event) => setIOSAppSearch(event.target.value)}
                placeholder="Search by app name or bundle ID"
                aria-label="Search iOS apps"
                className="w-full rounded-lg border border-[#303746] bg-[#0b0d12] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {activeDevice?.type !== 'emulator' && (
              <div className="border-b border-[#232733] px-4 py-3">
                <label htmlFor="ios-development-team" className="block text-xs font-medium text-slate-200">
                  Apple Developer Team ID
                </label>
                <input
                  id="ios-development-team"
                  type="text"
                  value={iosDevelopmentTeam}
                  onChange={(event) => setIOSDevelopmentTeam(event.target.value.toUpperCase())}
                  placeholder="10-character Team ID"
                  autoComplete="off"
                  maxLength={10}
                  pattern="[A-Za-z0-9]{10}"
                  aria-describedby="ios-team-help"
                  className="mt-1.5 w-full rounded-lg border border-[#303746] bg-[#0b0d12] px-3 py-2 font-mono text-sm uppercase text-slate-100 placeholder:font-sans placeholder:normal-case placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <p id="ios-team-help" className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                  Xcode uses this team to sign its temporary UI-test runner. A free Personal Team may work;
                  Xcode must be signed in and the phone must trust this Mac with Developer Mode enabled.
                  Avoid running while the app has unsaved work.
                </p>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {isLoadingIOSApps ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading apps from device...
                </div>
              ) : iosAppsError ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  <p>{iosAppsError}</p>
                  <button
                    type="button"
                    onClick={() => void openIOSAppPicker()}
                    className="mt-2 font-semibold text-red-200 underline underline-offset-2"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredIOSApps.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  No apps match “{iosAppSearch}”.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {filteredIOSApps.map((app) => {
                    const isSelected = selectedIOSBundleIdentifier === app.bundleIdentifier;
                    return (
                      <li key={app.bundleIdentifier}>
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedIOSBundleIdentifier(app.bundleIdentifier)}
                          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                            isSelected
                              ? 'border-cyan-500/60 bg-cyan-500/10'
                              : 'border-transparent bg-[#191d26] hover:border-slate-600'
                          }`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-cyan-300">
                            <Smartphone className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2 text-sm font-medium text-white">
                              <span className="truncate">{app.name}</span>
                              {app.isDemo && (
                                <span className="shrink-0 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] text-indigo-300">
                                  Sample
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block truncate font-mono text-[11px] text-slate-400">
                              {app.bundleIdentifier}
                            </span>
                          </span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-[#232733] p-4">
              <p className="text-[11px] text-slate-500">
                {iosApps.length} app{iosApps.length === 1 ? '' : 's'} available
              </p>
              <button
                type="button"
                disabled={
                  isLoadingIOSApps ||
                  Boolean(iosAppsError) ||
                  iosApps.length === 0 ||
                  !selectedIOSBundleIdentifier ||
                  (activeDevice?.type !== 'emulator' && !/^[A-Z0-9]{10}$/.test(iosDevelopmentTeam.trim().toUpperCase()))
                }
                onClick={() => {
                  setIsIOSAppPickerOpen(false);
                  void handleAutonomousCrawl(selectedIOSBundleIdentifier);
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Explore selected app
              </button>
            </footer>
          </section>
        </div>
      )}

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

        {/* Live Device Status & Device Selector */}
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
                        const otherDevices = devices.filter((d) => d.id !== activeDevice.id);
                        const otherDev =
                          otherDevices.find((d) => d.platform === activeDevice.platform && d.isAuthorized) ||
                          otherDevices.find((d) => d.isAuthorized) ||
                          otherDevices[0];
                        if (otherDev) {
                          setSelectedDevice(otherDev.id);
                          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                          setToastMessage(`Switched to ${otherDev.model} (${deviceConnectionLabel(otherDev)})`);
                          toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
                        }
                      }}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 shrink-0 transition cursor-pointer border border-slate-700/60"
                      title="Multiple devices connected. Click to switch the active device."
                    >
                      {activeDevice.platform === 'ios' ? (
                        <Smartphone className="w-2.5 h-2.5 text-cyan-400" />
                      ) : activeDevice.type === 'wifi' ? (
                        <Wifi className="w-2.5 h-2.5 text-cyan-400" />
                      ) : (
                        <Cable className="w-2.5 h-2.5 text-amber-400" />
                      )}
                      <span>{deviceConnectionLabel(activeDevice)} ▾</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1 shrink-0">
                      {activeDevice.platform === 'ios' ? (
                        <Smartphone className="w-2.5 h-2.5 text-cyan-400" />
                      ) : activeDevice.type === 'wifi' ? (
                        <Wifi className="w-2.5 h-2.5 text-cyan-400" />
                      ) : (
                        <Cable className="w-2.5 h-2.5 text-amber-400" />
                      )}
                      <span>{deviceConnectionLabel(activeDevice)}</span>
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
            {activeDevice && activeDevice.platform === 'android' && activeDevice.type === 'usb' && (
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
            {activeDevice && activeDevice.platform === 'android' && activeDevice.type === 'wifi' && (
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

          {/* Record Device Screen Video Action */}
          <button
            onClick={() => {
              setIsRecordModalOpen(true);
              setRecordedVideoBase64(null);
              setRecordError(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer shrink-0"
            title="Record connected device screen (Android & iOS Simulator MP4)"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Record</span>
          </button>

          {/* Autonomous Crawl Action */}
          <button
            onClick={() => void handleAutonomousCrawl()}
            disabled={isCrawling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer shrink-0"
            title={
              activeDevice?.platform === 'ios'
                ? activeDevice.type === 'emulator'
                  ? 'Explore accessible iOS tabs and navigation links using XCTest'
                  : 'Explore accessible iOS app screens on a connected device using XCTest; requires an Apple Developer Team ID'
                : 'Automatically explore app tabs and capture screens'
            }
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

              <div className={`space-y-2.5 transition ${themeId === 'none' ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLayout('appstore');
                      setScreens((prev) => {
                        if (!prev[activeScreenIndex]) return prev;
                        const copy = [...prev];
                        copy[activeScreenIndex] = { ...copy[activeScreenIndex], layout: 'appstore' };
                        return copy;
                      });
                    }}
                    className={`p-2 rounded-lg border text-xs text-center transition cursor-pointer ${
                      layout === 'appstore'
                        ? 'border-cyan-500 bg-cyan-500/10 text-white font-medium shadow-sm shadow-cyan-500/20'
                        : 'border-[#232733] bg-[#161922] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📱 App Store (Bleed)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLayout('social');
                      setScreens((prev) => {
                        if (!prev[activeScreenIndex]) return prev;
                        const copy = [...prev];
                        copy[activeScreenIndex] = { ...copy[activeScreenIndex], layout: 'social' };
                        return copy;
                      });
                    }}
                    className={`p-2 rounded-lg border text-xs text-center transition cursor-pointer ${
                      layout === 'social'
                        ? 'border-cyan-500 bg-cyan-500/10 text-white font-medium shadow-sm shadow-cyan-500/20'
                        : 'border-[#232733] bg-[#161922] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🌐 Social (Floating)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLayout('duo-overlap');
                      setScreens((prev) => {
                        if (!prev[activeScreenIndex]) return prev;
                        const copy = [...prev];
                        copy[activeScreenIndex] = { ...copy[activeScreenIndex], layout: 'duo-overlap' };
                        return copy;
                      });
                    }}
                    className={`p-2 rounded-lg border text-xs text-center transition cursor-pointer ${
                      layout === 'duo-overlap'
                        ? 'border-cyan-500 bg-cyan-500/10 text-white font-medium shadow-sm shadow-cyan-500/20'
                        : 'border-[#232733] bg-[#161922] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📱📱 Duo Overlap
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLayout('duo-split');
                      setScreens((prev) => {
                        if (!prev[activeScreenIndex]) return prev;
                        const copy = [...prev];
                        copy[activeScreenIndex] = { ...copy[activeScreenIndex], layout: 'duo-split' };
                        return copy;
                      });
                    }}
                    className={`p-2 rounded-lg border text-xs text-center transition cursor-pointer ${
                      layout === 'duo-split'
                        ? 'border-cyan-500 bg-cyan-500/10 text-white font-medium shadow-sm shadow-cyan-500/20'
                        : 'border-[#232733] bg-[#161922] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🔲 Duo Split (Twin)
                  </button>
                </div>

                {(layout === 'duo-overlap' || layout === 'duo-split') && (
                  <div className="p-2.5 rounded-lg bg-[#12151e] border border-cyan-500/30 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        📱 Secondary Phone Screen
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {secondaryScreenIndex !== null && screens[secondaryScreenIndex] ? `Slide #${secondaryScreenIndex + 1}` : 'Auto (Next)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSecondaryScreenIndex(null);
                          setScreens((prev) => {
                            if (!prev[activeScreenIndex]) return prev;
                            const copy = [...prev];
                            copy[activeScreenIndex] = { ...copy[activeScreenIndex], secondaryScreenIndex: null };
                            return copy;
                          });
                          refreshPreview(undefined, { secondaryScreenIndex: null, layout });
                        }}
                        className={`px-2 py-1 rounded text-[11px] border transition cursor-pointer whitespace-nowrap ${
                          secondaryScreenIndex === null
                            ? 'border-cyan-500 bg-cyan-500/20 text-white font-medium'
                            : 'border-[#232733] bg-[#161922] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Auto (Next)
                      </button>
                      {screens.map((scr, idx) => (
                        <button
                          key={scr.id}
                          type="button"
                          onClick={() => {
                            setPhone2Screen(idx);
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border transition cursor-pointer whitespace-nowrap ${
                            secondaryScreenIndex === idx
                              ? 'border-cyan-500 bg-cyan-500/20 text-white font-medium'
                              : 'border-[#232733] bg-[#161922] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <img src={`data:image/png;base64,${scr.base64}`} alt={`Screen ${idx + 1}`} className="w-3 h-5 object-cover rounded-[2px]" />
                          <span>#{idx + 1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                      onClick={() => {
                        setTypographyPosition('top');
                        setActiveTextLayer('headline');
                      }}
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
                      onClick={() => {
                        setTypographyPosition('bottom');
                        setActiveTextLayer('callout');
                      }}
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

                {/* 1. Headline Text Box */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <button
                      type="button"
                      onClick={() => setActiveTextLayer('headline')}
                      className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer text-left"
                    >
                      <span>🔤 Headline Text</span>
                      {activeTextLayer === 'headline' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-normal">
                          Active Styling
                        </span>
                      )}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-[#0f1117] border border-cyan-500/30 rounded px-1.5 py-0.5">
                        <Wand2 className="w-3 h-3 text-cyan-400 shrink-0" />
                        <select
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__clear__') {
                              setTitle('');
                              setSubtitle('');
                              if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                              setToastMessage('✕ Cleared copy');
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
                          style={{ backgroundColor: '#0f1117', color: '#67e8f9' }}
                          className="text-[10px] bg-[#0f1117] text-cyan-300 cursor-pointer focus:outline-none border-0"
                          title="Magic Copy Templates & Presets"
                        >
                          <option value="" disabled style={{ backgroundColor: '#0f1117', color: '#94a3b8' }}>
                            Magic Copy...
                          </option>
                          <option value="__clear__" style={{ backgroundColor: '#0f1117', color: '#fb7185' }} className="font-medium">
                            ✕ Clear All Copy
                          </option>
                          <option value="__reset__" style={{ backgroundColor: '#0f1117', color: '#fcd34d' }} className="font-medium">
                            ↺ Reset Default Copy
                          </option>
                          <option disabled style={{ backgroundColor: '#0f1117', color: '#475569' }}>
                            ───────────────────────────
                          </option>
                          {MAGIC_COPY_TEMPLATES.map((tpl) => (
                            <option
                              key={tpl.name}
                              value={tpl.name}
                              style={{ backgroundColor: '#0f1117', color: '#f1f5f9' }}
                            >
                              {tpl.name}: &quot;{tpl.title.replace(/\*\*/g, '')}&quot;
                            </option>
                          ))}
                        </select>
                      </div>

                      {title && (
                        <button
                          type="button"
                          onClick={() => {
                            setTitle('');
                            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                            setToastMessage('✕ Cleared headline');
                            toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 1800);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition cursor-pointer"
                          title="Clear headline"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={title}
                    onFocus={() => setActiveTextLayer('headline')}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter punchy headline (press Enter for new line)..."
                    className={`w-full bg-[#161922] border rounded-lg p-2 text-xs text-white focus:outline-none resize-none font-sans leading-relaxed transition ${
                      activeTextLayer === 'headline'
                        ? 'border-cyan-500/80 ring-1 ring-cyan-500/30'
                        : 'border-[#232733] hover:border-slate-700'
                    }`}
                  />

                  {/* Quick Magic Copy Chips */}
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    <span className="text-[9px] text-slate-500 font-medium mr-0.5">Presets:</span>
                    {MAGIC_COPY_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.name}
                        type="button"
                        onClick={() => {
                          setTitle(tpl.title);
                          setSubtitle(tpl.subtitle);
                          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                          setToastMessage(`✨ Applied "${tpl.name}"`);
                          toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2000);
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-[#161922] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-[#232733] hover:border-cyan-500/40 transition cursor-pointer"
                        title={`${tpl.title.replace(/\*\*/g, '')} — ${tpl.subtitle}`}
                      >
                        {tpl.name.split('/')[0].trim()}
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-500 mt-1">
                    Tip: Use <span className="text-cyan-400 font-mono font-bold">**bold radiant**</span> and <span className="text-cyan-300 font-mono italic">*italic*</span> for accents.
                  </p>
                </div>

                {/* 2. Subtitle Text Box */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <button
                      type="button"
                      onClick={() => setActiveTextLayer('callout')}
                      className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer text-left"
                    >
                      <span>💬 Subtitle {typographyPosition === 'both' ? '(Bottom Callout)' : ''}</span>
                      {activeTextLayer === 'callout' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-normal">
                          Active Styling
                        </span>
                      )}
                    </button>
                    {subtitle && (
                      <button
                        type="button"
                        onClick={() => {
                          setSubtitle('');
                          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                          setToastMessage('✕ Cleared subtitle');
                          toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 1800);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition cursor-pointer"
                        title="Clear subtitle"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={2}
                    value={subtitle}
                    onFocus={() => setActiveTextLayer('callout')}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder={typographyPosition === 'both' ? 'Enter bottom callout or feature copy...' : 'Enter explanatory subtitle copy...'}
                    className={`w-full bg-[#161922] border rounded-lg p-2 text-xs text-white focus:outline-none resize-none font-sans leading-relaxed transition ${
                      activeTextLayer === 'callout'
                        ? 'border-cyan-500/80 ring-1 ring-cyan-500/30'
                        : 'border-[#232733] hover:border-slate-700'
                    }`}
                  />
                </div>

                {/* Contextual Typography Styling Bar Header */}
                <div className="pt-1.5 border-t border-[#232733]/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      Typography Styling
                    </span>
                    <div className="flex items-center gap-1 bg-[#0f1117] p-0.5 rounded-lg border border-[#232733]">
                      <button
                        type="button"
                        onClick={() => setActiveTextLayer('headline')}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                          activeTextLayer === 'headline'
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🔤 Headline
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTextLayer('callout')}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                          activeTextLayer === 'callout'
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        💬 Subtitle
                      </button>
                    </div>
                  </div>
                </div>

                {/* Universal Alignment, Weight & Italic Bar for Active Layer */}
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

                  {/* Weight Selector for Active Layer */}
                  <select
                    value={activeTextLayer === 'headline' ? titleWeight : subtitleWeight}
                    onChange={(e) => {
                      if (activeTextLayer === 'headline') {
                        setTitleWeight(e.target.value as any);
                      } else {
                        setSubtitleWeight(e.target.value);
                      }
                    }}
                    className="bg-[#0f1117] border border-[#232733] text-slate-300 rounded px-1.5 py-1 text-[11px] focus:outline-none cursor-pointer"
                    title={`${activeTextLayer === 'headline' ? 'Headline' : 'Subtitle'} Font Weight`}
                  >
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semi (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra (800)</option>
                    <option value="900">Black (900)</option>
                  </select>

                  {/* Italic Toggle for Active Layer */}
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTextLayer === 'headline') {
                        setIsItalic(!isItalic);
                      } else {
                        setSubtitleItalic(!subtitleItalic);
                      }
                    }}
                    className={`flex items-center justify-center gap-1 rounded border text-[11px] py-1 font-medium transition cursor-pointer ${
                      (activeTextLayer === 'headline' ? isItalic : subtitleItalic)
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                        : 'bg-[#0f1117] border-[#232733] text-slate-400 hover:text-slate-200'
                    }`}
                    title="Toggle Italic typography"
                  >
                    <Italic className="w-3 h-3" />
                    <span>Italic</span>
                  </button>
                </div>

                {/* Universal Font Selector for Active Layer */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">
                    {activeTextLayer === 'headline' ? 'Headline Font' : 'Subtitle Font'}
                  </span>
                  <select
                    value={activeTextLayer === 'headline' ? headlineFont : subtitleFont}
                    onChange={(e) => {
                      if (activeTextLayer === 'headline') {
                        setHeadlineFont(e.target.value);
                        setFont(e.target.value);
                      } else {
                        setSubtitleFont(e.target.value);
                      }
                    }}
                    className="w-full bg-[#161922] border border-[#232733] rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {activeTextLayer === 'callout' && (
                      <option value="match">Match Headline Font ({FONTS.find((f) => f.id === headlineFont)?.name || 'Default'})</option>
                    )}
                    {FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Universal Precision Sliders for Active Layer */}
                <div className="p-2.5 rounded-lg bg-[#161922] border border-[#232733] space-y-3">
                  {/* Scale Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        {activeTextLayer === 'headline' ? 'Headline Scale' : 'Subtitle Scale'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-cyan-400 text-[11px] font-semibold">
                          {Math.round((activeTextLayer === 'headline' ? titleScale : subtitleScale) * 100)}%
                        </span>
                        {(activeTextLayer === 'headline' ? titleScale : subtitleScale) !== 1.0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (activeTextLayer === 'headline') setTitleScale(1.0);
                              else setSubtitleScale(1.0);
                            }}
                            className="text-[9px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={activeTextLayer === 'headline' ? "0.6" : "0.5"}
                      max={activeTextLayer === 'headline' ? "1.8" : "1.5"}
                      step="0.01"
                      value={activeTextLayer === 'headline' ? titleScale : subtitleScale}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (activeTextLayer === 'headline') setTitleScale(val);
                        else setSubtitleScale(val);
                      }}
                      className="w-full accent-cyan-500 cursor-pointer h-1 bg-[#232733] rounded-lg appearance-none"
                    />
                  </div>

                  {/* Vertical Nudge Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        {activeTextLayer === 'headline'
                          ? (typographyPosition === 'both' ? 'Top Headline Nudge' : 'Vertical Nudge')
                          : (typographyPosition === 'both' ? 'Bottom Callout Nudge' : 'Subtitle Nudge')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-cyan-400 text-[11px] font-semibold">
                          {(activeTextLayer === 'headline' ? textOffset : bottomTextOffset) > 0
                            ? `+${activeTextLayer === 'headline' ? textOffset : bottomTextOffset}px`
                            : `${activeTextLayer === 'headline' ? textOffset : bottomTextOffset}px`}
                        </span>
                        {(activeTextLayer === 'headline' ? textOffset : bottomTextOffset) !== 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (activeTextLayer === 'headline') setTextOffset(0);
                              else setBottomTextOffset(0);
                            }}
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
                      value={activeTextLayer === 'headline' ? textOffset : bottomTextOffset}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (activeTextLayer === 'headline') setTextOffset(val);
                        else setBottomTextOffset(val);
                      }}
                      className="w-full accent-cyan-500 cursor-pointer h-1 bg-[#232733] rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500">
                      <span>-200px (Higher)</span>
                      <span>0px (Default)</span>
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
          className="flex-1 bg-[#0a0b0e] flex flex-col items-center p-3 sm:p-5 relative overflow-y-auto overflow-x-hidden min-h-0"
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

          {/* Canvas Aspect Ratio & Zoom Toolbar */}
          <div className="mb-3 z-30 flex items-center gap-1.5 p-1 rounded-xl bg-[#12141c]/90 border border-white/10 shadow-lg backdrop-blur-md">
            {(['portrait', 'landscape', 'square'] as const).map((mode) => {
              const isAct = aspectRatio === mode;
              const label = mode === 'portrait' ? '📱 9:19.5 Store' : mode === 'landscape' ? '🖥️ 16:9 Banner' : '⬛ 1:1 Square';
              return (
                <button
                  key={mode}
                  onClick={() => {
                    setAspectRatio(mode);
                    setScreens((prev) => {
                      const next = [...prev];
                      if (next[activeScreenIndex]) {
                        next[activeScreenIndex] = { ...next[activeScreenIndex], aspectRatio: mode };
                      }
                      return next;
                    });
                    refreshPreview(undefined, { aspectRatio: mode });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isAct
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                  title={mode === 'portrait' ? 'App Store & Google Play standard' : mode === 'landscape' ? 'Product Hunt & Twitter landscape header' : 'Social media square post'}
                >
                  {label}
                </button>
              );
            })}

            <div className="w-px h-3.5 bg-white/15 mx-0.5" />

            {/* Segmented Zoom Mode Control (Fit vs 100%) */}
            <div className="flex items-center bg-[#0b0c10] rounded-lg p-0.5 border border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => setIsFitMode(true)}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  isFitMode
                    ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title="Fit to Window: scales mockup so bottom dock and filmstrip fit on screen without scrolling"
              >
                <span>🔍 Fit</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFitMode(false)}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  !isFitMode
                    ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title="100% Actual Size: view full crisp resolution, typography, and device bezels"
              >
                <span>100%</span>
              </button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className={`relative ${isFitMode ? 'max-h-[72vh]' : 'max-h-none'} max-w-[90vw] flex flex-col items-center justify-center my-auto shrink-0 transition-all duration-200`}>
            {previewBase64 || screens.length > 0 ? (
              <>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 group transition duration-300">
                  {/* Camera Shutter Flash Animation */}
                  {isFlashing && (
                    <div className="absolute inset-0 bg-white/70 z-30 pointer-events-none transition-opacity duration-150 rounded-xl" />
                  )}

                  <img
                    src={
                      previewBase64
                        ? `data:${previewMime};base64,${previewBase64}`
                        : `data:image/png;base64,${screens[activeScreenIndex]?.base64 || screens[0]?.base64}`
                    }
                    alt="ADBSnap Canvas Preview"
                    draggable={false}
                    className={`w-auto object-contain rounded-xl select-none pointer-events-none transition-all duration-300 ease-out ${
                      isFitMode ? 'max-h-[min(42vh,420px)]' : 'max-h-[min(85vh,850px)]'
                    }`}
                  />

                  {/* Direct On-Canvas Draggable Text Zone (Top Headline Area) */}
                  {themeId !== 'none' && (typographyPosition === 'top' || typographyPosition === 'both') && (
                    <div
                      onClick={() => setActiveTextLayer('headline')}
                      onMouseDown={(e) => handleTextDragStart(e, 'top')}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setTextOffset(0);
                        refreshPreview(undefined, { textOffset: 0 });
                      }}
                      className={`absolute top-0 inset-x-0 ${typographyPosition === 'top' && subtitle ? 'h-[20%]' : 'h-[32%]'} z-20 cursor-grab active:cursor-grabbing select-none transition-all rounded-t-xl ${
                        activeTextLayer === 'headline'
                          ? 'border border-cyan-400/30 bg-cyan-500/[0.03]'
                          : 'hover:border hover:border-cyan-400/20 hover:bg-cyan-500/[0.01]'
                      }`}
                      title="Click to select headline, or drag up/down to reposition. Double-click to reset."
                    />
                  )}

                  {/* Direct On-Canvas Draggable Text Zone (Top Subtitle Area in Top mode) */}
                  {themeId !== 'none' && typographyPosition === 'top' && subtitle && (
                    <div
                      onClick={() => setActiveTextLayer('callout')}
                      onMouseDown={(e) => handleTextDragStart(e, 'top')}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setTextOffset(0);
                        refreshPreview(undefined, { textOffset: 0 });
                      }}
                      className={`absolute top-[20%] inset-x-0 h-[12%] z-20 cursor-grab active:cursor-grabbing select-none transition-all ${
                        activeTextLayer === 'callout'
                          ? 'border border-cyan-400/30 bg-cyan-500/[0.03]'
                          : 'hover:border hover:border-cyan-400/20 hover:bg-cyan-500/[0.01]'
                      }`}
                      title="Click to select subtitle, or drag up/down to reposition. Double-click to reset."
                    />
                  )}

                  {/* Direct On-Canvas Draggable Text Zone (Bottom Subtitle/Callout Area) */}
                  {themeId !== 'none' && (typographyPosition === 'bottom' || typographyPosition === 'both') && (
                    <div
                      onClick={() => setActiveTextLayer('callout')}
                      onMouseDown={(e) => handleTextDragStart(e, 'bottom')}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setBottomTextOffset(0);
                        refreshPreview(undefined, { bottomTextOffset: 0 });
                      }}
                      className={`absolute bottom-0 inset-x-0 h-[28%] z-20 cursor-grab active:cursor-grabbing select-none transition-all rounded-b-xl ${
                        activeTextLayer === 'callout'
                          ? 'border border-cyan-400/30 bg-cyan-500/[0.03]'
                          : 'hover:border hover:border-cyan-400/20 hover:bg-cyan-500/[0.01]'
                      }`}
                      title="Click to select subtitle/callout, or drag up/down to reposition. Double-click to reset."
                    />
                  )}

                  {/* Instant 120 FPS Drag Preview Ghost (Follows cursor with zero latency) */}
                  {isDraggingText === 'top' && (
                    <div
                      ref={dragGhostRef}
                      className="absolute top-5 inset-x-6 z-30 pointer-events-none flex flex-col items-center justify-center py-2 px-3 rounded-xl border border-cyan-400/60 bg-slate-950/80 backdrop-blur-md shadow-2xl shadow-cyan-500/25 text-center animate-in fade-in duration-100"
                      style={{ willChange: 'transform' }}
                    >
                      <span className="text-white text-xs font-bold tracking-tight line-clamp-1">
                        {title ? title.replace(/\*\*/g, '') : 'Headline Position'}
                      </span>
                    </div>
                  )}

                  {isDraggingText === 'bottom' && (
                    <div
                      ref={dragGhostRef}
                      className="absolute bottom-5 inset-x-6 z-30 pointer-events-none flex flex-col items-center justify-center py-2 px-3 rounded-xl border border-cyan-400/60 bg-slate-950/80 backdrop-blur-md shadow-2xl shadow-cyan-500/25 text-center animate-in fade-in duration-100"
                      style={{ willChange: 'transform' }}
                    >
                      <span className="text-slate-200 text-[11px] font-medium line-clamp-1">
                        {subtitle || 'Callout Position'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Clean Canvas Stage Actions Dock (outside artboard) */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161922]/90 backdrop-blur-md border border-[#232733] shadow-xl mt-3 select-none">
                  <button
                    type="button"
                    onClick={handleCopyImage}
                    disabled={isCopying}
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2 py-0.5 rounded transition cursor-pointer"
                    title="Copy framed mockup directly to clipboard (Ctrl+C)"
                  >
                    {isCopySuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-50 duration-100" />
                        <span className="text-emerald-300 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Copy Image</span>
                      </>
                    )}
                    <kbd className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-cyan-300 font-mono">Ctrl+C</kbd>
                  </button>

                  <div className="w-px h-3.5 bg-slate-700/60" />

                  <button
                    type="button"
                    onClick={() => handleSnap(false)}
                    disabled={isCapturing}
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2 py-0.5 rounded transition cursor-pointer disabled:opacity-50"
                    title="Sync current phone screen (Space)"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
                    <span>Sync Screen</span>
                    <kbd className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-cyan-300 font-mono">Space</kbd>
                  </button>

                  <div className="w-px h-3.5 bg-slate-700/60" />

                  {/* 1-Click Delete Active Screen from Canvas */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteScreen(e, activeScreenIndex);
                    }}
                    className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2 py-0.5 rounded transition cursor-pointer"
                    title="Remove active screen from canvas and filmstrip (Delete)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                    <kbd className="text-[10px] px-1 py-0.2 rounded bg-rose-900/60 text-rose-300 font-mono">Del</kbd>
                  </button>

                  {isRendering && (
                    <>
                      <div className="w-px h-3.5 bg-slate-700/60" />
                      <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 pl-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Updating...</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Duo Phone Quick Controller Dock on Canvas */}
                {layout.startsWith('duo') && screens.length > 0 && (
                  <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#12151e]/95 backdrop-blur-md border border-cyan-500/30 shadow-xl mt-2 select-none text-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-1 text-cyan-300 font-semibold">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Phone 1: #{activeScreenIndex + 1}</span>
                    </div>

                    {screens.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSwapDuoScreens}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-[11px] font-bold transition cursor-pointer shadow-sm"
                        title="Swap Foreground (Phone 1) & Background (Phone 2) screens"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>⇄ Swap Phones</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1 text-purple-300 font-semibold">
                      <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                      <span>
                        Phone 2: #{screens.length > 1 ? (secondaryScreenIndex !== null ? secondaryScreenIndex : (activeScreenIndex + 1) % screens.length) + 1 : activeScreenIndex + 1}
                      </span>
                    </div>
                  </div>
                )}
              </>
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
                <div className="flex items-center gap-2.5 flex-wrap justify-center">
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
                      handleLoadDemoScreen();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 border border-indigo-400/30 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                    title="Load an instant sample mobile screen to test mockups and themes"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-200" />
                    <span>Sample Screen</span>
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
            <div className="mt-4 flex flex-col items-center z-20 w-full max-w-3xl px-2 sm:px-4 shrink-0 pb-6">
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

              <div className="flex items-start gap-2.5 overflow-x-auto w-full py-2.5 px-3 bg-[#12141a]/95 backdrop-blur-md rounded-xl border border-[#232733] shadow-lg min-h-[142px]">
                {/* Quick Add Local Image Card in Tray */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-24 rounded-lg border border-dashed border-[#2c3242] hover:border-cyan-500/60 bg-[#151822] hover:bg-cyan-950/20 text-slate-400 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 shrink-0 transition cursor-pointer"
                  title="Upload another screenshot from your computer"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[10px] font-medium">Add</span>
                </button>
                {screens.map((s, idx) => {
                  const isActive = idx === activeScreenIndex;
                  const isSecondary = idx === (secondaryScreenIndex !== null ? secondaryScreenIndex : (activeScreenIndex + 1) % screens.length);
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
                      className={`group relative flex flex-col items-center p-1 rounded-lg border transition cursor-grab active:cursor-grabbing shrink-0 select-none w-16 ${
                        isActive
                          ? 'border-cyan-500 bg-cyan-500/15 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-500/30'
                          : isSecondary && layout.startsWith('duo')
                          ? 'border-purple-500/60 bg-purple-500/10 shadow-sm'
                          : 'border-[#232733] hover:border-slate-600 bg-[#161922]'
                      } ${draggedIndex === idx ? 'opacity-40 scale-95 border-cyan-400' : ''}`}
                    >
                      <div className="relative w-full h-24 rounded overflow-hidden bg-black/50 flex items-center justify-center border border-white/5">
                        <img
                          src={`data:image/png;base64,${s.base64}`}
                          alt={s.label}
                          draggable={false}
                          className="w-full h-full object-cover select-none pointer-events-none"
                        />
                        {isActive && (
                          <div className="absolute inset-0 border-2 border-cyan-400 rounded pointer-events-none" />
                        )}

                        {/* Top Left: Duo Badge Indicator */}
                        {layout.startsWith('duo') && (
                          <div className="absolute top-0.5 left-0.5 z-20 pointer-events-none">
                            {isActive ? (
                              <span className="px-1 py-0.2 rounded bg-cyan-500 text-slate-950 font-black text-[8px] shadow">
                                P1
                              </span>
                            ) : isSecondary ? (
                              <span className="px-1 py-0.2 rounded bg-purple-500 text-white font-black text-[8px] shadow">
                                P2
                              </span>
                            ) : null}
                          </div>
                        )}

                        {/* Top Right: Delete Screen */}
                        <button
                          type="button"
                          draggable={false}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            deleteScreen(e, idx);
                          }}
                          className="absolute top-0.5 right-0.5 p-1 rounded bg-black/85 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow cursor-pointer z-30 pointer-events-auto"
                          title="Remove screen"
                        >
                          <Trash2 className="w-3 h-3 pointer-events-none" />
                        </button>

                        {/* Bottom Left: Move Left in Order */}
                        {idx > 0 && (
                          <button
                            type="button"
                            draggable={false}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => moveScreen(e, idx, 'left')}
                            className={`absolute ${layout.startsWith('duo') ? 'top-7' : 'bottom-0.5'} left-0.5 p-0.5 rounded bg-black/80 hover:bg-cyan-600 text-white opacity-0 group-hover:opacity-100 transition shadow cursor-pointer z-20 pointer-events-auto`}
                            title="Move left in export order"
                          >
                            <ChevronLeft className="w-2.5 h-2.5 pointer-events-none" />
                          </button>
                        )}

                        {/* Bottom Right: Move Right in Order */}
                        {idx < screens.length - 1 && (
                          <button
                            type="button"
                            draggable={false}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => moveScreen(e, idx, 'right')}
                            className={`absolute ${layout.startsWith('duo') ? 'top-7' : 'bottom-0.5'} right-0.5 p-0.5 rounded bg-black/80 hover:bg-cyan-600 text-white opacity-0 group-hover:opacity-100 transition shadow cursor-pointer z-20 pointer-events-auto`}
                            title="Move right in export order"
                          >
                            <ChevronRight className="w-2.5 h-2.5 pointer-events-none" />
                          </button>
                        )}

                        {/* Bottom Overlay: Direct 1-Click Duo Fast Assignment Buttons */}
                        {layout.startsWith('duo') && (
                          <div className="absolute bottom-1 inset-x-1 flex items-center gap-1 z-20">
                            <button
                              type="button"
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPhone1Screen(idx);
                              }}
                              className={`flex-1 py-0.5 rounded text-[9px] font-black transition cursor-pointer text-center shadow-md ${
                                isActive
                                  ? 'bg-cyan-400 text-slate-950 font-bold'
                                  : 'bg-black/85 text-slate-200 hover:text-white hover:bg-cyan-950 border border-white/20'
                              }`}
                              title="Set as Phone 1 (Foreground / Left)"
                            >
                              P1
                            </button>
                            <button
                              type="button"
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPhone2Screen(idx);
                              }}
                              className={`flex-1 py-0.5 rounded text-[9px] font-black transition cursor-pointer text-center shadow-md ${
                                isSecondary
                                  ? 'bg-purple-500 text-white font-bold ring-1 ring-white/60'
                                  : 'bg-black/85 text-slate-200 hover:text-white hover:bg-purple-950 border border-white/20'
                              }`}
                              title="Set as Phone 2 (Background / Right)"
                            >
                              P2
                            </button>
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[9px] mt-0.5 font-medium max-w-[60px] truncate text-center ${
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

      {/* Video Screen Recording Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#12151e] border border-[#232733] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#232733] bg-[#0c0e14]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Device Screen Recording</h3>
                  <p className="text-[11px] text-slate-400">Record live UI interaction to MP4 video</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isRecordingVideo) setIsRecordModalOpen(false);
                }}
                disabled={isRecordingVideo}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {recordError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-mono text-[11px] leading-relaxed break-all">
                    {recordError}
                  </div>
                </div>
              )}

              {/* Recorded Video Preview if available */}
              {recordedVideoBase64 ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center bg-[#090b10] rounded-xl border border-[#232733] p-3 overflow-hidden">
                    <video
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="max-h-[48vh] w-auto rounded-lg shadow-lg"
                      src={`data:video/mp4;base64,${recordedVideoBase64}`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecordedVideoBase64(null);
                        setRecordError(null);
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-[#161922] hover:bg-[#1f2433] text-slate-300 text-xs font-medium border border-[#232733] transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Record Again</span>
                    </button>
                    <a
                      href={`data:video/mp4;base64,${recordedVideoBase64}`}
                      download={`adbsnap-recording-${Date.now()}.mp4`}
                      className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download MP4</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Capture smooth 60fps screen recordings directly from your attached Android device or iOS Simulator.
                  </p>

                  {/* Duration Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-medium block">Recording Duration</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 15, 30].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          disabled={isRecordingVideo}
                          onClick={() => setRecordDurationSec(sec)}
                          className={`py-2 px-2.5 rounded-lg text-xs font-medium border transition cursor-pointer text-center ${
                            recordDurationSec === sec
                              ? 'border-rose-500 bg-rose-500/20 text-white font-bold'
                              : 'border-[#232733] bg-[#161922] text-slate-400 hover:text-slate-200'
                          } disabled:opacity-50`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Device Info */}
                  <div className="p-3 rounded-xl bg-[#0e1017] border border-[#232733] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-300">
                        {activeDevice ? activeDevice.model || activeDevice.id : 'No device selected'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {activeDevice?.platform || 'USB / Simulator'}
                    </span>
                  </div>

                  {/* Recording Status / Countdown Indicator */}
                  {isRecordingVideo && (
                    <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-center space-y-2 animate-pulse">
                      <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        <span>Recording Screen... {recordingCountdown}s remaining</span>
                      </div>
                      <p className="text-[11px] text-rose-300/80">
                        Interact with your phone or simulator now to capture your app workflow.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isRecordingVideo}
                      onClick={() => setIsRecordModalOpen(false)}
                      className="flex-1 py-2 px-3 rounded-lg bg-[#161922] hover:bg-[#1f2433] text-slate-300 text-xs font-medium border border-[#232733] transition cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleStartRecord}
                      disabled={isRecordingVideo || !activeDevice}
                      className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isRecordingVideo ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Recording ({recordingCountdown}s)...</span>
                        </>
                      ) : (
                        <>
                          <Video className="w-3.5 h-3.5" />
                          <span>Start Recording</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
