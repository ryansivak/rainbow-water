import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function normalizePhone(p: string): string {
  return (p || '').replace(/\D/g, '').replace(/^1(\d{10})$/, '$1');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();
    const { type, data } = body;

    if (type === 'call.completed') {
      const call = data?.object;
      if (call) {
        const phone = call.from || call.to || '';
        const callType = call.direction === 'incoming'
          ? (call.status === 'missed' ? 'missed' : 'answered')
          : 'outgoing';
        db.prepare(`
          INSERT OR IGNORE INTO calls
            (phone, normalized_phone, datetime, call_type, duration, recording_url, source_file, record_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          phone,
          normalizePhone(phone),
          call.createdAt || new Date().toISOString(),
          callType,
          call.duration ?? 0,
          call.recordingUrl ?? null,
          'quo_webhook',
          call.id,
        );
      }
    }

    if (type === 'call.transcript.completed') {
      const call = data?.object;
      if (call?.id && call?.transcript) {
        db.prepare(`UPDATE calls SET transcript = ? WHERE record_hash = ?`)
          .run(JSON.stringify(call.transcript), call.id);
      }
    }

    if (type === 'message.received') {
      const msg = data?.object;
      if (msg) {
        const phone = msg.from || '';
        db.prepare(`
          INSERT OR IGNORE INTO messages
            (phone, normalized_phone, datetime, direction, body, source_file, record_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          phone,
          normalizePhone(phone),
          msg.createdAt || new Date().toISOString(),
          'incoming',
          msg.body ?? '',
          'quo_webhook',
          msg.id,
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Quo webhook error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
