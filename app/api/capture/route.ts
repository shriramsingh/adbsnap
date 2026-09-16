import { NextResponse } from 'next/server';
import { androidDriver } from '@/lib/adb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let deviceId: string | undefined;
    try {
      const body = await req.json();
      deviceId = body.deviceId;
    } catch {
      // Body is optional
    }

    const start = performance.now();
    const buffer = await androidDriver.captureScreenshot(deviceId);
    const latencyMs = Math.round(performance.now() - start);

    return NextResponse.json({
      success: true,
      base64: buffer.toString('base64'),
      sizeBytes: buffer.length,
      latencyMs,
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
