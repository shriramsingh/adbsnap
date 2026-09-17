export function getStudioHtml(version: string = '1.2.0'): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ADBSnap Studio</title>
  <style>
    :root {
      --bg: #090b10;
      --card: #121620;
      --border: #1e2638;
      --accent: #6366f1;
      --accent-hover: #4f46e5;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }
    
    header {
      height: 60px;
      border-bottom: 1px solid var(--border);
      background: rgba(18, 22, 32, 0.85);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 1.1rem; }
    .brand-badge {
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      color: white;
      font-weight: 600;
    }
    .header-device { display: flex; align-items: center; gap: 10px; }
    select, input, button {
      background: var(--card);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s;
    }
    select:focus, input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
    button {
      cursor: pointer;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    button:hover { background: #1c2333; }
    .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
      font-weight: 600;
    }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-success {
      background: #059669;
      border-color: #059669;
      color: white;
      font-weight: 600;
    }
    .btn-success:hover { background: #047857; }

    main {
      display: grid;
      grid-template-columns: 400px 1fr;
      flex: 1;
      height: calc(100vh - 60px);
      overflow: hidden;
    }
    
    .sidebar {
      border-right: 1px solid var(--border);
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
      background: #0c0f17;
    }
    .section-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 8px;
      font-weight: 700;
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }

    .color-chip {
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: transform 0.15s, border-color 0.15s;
    }
    .color-chip:hover { transform: scale(1.05); }
    .color-chip.active { border-color: #fff; box-shadow: 0 0 10px rgba(255,255,255,0.3); }

    .preview-area {
      background: radial-gradient(circle at center, #171d2b 0%, #090b10 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px;
      position: relative;
      overflow: hidden;
    }
    .preview-card {
      max-height: 80vh;
      max-width: 90%;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      object-fit: contain;
      transition: opacity 0.2s;
    }
    .preview-card.loading { opacity: 0.5; }

    .status-bar {
      position: absolute;
      bottom: 16px;
      background: rgba(18, 22, 32, 0.8);
      border: 1px solid var(--border);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }
    
    .spinner {
      position: absolute;
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: none;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>
      </svg>
      ADBSnap Studio
      <span class="brand-badge">v${version}</span>
    </div>
    <div class="header-device">
      <select id="deviceSelect">
        <option value="">Detecting devices...</option>
      </select>
      <button id="refreshDevicesBtn" title="Refresh Devices">
        Refresh
      </button>
    </div>
  </header>

  <main>
    <div class="sidebar">
      <div>
        <div class="section-title">Screen Capture</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button id="captureBtn" class="btn-primary" style="justify-content: center; height: 42px;">
            Capture Live Device
          </button>
          <div>
            <input type="file" id="fileInput" accept="image/*" style="display: none;">
            <button id="uploadBtn" style="width: 100%; justify-content: center;">
              Upload Local Image
            </button>
          </div>
        </div>
      </div>

      <div>
        <div class="section-title">Device Bezel Chassis</div>
        <select id="bezelSelect" style="width: 100%;">
          <option value="iphone-16-pro">iPhone 16 Pro Max (Titanium)</option>
          <option value="iphone-16">iPhone 16 (Dynamic Island)</option>
          <option value="pixel-9-pro">Google Pixel 9 Pro (Punch Hole)</option>
          <option value="galaxy-s24-ultra">Samsung Galaxy S24 Ultra</option>
          <option value="ipad-pro-13">Apple iPad Pro 13" M4</option>
          <option value="minimal">Clean Minimalist</option>
          <option value="none">No Bezel (Raw Screen)</option>
        </select>
      </div>

      <div>
        <div class="section-title">Color Gradient Theme</div>
        <div class="grid-4" id="themeGrid">
          <div class="color-chip active" data-theme="aurora" style="background: linear-gradient(135deg, #0f172a, #4c1d95, #1e1b4b);" title="Aurora Borealis"></div>
          <div class="color-chip" data-theme="studioLight" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 1px solid #ddd;" title="Studio Light"></div>
          <div class="color-chip" data-theme="freshMint" style="background: linear-gradient(135deg, #0f172a, #064e3b, #022c22);" title="Fresh Mint"></div>
          <div class="color-chip" data-theme="sunset" style="background: linear-gradient(135deg, #450a0a, #7f1d1d, #18181b);" title="Sunset Crimson"></div>
          <div class="color-chip" data-theme="midnight" style="background: linear-gradient(135deg, #090d16, #111827, #030712);" title="Midnight Obsidian"></div>
          <div class="color-chip" data-theme="royal" style="background: linear-gradient(135deg, #172554, #1e1b4b, #0f172a);" title="Royal Indigo"></div>
          <div class="color-chip" data-theme="cleanDark" style="background: linear-gradient(135deg, #18181b, #09090b);" title="Clean Dark"></div>
          <div class="color-chip" data-theme="none" style="background: repeating-conic-gradient(#222 0% 25%, #111 0% 50%) 50% / 10px 10px;" title="Transparent / None"></div>
        </div>
      </div>

      <div>
        <div class="section-title">Layout Mode</div>
        <div class="grid-2">
          <button id="layoutAppStore" class="btn-primary" style="justify-content: center;">App Store</button>
          <button id="layoutSocial" style="justify-content: center;">Social Post</button>
        </div>
      </div>

      <div>
        <div class="section-title">Marketing Typography</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <input type="text" id="titleInput" placeholder="Headline text" value="Seamless Experience">
          <input type="text" id="subtitleInput" placeholder="Subtitle text" value="Engineered for mobile excellence">
          <div class="grid-2">
            <select id="fontSelect">
              <option value="modern">Modern Sans</option>
              <option value="rounded">Rounded Casual</option>
              <option value="editorial">Editorial Serif</option>
              <option value="mono">Technical Mono</option>
            </select>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer;">
              <input type="checkbox" id="starsCheck" checked style="cursor: pointer;">
              ★★★★★ 5.0
            </label>
          </div>
        </div>
      </div>

      <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; padding-top: 16px; border-top: 1px solid var(--border);">
        <button id="downloadBtn" style="justify-content: center; height: 38px;">
          Download PNG Preview
        </button>
        <button id="exportZipBtn" class="btn-success" style="justify-content: center; height: 42px;">
          Export Store Bundle (.ZIP)
        </button>
      </div>
    </div>

    <div class="preview-area">
      <div class="spinner" id="spinner"></div>
      <img id="previewImg" class="preview-card" alt="Composite Preview" style="display: none;">
      <div id="emptyState" style="text-align: center; color: var(--text-muted);">
        <div style="font-size: 1.1rem; font-weight: 600; color: var(--text);">Ready for Screenshot</div>
        <div style="font-size: 0.85rem; margin-top: 4px;">Click "Capture Live Device" or upload an image to begin</div>
      </div>
      <div class="status-bar">
        <div class="status-dot"></div>
        <span id="statusText">Studio Engine Active (0ms)</span>
      </div>
    </div>
  </main>

  <script>
    const state = {
      deviceId: '',
      screenshotBase64: '',
      bezelId: 'iphone-16-pro',
      theme: 'aurora',
      layout: 'appstore',
      title: 'Seamless Experience',
      subtitle: 'Engineered for mobile excellence',
      font: 'modern',
      showStars: true,
    };

    const previewImg = document.getElementById('previewImg');
    const emptyState = document.getElementById('emptyState');
    const spinner = document.getElementById('spinner');
    const statusText = document.getElementById('statusText');
    const deviceSelect = document.getElementById('deviceSelect');

    function showLoading(isLoading) {
      spinner.style.display = isLoading ? 'block' : 'none';
      if (isLoading) previewImg.classList.add('loading');
      else previewImg.classList.remove('loading');
    }

    async function loadDevices() {
      try {
        const res = await fetch('/api/devices');
        const data = await res.json();
        deviceSelect.innerHTML = '';
        if (data.devices && data.devices.length > 0) {
          data.devices.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = (d.model || d.id) + ' (' + d.type.toUpperCase() + ')';
            deviceSelect.appendChild(opt);
          });
          state.deviceId = data.devices[0].id;
          statusText.textContent = 'Device ready: ' + (data.devices[0].model || data.devices[0].id);
        } else {
          deviceSelect.innerHTML = '<option value="">No devices connected</option>';
          statusText.textContent = 'No ADB devices detected';
        }
      } catch (err) {
        statusText.textContent = 'Failed to query ADB devices';
      }
    }

    async function updatePreview() {
      if (!state.screenshotBase64) return;
      showLoading(true);
      const start = performance.now();
      try {
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'preview',
            screenshotBase64: state.screenshotBase64,
            bezelId: state.bezelId,
            gradientPreset: state.theme,
            layout: state.layout,
            title: state.title,
            subtitle: state.subtitle,
            font: state.font,
            showStarBadge: state.showStars,
          })
        });
        const data = await res.json();
        if (data.success && data.base64) {
          previewImg.src = 'data:image/png;base64,' + data.base64;
          previewImg.style.display = 'block';
          emptyState.style.display = 'none';
          const elapsed = Math.round(performance.now() - start);
          statusText.textContent = 'Rendered in ' + elapsed + 'ms (' + data.width + 'x' + data.height + 'px)';
        }
      } catch (err) {
        statusText.textContent = 'Preview rendering error';
      } finally {
        showLoading(false);
      }
    }

    async function captureScreen() {
      showLoading(true);
      statusText.textContent = 'Capturing frame from ADB...';
      try {
        const res = await fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: state.deviceId })
        });
        const data = await res.json();
        if (data.success && data.base64) {
          state.screenshotBase64 = data.base64;
          await updatePreview();
        } else {
          alert('Capture failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Failed to trigger capture from device');
      } finally {
        showLoading(false);
      }
    }

    document.getElementById('captureBtn').addEventListener('click', captureScreen);
    document.getElementById('refreshDevicesBtn').addEventListener('click', loadDevices);
    deviceSelect.addEventListener('change', (e) => state.deviceId = e.target.value);

    document.getElementById('bezelSelect').addEventListener('change', (e) => {
      state.bezelId = e.target.value;
      updatePreview();
    });

    document.querySelectorAll('.color-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.color-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.theme = chip.dataset.theme;
        updatePreview();
      });
    });

    const appStoreBtn = document.getElementById('layoutAppStore');
    const socialBtn = document.getElementById('layoutSocial');
    appStoreBtn.addEventListener('click', () => {
      appStoreBtn.classList.add('btn-primary');
      socialBtn.classList.remove('btn-primary');
      state.layout = 'appstore';
      updatePreview();
    });
    socialBtn.addEventListener('click', () => {
      socialBtn.classList.add('btn-primary');
      appStoreBtn.classList.remove('btn-primary');
      state.layout = 'social';
      updatePreview();
    });

    let debounceTimer;
    function debouncedUpdate() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updatePreview, 300);
    }

    document.getElementById('titleInput').addEventListener('input', (e) => {
      state.title = e.target.value;
      debouncedUpdate();
    });
    document.getElementById('subtitleInput').addEventListener('input', (e) => {
      state.subtitle = e.target.value;
      debouncedUpdate();
    });
    document.getElementById('fontSelect').addEventListener('change', (e) => {
      state.font = e.target.value;
      updatePreview();
    });
    document.getElementById('starsCheck').addEventListener('change', (e) => {
      state.showStars = e.target.checked;
      updatePreview();
    });

    document.getElementById('uploadBtn').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        state.screenshotBase64 = evt.target.result.split(',')[1];
        updatePreview();
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('downloadBtn').addEventListener('click', () => {
      if (!previewImg.src) return alert('Capture or upload a screen first!');
      const a = document.createElement('a');
      a.href = previewImg.src;
      a.download = 'adbsnap-' + state.bezelId + '-' + state.theme + '.png';
      a.click();
    });

    document.getElementById('exportZipBtn').addEventListener('click', async () => {
      if (!state.screenshotBase64) return alert('Capture or upload a screen first!');
      showLoading(true);
      statusText.textContent = 'Generating App Store & Google Play assets into ZIP...';
      try {
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'zip',
            screenshotBase64: state.screenshotBase64,
            bezelId: state.bezelId,
            gradientPreset: state.theme,
            layout: state.layout,
            title: state.title,
            subtitle: state.subtitle,
            font: state.font,
            showStarBadge: state.showStars,
          })
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'adbsnap-export-' + Date.now() + '.zip';
        a.click();
        window.URL.revokeObjectURL(url);
        statusText.textContent = 'ZIP bundle successfully exported!';
      } catch (err) {
        alert('Failed to export ZIP package');
      } finally {
        showLoading(false);
      }
    });

    loadDevices();
  </script>
</body>
</html>`;
}