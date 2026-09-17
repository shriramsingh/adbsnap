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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, deviceId, ip, port, code } = body;

    if (action === 'switch_to_wifi') {
      if (!deviceId) {
        return NextResponse.json({ success: false, error: 'deviceId is required' }, { status: 400 });
      }
      const targetPort = port ? Number(port) : 5555;
      const endpoint = await androidDriver.enableWireless(deviceId, targetPort);
      const [deviceIp, portStr] = endpoint.split(':');
      const devices = await androidDriver.listDevices();

      return NextResponse.json({
        success: true,
        endpoint,
        ip: deviceIp,
        port: portStr ? Number(portStr) : targetPort,
        devices,
        message: `Switched to Wi-Fi at ${endpoint}. You can now unplug the USB cable.`,
      });
    }

    if (action === 'disconnect_wifi') {
      await androidDriver.disableWireless(deviceId);
      const devices = await androidDriver.listDevices();

      return NextResponse.json({
        success: true,
        devices,
        message: 'Disconnected Wi-Fi session. Reverted to USB mode.',
      });
    }

    if (action === 'connect_ip') {
      if (!ip) {
        return NextResponse.json({ success: false, error: 'IP address is required' }, { status: 400 });
      }
      const targetPort = port ? Number(port) : 5555;
      const connected = await androidDriver.connectWifi(ip, targetPort);
      if (!connected) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to connect to ${ip}:${targetPort}. Ensure phone is on the same Wi-Fi network and wireless debugging is enabled.`,
          },
          { status: 400 }
        );
      }
      const devices = await androidDriver.listDevices();
      return NextResponse.json({
        success: true,
        endpoint: `${ip}:${targetPort}`,
        devices,
        message: `Successfully connected to ${ip}:${targetPort}`,
      });
    }

    if (action === 'pair_wifi') {
      if (!ip || !port || !code) {
        return NextResponse.json({ success: false, error: 'IP, pairing port, and 6-digit code are required' }, { status: 400 });
      }
      const paired = await androidDriver.pairWifi(ip, Number(port), String(code));
      if (!paired) {
        return NextResponse.json(
          { success: false, error: `Pairing failed with ${ip}:${port}. Please verify the 6-digit pairing code.` },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: `Successfully paired with ${ip}:${port}`,
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
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
