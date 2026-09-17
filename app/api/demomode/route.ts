import { NextResponse } from 'next/server';
import { androidDriver } from '@/lib/adb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { enabled, deviceId } = body;

    await androidDriver.setDemoMode(Boolean(enabled), deviceId);

    return NextResponse.json({
      success: true,
      enabled: Boolean(enabled),
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
