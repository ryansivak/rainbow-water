import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const { follow_up_status, notes } = await req.json();
  db.prepare('UPDATE leads SET follow_up_status=COALESCE(?,follow_up_status), notes=COALESCE(?,notes) WHERE id=?')
    .run(follow_up_status??null, notes??null, params.id);
  return NextResponse.json({ ok: true });
}
