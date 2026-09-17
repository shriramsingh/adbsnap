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
  { id: 'studioLight', name: 'Studio Light', colors: ['#f8f9fa', '#e9ecef'], darkText: true },
  { id: 'freshMint', name: 'Fresh Mint', colors: ['#0f172a', '#064e3b', '#022c22'], darkText: false },
  { id: 'aurora', name: 'Aurora Borealis', colors: ['#0f172a', '#4c1d95', '#1e1b4b'], darkText: false },
  { id: 'sunset', name: 'Sunset Crimson', colors: ['#450a0a', '#7f1d1d', '#18181b'], darkText: false },
  { id: 'midnight', name: 'Midnight Obsidian', colors: ['#090d16', '#111827', '#030712'], darkText: false },
  { id: 'royal', name: 'Royal Indigo', colors: ['#172554', '#1e1b4b', '#0f172a'], darkText: false },
  { id: 'cleanDark', name: 'Clean Dark', colors: ['#18181b', '#09090b'], darkText: false },
];

const BEZELS = [
  { id: 'iphone-16-pro', name: 'iPhone 16 Pro Max', platform: 'Apple iOS' },
  { id: 'pixel-9-pro', name: 'Google Pixel 9 Pro', platform: 'Google Pixel' },
  { id: 'minimal', name: 'Modern Minimalist', platform: 'Universal' },
];

const FONTS = [
  { id: 'modern', name: 'Modern Sans (SF / Inter)' },
  { id: 'rounded', name: 'Rounded Casual' },
  { id: 'editorial', name: 'Editorial Serif (Georgia)' },
  { id: 'mono', name: 'Technical Monospace' },
];

export default function StudioPage() {
  // Device & Status State
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportScope, setExportScope] = useState<'all' | 'active'>('all');
  const [isRendering, setIsRendering] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Customization Options
  const [themeId, setThemeId] = useState('studioLight');
  const [bezelId, setBezelId] = useState('iphone-16-pro');
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
          const appName = activeApp ? activeApp.split('.').pop() || 'Screen' : 'Screen';

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

        {/* Live Device Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161922] border border-[#232733]">
            {activeDevice ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-slate-200">{activeDevice.model}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {activeDevice.type === 'wifi' ? 'Wi-Fi 📶' : 'USB 🔌'}
                </span>
                {activeApp && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                    {activeApp.split('.').pop()}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs text-amber-300">No device detected</span>
              </>
            )}
          </div>

          {/* Screens Collected Counter Badge */}
          {screens.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 animate-in fade-in">
              <span className="font-semibold">📸 {screens.length}</span>
              <span className="text-cyan-400/80 hidden lg:inline">
                {screens.length === 1 ? 'screen captured' : 'screens captured'}
              </span>
              <button
                onClick={clearAllScreens}
                className="ml-1 p-0.5 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Clear all session screenshots"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

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
                    <span>{theme.name}</span>
                    <div className="flex items-center gap-1">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
                        style={{
                          background: `linear-gradient(135deg, ${theme.colors.join(', ')})`,
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Device Chassis & Framing */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                Device & Layout Mode
              </label>
              <div className="space-y-2">
                <select
                  value={bezelId}
                  onChange={(e) => setBezelId(e.target.value)}
                  className="w-full bg-[#161922] border border-[#232733] rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {BEZELS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.platform})
                    </option>
                  ))}
                </select>

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
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <Type className="w-3.5 h-3.5 text-cyan-400" />
                Marketing Typography
              </label>
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
                  ? 'Packaging All Stores...'
                  : screens.length > 1 && exportScope === 'all'
                  ? `Export All (${screens.length} Screens) (.zip)`
                  : 'Export Stores (.zip)'}
              </span>
            </button>
          </div>
        </aside>

        {/* Center Live Canvas Preview */}
        <main className="flex-1 bg-[#0a0b0e] flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* Subtle Studio Background Grid */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

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
                {/* Floating Quick Sync Button on Canvas Hover */}
                <button
                  onClick={() => handleSnap(false)}
                  disabled={isCapturing}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-white/15 shadow-xl backdrop-blur opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Sync current phone screen (Space)"
                >
                  <RefreshCw className={`w-3 h-3 ${isCapturing ? 'animate-spin' : ''}`} />
                  <span>Sync Screen</span>
                  <kbd className="text-[10px] font-mono text-cyan-400">Space</kbd>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 border-2 border-dashed border-[#232733] rounded-2xl max-w-md">
                <div className="w-12 h-12 rounded-full bg-[#161922] flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">Canvas Ready</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Plug in your phone and press &quot;Sync from Phone&quot; or spacebar to generate an asset.
                </p>
                <button
                  onClick={() => handleSnap(false)}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold cursor-pointer"
                >
                  Capture Active Screen
                </button>
              </div>
            )}
          </div>

          {/* Session Screens Filmstrip Tray */}
          {screens.length > 0 && (
            <div className="mt-3 flex flex-col items-center z-20 w-full max-w-3xl px-4">
              <div className="flex items-center justify-between w-full mb-1 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
                    <Camera className="w-3 h-3 text-cyan-400" />
                    Session Filmstrip ({screens.length})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Press <kbd className="px-1 py-0.2 bg-slate-800 text-cyan-300 rounded font-mono text-[9px]">Space</kbd> to capture new frames
                  </span>
                </div>
                <button
                  onClick={clearAllScreens}
                  className="text-[10px] text-slate-400 hover:text-rose-400 transition flex items-center gap-1 cursor-pointer"
                  title="Clear all captured screens"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Clear All</span>
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full py-1.5 px-2 bg-[#12141a]/95 backdrop-blur-md rounded-xl border border-[#232733] shadow-lg">
                {screens.map((s, idx) => {
                  const isActive = idx === activeScreenIndex;
                  return (
                    <div
                      key={s.id}
                      onClick={() => selectScreen(idx)}
                      className={`group relative flex flex-col items-center p-1 rounded-lg border transition cursor-pointer shrink-0 ${
                        isActive
                          ? 'border-cyan-500 bg-cyan-500/15 shadow-md shadow-cyan-500/20'
                          : 'border-[#232733] hover:border-slate-600 bg-[#161922]'
                      }`}
                    >
                      <div className="relative w-12 h-20 rounded overflow-hidden bg-black/50 flex items-center justify-center border border-white/5">
                        <img
                          src={`data:image/png;base64,${s.base64}`}
                          alt={s.label}
                          className="w-full h-full object-cover select-none"
                        />
                        {isActive && (
                          <div className="absolute inset-0 border-2 border-cyan-400 rounded pointer-events-none" />
                        )}
                        <button
                          onClick={(e) => deleteScreen(e, idx)}
                          className="absolute top-0.5 right-0.5 p-1 rounded bg-black/80 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow cursor-pointer"
                          title="Remove screen"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
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
    </div>
  );
}
