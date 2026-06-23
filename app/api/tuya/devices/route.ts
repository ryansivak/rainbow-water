import { NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';
import { tuyaFetch, invalidateToken } from '@/lib/tuya';

export async function GET() {
  const cfg = loadConfig();
  if (!cfg.tuyaClientId || !cfg.tuyaSecret)
    return NextResponse.json({ error: 'Tuya not configured — go to Settings.' }, { status: 400 });
  const ids = (cfg.tuyaDeviceIds || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!ids.length)
    return NextResponse.json({ error: 'No device IDs configured — go to Settings.' }, { status: 400 });
  try {
    const devices = await Promise.all(ids.map(async id => {
      const [info, status] = await Promise.all([
        tuyaFetch(`/v1.0/iot-03/devices/${id}`, cfg).catch(() => ({ id, name: id })),
        tuyaFetch(`/v1.0/iot-03/devices/${id}/status`, cfg).catch(() => []),
      ]);
      return { ...info, status };
    }));
    return NextResponse.json({ devices, thresholds: cfg.tuyaThresholds || {} });
  } catch (e: any) {
    invalidateToken();
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
