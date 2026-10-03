import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { androidDriver } from './adb';
import { listAllDevices, captureDeviceScreenshot } from './devices';
import { compositeFrame, exportMultiStore, createAnimatedGif } from './sharp';
import { createStoreZip } from './zip';
import { uiCrawler } from './crawler';
import type { LayoutMode } from '../constants/themes';

export interface StudioServerOptions {
  port: number;
}

export function startStudioServer(options: StudioServerOptions): Promise<http.Server> {
  const port = options.port || 3000;

  // Resolve directory where dist/studio files live (must contain index.html)
  let studioDir = path.resolve(process.cwd(), 'dist/studio');
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [
      path.resolve(process.cwd(), 'dist/studio'),
      path.resolve(currentDir, '../studio'),
      path.resolve(currentDir, '../../dist/studio'),
      path.resolve(currentDir, '../dist/studio'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(path.join(c, 'index.html'))) {
        studioDir = c;
        break;
      }
    }
  } catch {}

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      // Enable CORS for localhost
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
      }

      const host = req.headers.host || 'localhost';
      const parsedUrl = new URL(req.url || '/', `http://${host}`);
      const pathname = parsedUrl.pathname;

      // Helper to read JSON request body
      async function readJson(): Promise<any> {
        return new Promise((resBody, rejBody) => {
          const chunks: Buffer[] = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', () => {
            try {
              const text = Buffer.concat(chunks).toString('utf8');
              resBody(text ? JSON.parse(text) : {});
            } catch (err) {
              rejBody(err);
            }
          });
          req.on('error', rejBody);
        });
      }

      // Helper to send JSON response
      function sendJson(data: any, status = 200) {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      }

      // 1. Static File Serving (Pre-compiled Studio SPA)
      if (req.method === 'GET') {
        if (pathname === '/' || pathname === '/index.html') {
          const indexPath = path.join(studioDir, 'index.html');
          if (fs.existsSync(indexPath)) {
            res.writeHead(200, {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            });
            return fs.createReadStream(indexPath).pipe(res);
          }
        }
        if (pathname === '/studio.js') {
          const jsPath = path.join(studioDir, 'studio.js');
          if (fs.existsSync(jsPath)) {
            res.writeHead(200, {
              'Content-Type': 'application/javascript; charset=utf-8',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            });
            return fs.createReadStream(jsPath).pipe(res);
          }
        }
        if (pathname === '/studio.css') {
          const cssPath = path.join(studioDir, 'studio.css');
          if (fs.existsSync(cssPath)) {
            res.writeHead(200, {
              'Content-Type': 'text/css; charset=utf-8',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            });
            return fs.createReadStream(cssPath).pipe(res);
          }
        }
      }

      // 2. Server-Sent Events (/api/events)
      if (req.method === 'GET' && pathname === '/api/events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        });

        let isAlive = true;
        const sendUpdate = async () => {
          if (!isAlive) return;
          try {
            const devices = await listAllDevices();
            let activeApp: string | null = null;
            if (devices.some(d => d.platform === 'android' && d.isAuthorized)) {
              try {
                activeApp = await androidDriver.getForegroundApp();
              } catch {}
            }
            res.write(`data: ${JSON.stringify({ devices, activeApp, timestamp: Date.now() })}\n\n`);
          } catch {}
        };

        sendUpdate();
        const interval = setInterval(sendUpdate, 3000);

        req.on('close', () => {
          isAlive = false;
          clearInterval(interval);
        });
        return;
      }

      // 3. API: /api/devices (GET & POST)
      if (pathname === '/api/devices') {
        if (req.method === 'GET') {
          try {
            const devices = await listAllDevices();
            let activeApp: string | null = null;
            if (devices.some(d => d.platform === 'android' && d.isAuthorized)) {
              try {
                activeApp = await androidDriver.getForegroundApp();
              } catch {}
            }
            return sendJson({ success: true, devices, activeApp, timestamp: new Date().toISOString() });
          } catch (err) {
            return sendJson({ success: false, error: String(err) }, 500);
          }
        }

        if (req.method === 'POST') {
          try {
            const body = await readJson();
            const { action, deviceId, ip, port: targetPort, code } = body;

            if (action === 'switch_to_wifi') {
              const ep = await androidDriver.enableWireless(deviceId, targetPort ? Number(targetPort) : 5555);
              const devices = await androidDriver.listDevices();
              return sendJson({ success: true, endpoint: ep, devices, message: `Switched to Wi-Fi at ${ep}` });
            }

            if (action === 'disconnect_wifi') {
              await androidDriver.disableWireless(deviceId);
              const devices = await androidDriver.listDevices();
              return sendJson({ success: true, devices, message: 'Disconnected Wi-Fi session' });
            }

            if (action === 'connect_ip') {
              const resConn = await androidDriver.connectWifi(String(ip).trim(), targetPort ? Number(targetPort) : 5555);
              const devices = await androidDriver.listDevices();
              return sendJson({ success: resConn.success, devices, message: resConn.message });
            }

            if (action === 'pair_wifi') {
              const pairRes = await androidDriver.pairWifi(String(ip).trim(), Number(targetPort), String(code).trim());
              return sendJson({ success: pairRes.success, message: pairRes.message });
            }

            return sendJson({ success: false, error: `Unknown action: ${action}` }, 400);
          } catch (err) {
            return sendJson({ success: false, error: String(err) }, 500);
          }
        }
      }

      // 4. API: /api/capture (POST)
      if (req.method === 'POST' && pathname === '/api/capture') {
        try {
          const body = await readJson();
          const start = performance.now();
          const buffer = await captureDeviceScreenshot(body.deviceId);
          const latencyMs = Math.round(performance.now() - start);
          return sendJson({
            success: true,
            base64: buffer.toString('base64'),
            sizeBytes: buffer.length,
            latencyMs,
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          return sendJson({ success: false, error: String(err) }, 500);
        }
      }

      // 5. API: /api/export (POST)
      if (req.method === 'POST' && pathname === '/api/export') {
        try {
          const body = await readJson();
          const screens = body.screens || [];
          const exportMode = body.exportMode || 'all';

          // Multi-Screen Batch Export to ZIP
          if (body.format === 'zip' && screens.length > 0 && exportMode !== 'active') {
            const zipFiles: Array<{ path: string; buffer: Buffer }> = [];
            const isRawMode = body.gradientPreset === 'none';

            for (let i = 0; i < screens.length; i++) {
              const scr = screens[i];
              const screenBuffer = Buffer.from(scr.base64, 'base64');
              const filename = `screen-${String(i + 1).padStart(2, '0')}.png`;

              if (isRawMode && body.bezelId === 'none') {
                zipFiles.push({ path: `raw/${filename}`, buffer: screenBuffer });
              } else {
                const framed = await compositeFrame({
                  screenshotBuffer: screenBuffer,
                  bezelId: scr.bezelId || body.bezelId,
                  gradientPreset: scr.themeId || body.gradientPreset,
                  layout: scr.layout || body.layout,
                  font: scr.font || body.font,
                  title: scr.customTitle || body.title,
                  subtitle: scr.subtitle !== undefined ? scr.subtitle : body.subtitle,
                  footer: scr.footer || body.footer,
                  eyebrowTag: scr.customEyebrow || body.eyebrowTag,
                  showStarBadge: scr.showStars !== undefined ? scr.showStars : body.showStarBadge,
                  typographyPosition: scr.typographyPosition || body.typographyPosition || body.textPosition || 'top',
                  headlineFont: scr.headlineFont || body.headlineFont || body.font,
                  subtitleFont: scr.subtitleFont || body.subtitleFont || body.font,
                  textAlign: scr.textAlign || body.textAlign || 'center',
                  titleScaleMultiplier: scr.titleScale !== undefined ? Number(scr.titleScale) : (body.titleScaleMultiplier !== undefined ? Number(body.titleScaleMultiplier) : undefined),
                  subtitleScaleMultiplier: scr.subtitleScale !== undefined ? Number(scr.subtitleScale) : (body.subtitleScaleMultiplier !== undefined ? Number(body.subtitleScaleMultiplier) : undefined),
                  titleWeight: scr.titleWeight || body.titleWeight,
                  subtitleWeight: scr.subtitleWeight || body.subtitleWeight,
                  isItalic: scr.isItalic !== undefined ? Boolean(scr.isItalic) : (body.isItalic !== undefined ? Boolean(body.isItalic) : undefined),
                  textYOffset: scr.textOffset !== undefined ? Number(scr.textOffset) : (body.textYOffset !== undefined ? Number(body.textYOffset) : undefined),
                  bottomTextOffset: scr.bottomTextOffset !== undefined ? Number(scr.bottomTextOffset) : (body.bottomTextOffset !== undefined ? Number(body.bottomTextOffset) : undefined),
                  useCustomColors: scr.useCustomColors !== undefined
                    ? Boolean(scr.useCustomColors)
                    : (body.useCustomColors !== undefined ? Boolean(body.useCustomColors) : false),
                  customColors: (scr.useCustomColors !== undefined ? scr.useCustomColors : body.useCustomColors)
                    ? (scr.customColors || (scr.customColor1 && scr.customColor2 ? [scr.customColor1, scr.customColor2] : body.customColors))
                    : undefined,
                  phoneScaleMultiplier: scr.phoneScale !== undefined ? Number(scr.phoneScale) : (body.phoneScaleMultiplier !== undefined ? Number(body.phoneScaleMultiplier) : undefined),
                  phoneTopOffset: scr.phoneOffset !== undefined ? Number(scr.phoneOffset) : (body.phoneTopOffset !== undefined ? Number(body.phoneTopOffset) : undefined),
                  enableAmbientGlow: scr.ambientGlow !== undefined ? Boolean(scr.ambientGlow) : (body.enableAmbientGlow !== undefined ? Boolean(body.enableAmbientGlow) : undefined),
                });
                zipFiles.push({ path: `mockups/${filename}`, buffer: framed.buffer });
              }
            }

            const zipBuffer = await createStoreZip(zipFiles);
            res.writeHead(200, {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="adbsnap-export-${Date.now()}.zip"`,
              'Content-Length': zipBuffer.length,
            });
            return res.end(zipBuffer);
          }

          // Single Active Screen Export to ZIP (All App Store & Google Play resolutions)
          if (body.format === 'zip') {
            const rawBase64 = body.screenshotBase64 || (screens[0] ? screens[0].base64 : '');
            if (!rawBase64) return sendJson({ success: false, error: 'No screenshot provided' }, 400);

            const outputs = await exportMultiStore({
              screenshotBuffer: Buffer.from(rawBase64, 'base64'),
              bezelId: body.bezelId,
              gradientPreset: body.gradientPreset,
              layout: body.layout,
              title: body.title,
              subtitle: body.subtitle,
              footer: body.footer,
              eyebrowTag: body.eyebrowTag,
              font: body.font,
              showStarBadge: body.showStarBadge,
              typographyPosition: body.typographyPosition || body.textPosition || 'top',
              headlineFont: body.headlineFont || body.font,
              subtitleFont: body.subtitleFont || body.font,
              textAlign: body.textAlign || 'center',
              titleScaleMultiplier: body.titleScaleMultiplier !== undefined ? Number(body.titleScaleMultiplier) : undefined,
              subtitleScaleMultiplier: body.subtitleScaleMultiplier !== undefined ? Number(body.subtitleScaleMultiplier) : undefined,
              titleWeight: body.titleWeight,
              subtitleWeight: body.subtitleWeight,
              isItalic: body.isItalic !== undefined ? Boolean(body.isItalic) : undefined,
              textYOffset: body.textYOffset !== undefined ? Number(body.textYOffset) : undefined,
              bottomTextOffset: body.bottomTextOffset !== undefined ? Number(body.bottomTextOffset) : undefined,
              useCustomColors: Boolean(body.useCustomColors),
              customColors: body.useCustomColors ? body.customColors : undefined,
              phoneScaleMultiplier: body.phoneScaleMultiplier !== undefined ? Number(body.phoneScaleMultiplier) : undefined,
              phoneTopOffset: body.phoneTopOffset !== undefined ? Number(body.phoneTopOffset) : undefined,
              enableAmbientGlow: body.enableAmbientGlow !== undefined ? Boolean(body.enableAmbientGlow) : undefined,
            });

            const zipFiles = outputs.map(o => ({ path: o.path, buffer: o.buffer }));
            const zipBuffer = await createStoreZip(zipFiles);
            res.writeHead(200, {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="adbsnap-store-bundle-${Date.now()}.zip"`,
              'Content-Length': zipBuffer.length,
            });
            return res.end(zipBuffer);
          }

          // Live Single-Frame Preview Composite
          const rawBase64 = body.screenshotBase64 || (screens[0] ? screens[0].base64 : '');
          if (!rawBase64) return sendJson({ success: false, error: 'No screenshot provided' }, 400);

          const isPreview = Boolean(body.format === 'preview' || body.preview || body.mode === 'preview');
          const canvasWidth = isPreview ? 645 : (body.canvasWidth || 1290);
          const canvasHeight = isPreview ? 1398 : (body.canvasHeight || 2796);

          const result = await compositeFrame({
            screenshotBuffer: Buffer.from(rawBase64, 'base64'),
            bezelId: body.bezelId,
            gradientPreset: body.gradientPreset,
            layout: body.layout,
            title: body.title,
            subtitle: body.subtitle,
            footer: body.footer,
            eyebrowTag: body.eyebrowTag,
            font: body.font,
            showStarBadge: body.showStarBadge,
            typographyPosition: body.typographyPosition || body.textPosition || 'top',
            headlineFont: body.headlineFont || body.font,
            subtitleFont: body.subtitleFont || body.font,
            textAlign: body.textAlign || 'center',
            titleScaleMultiplier: body.titleScaleMultiplier !== undefined ? Number(body.titleScaleMultiplier) : undefined,
            subtitleScaleMultiplier: body.subtitleScaleMultiplier !== undefined ? Number(body.subtitleScaleMultiplier) : undefined,
            titleWeight: body.titleWeight,
            subtitleWeight: body.subtitleWeight,
            isItalic: body.isItalic !== undefined ? Boolean(body.isItalic) : undefined,
            textYOffset: body.textYOffset !== undefined ? Number(body.textYOffset) : undefined,
            bottomTextOffset: body.bottomTextOffset !== undefined ? Number(body.bottomTextOffset) : undefined,
            useCustomColors: Boolean(body.useCustomColors),
            customColors: body.useCustomColors ? body.customColors : undefined,
            phoneScaleMultiplier: body.phoneScaleMultiplier !== undefined ? Number(body.phoneScaleMultiplier) : undefined,
            phoneTopOffset: body.phoneTopOffset !== undefined ? Number(body.phoneTopOffset) : undefined,
            enableAmbientGlow: body.enableAmbientGlow !== undefined ? Boolean(body.enableAmbientGlow) : undefined,
            canvasWidth,
            canvasHeight,
          });

          return sendJson({
            success: true,
            base64: result.buffer.toString('base64'),
            width: result.width,
            height: result.height,
            elapsedMs: result.elapsedMs,
          });
        } catch (err) {
          return sendJson({ success: false, error: String(err) }, 500);
        }
      }

      // 6. API: /api/demomode (POST)
      if (req.method === 'POST' && pathname === '/api/demomode') {
        try {
          const body = await readJson();
          await androidDriver.setDemoMode(Boolean(body.enabled), body.deviceId);
          return sendJson({ success: true, enabled: Boolean(body.enabled) });
        } catch (err) {
          return sendJson({ success: false, error: String(err) }, 500);
        }
      }

      // 7. API: /api/animate (POST)
      if (req.method === 'POST' && pathname === '/api/animate') {
        try {
          const body = await readJson();
          const screens = body.screens || [];
          const delayMs = Number(body.delayMs) || 1800;

          if (screens.length === 0) return sendJson({ success: false, error: 'Screens required' }, 400);

          const framedBuffers: Buffer[] = [];
          for (let i = 0; i < screens.length; i++) {
            const scr = screens[i];
            const useScreenCustom = scr.useCustomColors !== undefined
              ? Boolean(scr.useCustomColors)
              : (body.useCustomColors !== undefined ? Boolean(body.useCustomColors) : false);

            const screenColors = useScreenCustom
              ? (scr.customColors || (scr.customColor1 && scr.customColor2 ? [scr.customColor1, scr.customColor2] : body.customColors))
              : undefined;

            const framed = await compositeFrame({
              screenshotBuffer: Buffer.from(scr.base64, 'base64'),
              bezelId: scr.bezelId || body.bezelId,
              gradientPreset: scr.themeId || body.gradientPreset,
              layout: scr.layout || body.layout,
              font: scr.font || body.font,
              title: scr.customTitle || body.title || `Feature #${i + 1}`,
              subtitle: scr.subtitle !== undefined ? scr.subtitle : body.subtitle,
              showStarBadge: scr.showStars !== undefined ? scr.showStars : body.showStarBadge,
              useCustomColors: useScreenCustom,
              customColors: screenColors,
              canvasWidth: 1080,
              canvasHeight: 1920,
            });
            framedBuffers.push(framed.buffer);
          }

          if (body.action === 'preview') {
            return sendJson({
              success: true,
              frames: framedBuffers.map(b => b.toString('base64')),
              count: framedBuffers.length,
            });
          }

          const gifBuffer = await createAnimatedGif(framedBuffers, delayMs, 540);
          res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Disposition': `attachment; filename="adbsnap-story.gif"`,
            'Content-Length': gifBuffer.length,
          });
          return res.end(gifBuffer);
        } catch (err) {
          return sendJson({ success: false, error: String(err) }, 500);
        }
      }

      // 8. API: /api/crawl (POST)
      if (req.method === 'POST' && pathname === '/api/crawl') {
        try {
          const body = await readJson();
          if (body.package) {
            await androidDriver.launchApp(body.package, body.deviceId);
            await new Promise(r => setTimeout(r, 1500));
          }
          const crawledTabs = await uiCrawler.crawlTabs(body.deviceId);
          const screens = [];
          for (let i = 0; i < crawledTabs.length; i++) {
            const tab = crawledTabs[i];
            const composited = await compositeFrame({
              screenshotBuffer: tab.screenshotBuffer,
              bezelId: body.frame || 'iphone-16-pro',
              gradientPreset: body.theme || 'studioLight',
              layout: body.layout || 'appstore',
              font: body.font || 'modern',
              title: tab.title,
              subtitle: `Automated view from ${body.package || 'active app'}`,
              showStarBadge: body.stars ?? true,
            });
            screens.push({
              index: i + 1,
              title: tab.title,
              base64: composited.buffer.toString('base64'),
              rawBase64: tab.screenshotBuffer.toString('base64'),
              elapsedMs: tab.elapsedMs,
            });
          }
          return sendJson({ success: true, tabsCount: screens.length, screens });
        } catch (err) {
          return sendJson({ success: false, error: String(err) }, 500);
        }
      }

      // 404 Fallback
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    server.listen(port, '0.0.0.0', () => {
      resolve(server);
    });

    server.on('error', reject);
  });
}