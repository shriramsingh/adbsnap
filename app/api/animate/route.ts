import { NextResponse } from 'next/server';
import { compositeFrame, createAnimatedGif } from '@/lib/sharp';
import type { LayoutMode } from '@/constants/themes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ScreenItem {
  base64: string;
  customTitle?: string;
  label?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const screens: ScreenItem[] = body.screens || [];
    const delayMs = Number(body.delayMs) || 1800;
    const bezelId = body.bezelId || 'iphone-16-pro';
    const gradientPreset = body.gradientPreset || 'studioLight';
    const layout = (body.layout as LayoutMode) || 'appstore';
    const font = body.font || 'modern';
    const showStarBadge = body.showStarBadge ?? false;

    if (screens.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one screen is required to generate animated GIF' },
        { status: 400 }
      );
    }

    // Composite each screen with current styling
    const framedBuffers: Buffer[] = [];

    for (let i = 0; i < screens.length; i++) {
      const scr = screens[i];
      const screenBuffer = Buffer.from(scr.base64, 'base64');
      const framed = await compositeFrame({
        screenshotBuffer: screenBuffer,
        bezelId,
        gradientPreset,
        layout,
        font,
        title: scr.customTitle || body.title || `Feature #${i + 1}`,
        subtitle: body.subtitle || 'Effortless automated mobile screenshot studio.',
        showStarBadge,
        canvasWidth: 1080,
        canvasHeight: 1920,
      });
      framedBuffers.push(framed.buffer);
    }

    // Generate animated GIF (scaled to 540px width for fast loading & sub-1MB size)
    const gifBuffer = await createAnimatedGif(framedBuffers, delayMs, 540);

    return new Response(new Uint8Array(gifBuffer), {
      headers: {
        'Content-Type': 'image/gif',
        'Content-Disposition': 'attachment; filename="adbsnap-animated-story.gif"',
      },
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
