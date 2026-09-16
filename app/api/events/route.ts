import { androidDriver } from '@/lib/adb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let isAlive = true;

      const sendUpdate = async () => {
        if (!isAlive) return;
        try {
          const devices = await androidDriver.listDevices();
          let activeApp: string | null = null;
          if (devices.some((d) => d.isAuthorized)) {
            try {
              activeApp = await androidDriver.getForegroundApp();
            } catch {
              // Non-fatal if screen asleep
            }
          }

          const payload = JSON.stringify({
            devices,
            activeApp,
            timestamp: Date.now(),
          });

          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // Ignore polling errors
        }
      };

      // Immediate first tick
      sendUpdate();

      // Poll every 3 seconds
      const interval = setInterval(sendUpdate, 3000);

      // Clean up on cancel
      return () => {
        isAlive = false;
        clearInterval(interval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
