import { NextResponse } from 'next/server';
import { androidDriver } from '@/lib/adb';
import { uiCrawler } from '@/lib/crawler';
import { compositeFrame } from '@/lib/sharp';
import type { LayoutMode } from '@/constants/themes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const deviceId = body.deviceId;
    const targetPackage = body.package;

    const theme = body.theme || 'studioLight';
    const frame = body.frame || 'iphone-16-pro';
    const layout = (body.layout as LayoutMode) || 'appstore';
    const font = body.font || 'modern';
    const stars = body.stars ?? true;

    // Launch package if specified
    if (targetPackage) {
      await androidDriver.launchApp(targetPackage, deviceId);
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Crawl all bottom navigation tabs
    const crawledTabs = await uiCrawler.crawlTabs(deviceId);
    const screens = [];

    for (let i = 0; i < crawledTabs.length; i++) {
      const tab = crawledTabs[i];
      const composited = await compositeFrame({
        screenshotBuffer: tab.screenshotBuffer,
        bezelId: frame,
        gradientPreset: theme,
        layout,
        font,
        title: tab.title,
        subtitle: `Automated view captured from ${targetPackage || 'active mobile app'}`,
        showStarBadge: stars,
      });

      screens.push({
        index: i + 1,
        title: tab.title,
        base64: composited.buffer.toString('base64'),
        rawBase64: tab.screenshotBuffer.toString('base64'),
        elapsedMs: tab.elapsedMs,
      });
    }

    return NextResponse.json({
      success: true,
      tabsCount: screens.length,
      screens,
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
