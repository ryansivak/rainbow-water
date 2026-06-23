import { NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';
import { tuyaFetch } from '@/lib/tuya';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cfg = loadConfig();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const push = async () => {
        if (!cfg.tuyaClientId || !cfg.tuyaSecret) return;
        const ids = (cfg.tuyaDeviceIds || '').split(',').map(s => s.trim()).filter(Boolean);
        if (!ids.length) return;
        try {
          const devices = await Promise.all(ids.map(async id => {
            const [info, status] = await Promise.all([
              tuyaFetch(`/v1.0/iot-03/devices/${id}`, cfg).catch(() => ({ id, name: id })),
              tuyaFetch(`/v1.0/iot-03/devices/${id}/status`, cfg).catch(() => []),
            ]);
            return { ...info, status };
          }));
          send({ devices, thresholds: cfg.tuyaThresholds || {}, ts: Date.now() });
        } catch { /* skip on error */ }
      };

      await push();
      const interval = setInterval(push, 30000);
      // Clean up when client disconnects
      return () => clearInterval(interval);
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
