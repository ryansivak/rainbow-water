import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const { approved } = await req.json();
  db.prepare('UPDATE detected_addresses SET approved=? WHERE id=?').run(approved ? 1 : 0, params.id);
  if (approved) {
    const addr = db.prepare('SELECT * FROM detected_addresses WHERE id=?').get(params.id) as any;
    if (addr) db.prepare('UPDATE contacts SET address=? WHERE normalized_phone=?').run(addr.address_candidate, addr.normalized_phone);
  }
  return NextResponse.json({ ok: true });
}
