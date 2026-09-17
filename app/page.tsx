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
  { id: 'modern', name: 'Modern Sans (SF / Inter)' },
  { id: 'rounded', name: 'Rounded Casual' },
  { id: 'editorial', name: 'Editorial Serif (Georgia)' },
  { id: 'mono', name: 'Technical Monospace' },
];

/**
 * Intelligently formats an Android package ID into a clean human-readable product name
 * e.g. com.coachconnect.app -> Coachconnect, com.instagram.android -> Instagram
 */
export function formatAppName(pkg?: string | null): string {
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
  const [title, setTitle] = useState('Transform Your Workflow');
  const [subtitle, setSubtitle] = useState('Effortless automated mobile screenshot studio.');
  const [showStars, setShowStars] = useState(true);

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

  // 1. Setup Server-Sent Events (SSE) for live device updates
  useEffect(() => {
    const sse = new EventSource('/api/events');

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.devices) {
          setDevices(data.devices);
          if (!selectedDevice && data.devices.length > 0) {
            setSelectedDevice(data.devices[0].id);
          }
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
    async (rawScreenshot?: string) => {
      setIsRendering(true);
      try {
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenshotBase64: rawScreenshot || screenshotBase64,
            deviceId: selectedDevice || undefined,
            bezelId,
            gradientPreset: themeId,
            layout,
            font,
            title,
            subtitle,
            showStarBadge: showStars,
            format: 'preview',
          }),
        });

        const data = await res.json();
        if (data.success && data.base64) {
          setPreviewBase64(data.base64);
        }
      } catch (err) {
        console.error('Preview render error:', err);
      } finally {
        setIsRendering(false);
      }
    },
    [screenshotBase64, selectedDevice, bezelId, themeId, layout, font, title, subtitle, showStars]
  );

  // Debounced auto-preview when styling knobs change
  useEffect(() => {
    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => {
      refreshPreview();
    }, 400);

    return () => {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    };
  }, [themeId, bezelId, layout, font, title, subtitle, showStars, refreshPreview]);

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
    setStatusMessage('Disconnecting Wi-Fi session and resetting to USB mode...');
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
          const usbDev = data.devices.find((d: ConnectedDevice) => d.type === 'usb');
          if (usbDev) setSelectedDevice(usbDev.id);
        }
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastMessage('🔌 Wi-Fi disconnected. Switched back to USB mode.');
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
        setStatusMessage('Switched back to USB mode');
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
    setActiveScreenIndex(index);
    const target = screens[index];
    if (target.customTitle) {
      setTitle(target.customTitle);
    }
    setScreenshotBase64(target.base64);
    await refreshPreview(target.base64);
  };

  const deleteScreen = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setScreens((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (activeScreenIndex >= updated.length) {
        const nextIdx = Math.max(0, updated.length - 1);
        setActiveScreenIndex(nextIdx);
        if (updated.length > 0) {
          setScreenshotBase64(updated[nextIdx].base64);
          refreshPreview(updated[nextIdx].base64);
        } else {
          setScreenshotBase64(null);
          setPreviewBase64(null);
        }
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
          font,
          title,
          subtitle,
          showStarBadge: showStars,
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
      <header className="h-14 border-b border-[#232733] bg-[#0f1117] px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">ADBSnap Studio</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v1.0.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Marketing Asset & Screenshot Studio</p>
          </div>
        </div>

        {/* Live Device Status & USB/Wi-Fi Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#161922] border border-[#232733]">
            <div className="flex items-center gap-2 px-2.5 py-0.5">
              {activeDevice ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[130px]" title={activeDevice.id}>
                    {activeDevice.model}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1">
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
                      className="group/app flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950/70 hover:bg-blue-900/90 text-blue-300 border border-blue-800/40 transition cursor-pointer text-[10px] hidden md:inline-flex"
                      title={`Active Package: ${activeApp}\n(Click to copy package name)`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="font-semibold text-white tracking-wide">
                        {formatAppName(activeApp)}
                      </span>
                      <span className="text-[9px] font-mono text-blue-400/70 hidden lg:inline max-w-[130px] truncate group-hover/app:text-blue-200">
                        ({activeApp})
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
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition cursor-pointer disabled:opacity-50"
                title="Switch from USB to Wi-Fi mode automatically so you can unplug the USB cable"
              >
                {isSwitchingWireless ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Wifi className="w-3 h-3 text-cyan-400" />
                )}
                <span className="hidden sm:inline">Switch to Wi-Fi</span>
              </button>
            )}

            {/* Disconnect Wi-Fi Quick Button (When on Wi-Fi) */}
            {activeDevice && activeDevice.type === 'wifi' && (
              <button
                type="button"
                onClick={handleDisconnectWifi}
                disabled={isSwitchingWireless}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition cursor-pointer disabled:opacity-50"
                title="Disconnect wireless ADB session and revert to USB mode"
              >
                {isSwitchingWireless ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Cable className="w-3 h-3 text-amber-400" />
                )}
                <span className="hidden sm:inline">Disconnect Wi-Fi</span>
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
              className="px-2.5 py-1 text-slate-300 hover:text-white rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 transition cursor-pointer flex items-center gap-1.5 text-[11px] font-medium shadow-sm"
              title="Connect to a phone via Wi-Fi IP address or Android 11+ wireless debugging"
            >
              <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>IP Connect</span>
            </button>
          </div>

          {/* Screens Collected Counter Badge */}
          {screens.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 animate-in fade-in select-none">
              <span className="font-semibold">📸 {screens.length}</span>
              <span className="text-cyan-400/80 hidden lg:inline">
                {screens.length === 1 ? 'screen' : 'screens'}
              </span>
            </div>
          )}

          {/* Local File Upload Action */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#161922] hover:bg-[#202533] border border-[#232733] text-slate-300 hover:text-white font-medium text-xs shadow-sm transition cursor-pointer"
            title="Import screenshots from your computer (PNG, JPG, WebP) to frame or create an animated story"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Upload Images</span>
          </button>

          {/* Primary Sync Action */}
          <button
            onClick={() => handleSnap(false)}
            disabled={isCapturing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-md shadow-cyan-500/20 transition disabled:opacity-50 cursor-pointer"
            title="Pull current screen from your phone into the canvas (Spacebar)"
          >
            {isCapturing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Sync from Phone</span>
            <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 bg-cyan-600/30 text-slate-950 rounded font-mono font-bold">Space</kbd>
          </button>

          {/* Autonomous Crawl Action */}
          <button
            onClick={handleAutonomousCrawl}
            disabled={isCrawling}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
          >
            {isCrawling ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Auto-Crawl Tabs</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (Split View) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Controls */}
        <aside className="w-84 border-r border-[#232733] bg-[#0f1117] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Theme Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Curated Design Themes
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setThemeId(theme.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-left text-xs transition cursor-pointer ${
                      themeId === theme.id
                        ? 'border-cyan-500 bg-cyan-500/10 text-white font-medium'
                        : 'border-[#232733] hover:border-slate-700 bg-[#161922] text-slate-300'
                    }`}
                  >
                    <span className={theme.isNone ? 'text-amber-300 font-semibold' : ''}>{theme.name}</span>
                    <div className="flex items-center gap-1.5">
                      {theme.isNone ? (
                        <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/30 text-amber-300">
                          RAW
                        </span>
                      ) : (
                        <div
                          className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
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
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Headline</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter punchy headline..."
                    className="w-full bg-[#161922] border border-[#232733] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Subtitle</span>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Enter explanatory copy..."
                    className="w-full bg-[#161922] border border-[#232733] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Font Preset</span>
                  <select
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    className="w-full bg-[#161922] border border-[#232733] rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
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
                  className="max-h-[66vh] w-auto object-contain rounded-xl select-none"
                />

                {isRendering && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition">
                    <div className="px-3 py-1.5 rounded-full bg-slate-900/90 text-cyan-400 text-xs flex items-center gap-2 border border-cyan-500/30">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Frame...</span>
                    </div>
                  </div>
                )}
                {/* Floating Quick Action Buttons on Canvas Hover */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
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
                      <div className="relative w-12 h-20 rounded overflow-hidden bg-black/50 flex items-center justify-center border border-white/5 pointer-events-none">
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
                          onClick={(e) => deleteScreen(e, idx)}
                          className="absolute top-0.5 right-0.5 p-1 rounded bg-black/80 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow cursor-pointer z-10"
                          title="Remove screen"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>

                        {/* Bottom Left: Move Left in Order */}
                        {idx > 0 && (
                          <button
                            onClick={(e) => moveScreen(e, idx, 'left')}
                            className="absolute bottom-0.5 left-0.5 p-0.5 rounded bg-black/80 hover:bg-cyan-600 text-white opacity-0 group-hover:opacity-100 transition shadow cursor-pointer z-10"
                            title="Move left in export order"
                          >
                            <ChevronLeft className="w-2.5 h-2.5" />
                          </button>
                        )}

                        {/* Bottom Right: Move Right in Order */}
                        {idx < screens.length - 1 && (
                          <button
                            onClick={(e) => moveScreen(e, idx, 'right')}
                            className="absolute bottom-0.5 right-0.5 p-0.5 rounded bg-black/80 hover:bg-cyan-600 text-white opacity-0 group-hover:opacity-100 transition shadow cursor-pointer z-10"
                            title="Move right in export order"
                          >
                            <ChevronRight className="w-2.5 h-2.5" />
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
