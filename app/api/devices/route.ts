import { NextResponse } from 'next/server';
import { androidDriver } from '@/lib/adb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const devices = await androidDriver.listDevices();
    let activeApp: string | null = null;

    if (devices.some((d) => d.isAuthorized)) {
      try {
        activeApp = await androidDriver.getForegroundApp();
      } catch {
        // App query is optional if screen is locked
      }
    }

    return NextResponse.json({
      success: true,
      devices,
      activeApp,
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
