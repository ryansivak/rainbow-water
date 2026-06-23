import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// OpenPhone sends a secret in the header — set OPENPHONE_WEBHOOK_SECRET in config to verify
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();

    const { type, data } = body;

    if (type === 'call.completed') {
      const call = data?.object;
      if (call) {
        db.prepare(`
          INSERT OR REPLACE INTO calls
            (call_id, phone_number, contact_name, call_type, duration, call_date, recording_url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          call.id,
          call.from || call.to,
          null,
          call.direction === 'incoming' ? (call.status === 'missed' ? 'missed' : 'incoming') : 'outgoing',
          call.duration ?? 0,
          call.createdAt,
          call.recordingUrl ?? null,
        );
      }
    }

    if (type === 'call.recording.transcription.completed') {
      const call = data?.object;
      if (call?.id && call?.transcript) {
        db.prepare(`UPDATE calls SET transcript = ? WHERE call_id = ?`)
          .run(JSON.stringify(call.transcript), call.id);
      }
    }

    if (type === 'message.received') {
      const msg = data?.object;
      if (msg) {
        db.prepare(`
          INSERT OR IGNORE INTO messages
            (message_id, phone_number, direction, body, message_date)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          msg.id,
          msg.from,
          'incoming',
          msg.body ?? '',
          msg.createdAt,
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('OpenPhone webhook error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
