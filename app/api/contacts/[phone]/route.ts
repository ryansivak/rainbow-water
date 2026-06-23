import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { phone: string } }) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const norm = decodeURIComponent(params.phone);
  const contact = db.prepare('SELECT * FROM contacts WHERE normalized_phone=?').get(norm);
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    contact,
    messages:  db.prepare('SELECT * FROM messages WHERE normalized_phone=? ORDER BY datetime').all(norm),
    calls:     db.prepare('SELECT * FROM calls WHERE normalized_phone=? ORDER BY datetime').all(norm),
    voicemails:db.prepare('SELECT * FROM voicemails WHERE normalized_phone=? ORDER BY datetime').all(norm),
    addresses: db.prepare('SELECT * FROM detected_addresses WHERE normalized_phone=? ORDER BY confidence DESC').all(norm),
    leads:     db.prepare('SELECT * FROM leads WHERE phone=?').all(norm),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { phone: string } }) {
  const db = getDb();
  if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' });
  const norm = decodeURIComponent(params.phone);
  const { name, address, notes, tags, lead_status } = await req.json();
  db.prepare(`UPDATE contacts SET
    name=COALESCE(?,name), address=COALESCE(?,address), notes=COALESCE(?,notes),
    tags=COALESCE(?,tags), lead_status=COALESCE(?,lead_status)
    WHERE normalized_phone=?`)
    .run(name??null, address??null, notes??null, tags??null, lead_status??null, norm);
  return NextResponse.json({ ok: true });
}
