import { NextResponse } from 'next/server';
import { androidDriver } from '@/lib/adb';
import { compositeFrame, exportMultiStore } from '@/lib/sharp';
import { createStoreZip } from '@/lib/zip';
import type { LayoutMode } from '@/constants/themes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ScreenInput {
  id?: string;
  index?: number;
  label?: string;
  base64: string;
  customTitle?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const screens: ScreenInput[] = body.screens || [];
    const exportMode = body.exportMode || 'all';

    // 1. Multi-Screen Batch Export to ZIP
    if (body.format === 'zip' && screens.length > 0 && exportMode !== 'active') {
      const zipFiles: Array<{ path: string; buffer: Buffer }> = [];
      const isRawMode = body.gradientPreset === 'none';

      if (isRawMode) {
        const isFrameless = body.bezelId === 'none';
        const folder = isFrameless ? 'raw-screenshots' : 'transparent-mockups';

        for (let i = 0; i < screens.length; i++) {
          const scr = screens[i];
          const screenBuffer = Buffer.from(scr.base64, 'base64');
          const screenIndexStr = String(i + 1).padStart(2, '0');
          const rawName = scr.customTitle || scr.label || `screen-${i + 1}`;
          const slug =
            rawName
              .toLowerCase()
              .replace(/[^a-z0-9_-]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '') || `screen-${i + 1}`;
          const filename = `${screenIndexStr}-${slug}.png`;

          if (isFrameless) {
            zipFiles.push({
              path: `${folder}/${filename}`,
              buffer: screenBuffer,
            });
          } else {
            const framed = await compositeFrame({
              screenshotBuffer: screenBuffer,
              bezelId: body.bezelId,
              gradientPreset: 'none',
            });
            zipFiles.push({
              path: `${folder}/${filename}`,
              buffer: framed.buffer,
            });
          }
        }

        const zipBuffer = await createStoreZip(zipFiles);
        return new Response(new Uint8Array(zipBuffer), {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="adbsnap-${screens.length}-${folder}.zip"`,
          },
        });
      }

      for (let i = 0; i < screens.length; i++) {
        const scr = screens[i];
        const screenBuffer = Buffer.from(scr.base64, 'base64');
        const screenIndexStr = String(i + 1).padStart(2, '0');
        const rawName = scr.customTitle || scr.label || `screen-${i + 1}`;
        const slug =
          rawName
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || `screen-${i + 1}`;
        const filename = `${screenIndexStr}-${slug}.png`;

        const screenOptions = {
          screenshotBuffer: screenBuffer,
          bezelId: body.bezelId || 'iphone-16-pro',
          gradientPreset: body.gradientPreset || 'studioLight',
          layout: (body.layout as LayoutMode) || 'appstore',
          font: body.font || 'modern',
          title: scr.customTitle || body.title || 'Transform Your Workflow',
          subtitle: body.subtitle || 'Effortless automated mobile screenshot studio.',
          showStarBadge: body.showStarBadge ?? false,
        };

        const batchResult = await exportMultiStore(screenOptions);
        for (const t of batchResult) {
          zipFiles.push({
            path: `${t.target.folder}/${filename}`,
            buffer: t.buffer,
          });
        }
      }

      const zipBuffer = await createStoreZip(zipFiles);
      return new Response(new Uint8Array(zipBuffer), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="adbsnap-${screens.length}-screens-all-stores.zip"`,
        },
      });
    }

    // 2. Single Screen Export (Active screen or single device capture)
    let screenshotBuffer: Buffer;
    if (body.screenshotBase64) {
      screenshotBuffer = Buffer.from(body.screenshotBase64, 'base64');
    } else {
      screenshotBuffer = await androidDriver.captureScreenshot(body.deviceId);
    }

    const options = {
      screenshotBuffer,
      bezelId: body.bezelId || 'iphone-16-pro',
      gradientPreset: body.gradientPreset || 'studioLight',
      layout: (body.layout as LayoutMode) || 'appstore',
      font: body.font || 'modern',
      title: body.title || 'Transform Your Workflow',
      subtitle: body.subtitle || 'Effortless automated mobile screenshot studio.',
      showStarBadge: body.showStarBadge ?? false,
    };

    if (body.format === 'zip') {
      if (body.gradientPreset === 'none') {
        const isFrameless = body.bezelId === 'none';
        const folder = isFrameless ? 'raw-screenshots' : 'transparent-mockups';
        const framed = await compositeFrame(options);
        const zipFiles = [
          {
            path: `${folder}/screenshot.png`,
            buffer: framed.buffer,
          },
        ];
        const zipBuffer = await createStoreZip(zipFiles);
        return new Response(new Uint8Array(zipBuffer), {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="adbsnap-${folder}.zip"`,
          },
        });
      }

      const batchResult = await exportMultiStore(options);
      const zipFiles = batchResult.map((t) => ({
        path: `${t.target.folder}/showcase.png`,
        buffer: t.buffer,
      }));

      const zipBuffer = await createStoreZip(zipFiles);

      return new Response(new Uint8Array(zipBuffer), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="adbsnap-store-assets.zip"',
        },
      });
    }

    // Default single framed preview
    const framed = await compositeFrame(options);

    if (body.format === 'raw-png') {
      return new Response(new Uint8Array(framed.buffer), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'inline; filename="showcase.png"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      base64: framed.buffer.toString('base64'),
      sizeBytes: framed.buffer.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
