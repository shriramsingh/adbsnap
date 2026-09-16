import { NextResponse } from 'next/server';
import { androidDriver } from '@/lib/adb';
import { compositeFrame, exportMultiStore } from '@/lib/sharp';
import { createStoreZip } from '@/lib/zip';
import type { LayoutMode } from '@/constants/themes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

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
