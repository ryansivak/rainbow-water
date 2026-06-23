import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDb();
  const q = req.nextUrl.searchParams.get('q') || '';
  if (!q.trim() || !db) return NextResponse.json({ contacts:[], messages:[], voicemails:[] });
  const like = `%${q}%`;
  return NextResponse.json({
    contacts:  db.prepare('SELECT * FROM contacts WHERE name LIKE ? OR phone LIKE ? OR address LIKE ? LIMIT 50').all(like,like,like),
    messages:  db.prepare('SELECT m.*,c.name FROM messages m LEFT JOIN contacts c ON m.normalized_phone=c.normalized_phone WHERE m.body LIKE ? LIMIT 50').all(like),
    voicemails:db.prepare('SELECT v.*,c.name FROM voicemails v LEFT JOIN contacts c ON v.normalized_phone=c.normalized_phone WHERE v.transcript LIKE ? LIMIT 50').all(like),
  });
}
