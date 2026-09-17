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
} from 'lucide-react';

interface ConnectedDevice {
  id: string;
  type: 'usb' | 'wifi' | 'emulator';
  model: string;
  product: string;
  isAuthorized: boolean;
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
  const [isRendering, setIsRendering] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [crawledScreens, setCrawledScreens] = useState<Array<{ index: number; title: string; base64: string }>>([]);

  // Customization Options
  const [themeId, setThemeId] = useState('studioLight');
  const [bezelId, setBezelId] = useState('iphone-16-pro');
  const [layout, setLayout] = useState<'appstore' | 'social'>('appstore');
  const [font, setFont] = useState('modern');
  const [title, setTitle] = useState('Transform Your Workflow');
  const [subtitle, setSubtitle] = useState('Effortless automated mobile screenshot studio.');
  const [showStars, setShowStars] = useState(true);

  // Images
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);

  // Reference to debounce render requests
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const autoSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
      if (!silent) {
        setIsCapturing(true);
        setStatusMessage('Streaming screen buffer from phone...');
      }
      try {
        const res = await fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: selectedDevice || undefined }),
        });

        const data = await res.json();
        if (data.success && data.base64) {
          // If silent sync and screen hasn't changed on phone, skip heavy compositing!
          if (silent && lastScreenBase64Ref.current === data.base64) {
            return;
          }

          lastScreenBase64Ref.current = data.base64;
          setScreenshotBase64(data.base64);
          setLastLatencyMs(data.latencyMs);
          if (!silent) setStatusMessage(`Captured in ${data.latencyMs}ms (${(data.sizeBytes / 1024).toFixed(0)} KB)`);
          await refreshPreview(data.base64);
        } else {
          if (!silent) setStatusMessage(`Capture failed: ${data.error}`);
        }
      } catch (err) {
        if (!silent) setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        isCapturingRef.current = false;
        if (!silent) {
          setIsCapturing(false);
        }
      }
    },
    [selectedDevice, refreshPreview]
  );

  // Auto-snap initial frame when device is selected
  useEffect(() => {
    if (selectedDevice && !initialSnapTakenRef.current) {
      initialSnapTakenRef.current = true;
      handleSnap(true);
    }
  }, [selectedDevice, handleSnap]);

  // Live Auto-Sync loop (polls every 1.8s when enabled)
  useEffect(() => {
    if (autoSync) {
      autoSyncIntervalRef.current = setInterval(() => {
        if (!isCapturingRef.current) {
          handleSnap(true);
        }
      }, 1800);
    } else {
      if (autoSyncIntervalRef.current) clearInterval(autoSyncIntervalRef.current);
    }

    return () => {
      if (autoSyncIntervalRef.current) clearInterval(autoSyncIntervalRef.current);
    };
  }, [autoSync, handleSnap]);

  // 4. Export Multi-Store ZIP Package
  const handleExportZip = async () => {
    setIsExporting(true);
    setStatusMessage('Generating 4K multi-store package & ZIP archive...');
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshotBase64,
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
      a.download = `adbsnap-store-assets-${themeId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setStatusMessage('ZIP archive downloaded successfully!');
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
        setCrawledScreens(data.screens);
        setPreviewBase64(data.screens[0].base64);
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

          {/* Live Auto-Sync Toggle */}
          <button
            onClick={() => setAutoSync(!autoSync)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs border transition cursor-pointer ${
              autoSync
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/20'
                : 'bg-[#161922] border-[#232733] text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
            title="Automatically updates the preview every 1.8s as you navigate on your phone"
          >
            <span className={`w-2 h-2 rounded-full ${autoSync ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{autoSync ? 'Live Sync ON' : 'Live Sync'}</span>
          </button>

          {/* Quick Snap Primary Action */}
          <button
            onClick={() => handleSnap(false)}
            disabled={isCapturing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-md shadow-cyan-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            {isCapturing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Snap Screen</span>
            <kbd className="hidden sm:inline-block text-[10px] px-1 py-0.2 bg-cyan-600/30 rounded font-mono">Space</kbd>
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
            <button
              onClick={handleExportZip}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FolderArchive className="w-4 h-4" />
              )}
              <span>Export All Stores (.zip)</span>
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

          {/* Canvas Wrapper */}
          <div className="relative max-h-[82vh] max-w-[85vw] flex items-center justify-center">
            {previewBase64 ? (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 group transition duration-300">
                <img
                  src={`data:image/png;base64,${previewBase64}`}
                  alt="ADBSnap Canvas Preview"
                  className="max-h-[78vh] w-auto object-contain rounded-xl select-none"
                />

                {isRendering && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition">
                    <div className="px-3 py-1.5 rounded-full bg-slate-900/90 text-cyan-400 text-xs flex items-center gap-2 border border-cyan-500/30">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Frame...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 border-2 border-dashed border-[#232733] rounded-2xl max-w-md">
                <div className="w-12 h-12 rounded-full bg-[#161922] flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">Canvas Ready</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Plug in your phone and press &quot;Snap Screen&quot; or spacebar to generate an asset.
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

          {/* Crawled Tabs Carousel Strip */}
          {crawledScreens.length > 0 && (
            <div className="mt-4 flex items-center gap-3 overflow-x-auto max-w-2xl py-2 px-3 bg-[#12141a]/90 backdrop-blur rounded-xl border border-[#232733] z-10">
              <span className="text-[11px] text-cyan-400 font-semibold uppercase tracking-wider shrink-0">
                Crawled Tabs ({crawledScreens.length}):
              </span>
              {crawledScreens.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setPreviewBase64(s.base64)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#232733] hover:border-cyan-500 bg-[#161922] text-xs text-slate-200 transition shrink-0 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{s.title}</span>
                </button>
              ))}
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
