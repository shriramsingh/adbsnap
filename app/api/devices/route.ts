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
      let cleanIp = String(ip).trim();
      let targetPort = port ? Number(port) : 5555;
      if (cleanIp.includes(':')) {
        const parts = cleanIp.split(':');
        cleanIp = parts[0];
        if (parts[1] && !isNaN(Number(parts[1]))) {
          targetPort = Number(parts[1]);
        }
      }

      const res = await androidDriver.connectWifi(cleanIp, targetPort);
      if (!res.success) {
        return NextResponse.json(
          {
            success: false,
            error: res.message || `Failed to connect to ${cleanIp}:${targetPort}. Ensure phone is on the same Wi-Fi network and wireless debugging is active.`,
          },
          { status: 400 }
        );
      }
      const devices = await androidDriver.listDevices();
      return NextResponse.json({
        success: true,
        endpoint: `${cleanIp}:${targetPort}`,
        devices,
        message: res.message || `Successfully connected to ${cleanIp}:${targetPort}`,
      });
    }

    if (action === 'pair_wifi') {
      if (!ip || !port || !code) {
        return NextResponse.json({ success: false, error: 'IP, pairing port, and 6-digit code are required' }, { status: 400 });
      }
      let cleanIp = String(ip).trim();
      let targetPort = Number(port);
      if (cleanIp.includes(':')) {
        const parts = cleanIp.split(':');
        cleanIp = parts[0];
        if (parts[1] && !isNaN(Number(parts[1]))) {
          targetPort = Number(parts[1]);
        }
      }

      const pairRes = await androidDriver.pairWifi(cleanIp, targetPort, String(code).trim());
      if (!pairRes.success) {
        return NextResponse.json(
          { success: false, error: pairRes.message || `Pairing failed with ${cleanIp}:${targetPort}. Please verify the 6-digit pairing code.` },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: pairRes.message || `Successfully paired with ${cleanIp}:${targetPort}`,
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
