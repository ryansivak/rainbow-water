import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const status = req.nextUrl.searchParams.get('status');
  let sql = `SELECT l.*, c.name as contact_name, c.text_count, c.call_count, c.last_contact
    FROM leads l LEFT JOIN contacts c ON l.phone=c.normalized_phone`;
  const args: string[] = [];
  if (status && status !== 'all') { sql += ' WHERE l.follow_up_status=?'; args.push(status); }
  sql += ' ORDER BY l.confidence DESC, l.created_at DESC';
  return NextResponse.json(db.prepare(sql).all(...args));
}
