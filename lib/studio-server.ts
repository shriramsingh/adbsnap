import http from 'node:http';
import { androidDriver } from './adb';
import { compositeFrame, exportMultiStore } from './sharp';
import { createStoreZip } from './zip';
import { getStudioHtml } from './studio-template';
import { APP_INFO } from '../constants/strings';

export interface StudioServerOptions {
  port: number;
}

export function startStudioServer(options: StudioServerOptions): Promise<http.Server> {
  const port = options.port || 3000;

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
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

      if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(getStudioHtml(APP_INFO.VERSION));
      }

      async function readJson(): Promise<any> {
        return new Promise((resolveJson, rejectJson) => {
          const chunks: Buffer[] = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', () => {
            try {
              const text = Buffer.concat(chunks).toString('utf8');
              resolveJson(text ? JSON.parse(text) : {});
            } catch (err) {
              rejectJson(err);
            }
          });
          req.on('error', rejectJson);
        });
      }

      function sendJson(data: any, status = 200) {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      }

      if (req.method === 'GET' && pathname === '/api/devices') {
        try {
          const devices = await androidDriver.listDevices();
          let activeApp: string | null = null;
          if (devices.some(d => d.isAuthorized)) {
            try {
              activeApp = await androidDriver.getForegroundApp();
            } catch {}
          }
          return sendJson({ success: true, devices, activeApp });
        } catch (err) {
          return sendJson({ success: false, error: String(err) }, 500);
        }
      }

      if (req.method === 'POST' && pathname === '/api/capture') {
        try {
          const body = await readJson();
          const start = performance.now();
          const buffer = await androidDriver.captureScreenshot(body.deviceId);
          const latencyMs = Math.round(performance.now() - start);
          return sendJson({
            success: true,
            base64: buffer.toString('base64'),
            sizeBytes: buffer.length,
            latencyMs,
          });
        } catch (err) {
          return sendJson({ success: false, error: String(err) }, 500);
        }
      }

      if (req.method === 'POST' && pathname === '/api/export') {
        try {
          const body = await readJson();
          const screenshotBuffer = Buffer.from(body.screenshotBase64, 'base64');

          if (body.mode === 'zip') {
            const outputs = await exportMultiStore({
              screenshotBuffer,
              bezelId: body.bezelId,
              gradientPreset: body.gradientPreset,
              layout: body.layout,
              title: body.title,
              subtitle: body.subtitle,
              font: body.font,
              showStarBadge: body.showStarBadge,
            });

            const zipFiles = outputs.map(o => ({
              path: o.path,
              buffer: o.buffer,
            }));

            const zipBuffer = await createStoreZip(zipFiles);
            res.writeHead(200, {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="adbsnap-export-${Date.now()}.zip"`,
              'Content-Length': zipBuffer.length,
            });
            return res.end(zipBuffer);
          } else {
            const result = await compositeFrame({
              screenshotBuffer,
              bezelId: body.bezelId,
              gradientPreset: body.gradientPreset,
              layout: body.layout,
              title: body.title,
              subtitle: body.subtitle,
              font: body.font,
              showStarBadge: body.showStarBadge,
              canvasWidth: 1290,
              canvasHeight: 2796,
            });

            return sendJson({
              success: true,
              base64: result.buffer.toString('base64'),
              width: result.width,
              height: result.height,
              elapsedMs: result.elapsedMs,
            });
          }
        } catch (err) {
          return sendJson({ success: false, error: String(err) }, 500);
        }
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    server.listen(port, '0.0.0.0', () => {
      resolve(server);
    });

    server.on('error', reject);
  });
}