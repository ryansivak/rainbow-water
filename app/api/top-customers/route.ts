import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.*,
      (SELECT body FROM messages WHERE normalized_phone=c.normalized_phone ORDER BY datetime DESC LIMIT 1) as last_message
    FROM contacts c ORDER BY c.text_count DESC, c.call_count DESC LIMIT 20
  `).all();
  return NextResponse.json(rows);
}
