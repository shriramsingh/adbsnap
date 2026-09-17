import { NextResponse } from 'next/server';
import { androidDriver } from '@/lib/adb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const seconds = Number(body.seconds) || 5;
    const deviceId = body.deviceId;

    const mp4Buffer = await androidDriver.recordVideo(seconds, deviceId);

    return new Response(new Uint8Array(mp4Buffer), {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="adbsnap-clip-${seconds}s.mp4"`,
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
