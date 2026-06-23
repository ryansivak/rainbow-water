import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
export const dynamic = 'force-dynamic';

const ALLOWED_SORT = ['name','phone','address','text_count','call_count','voicemail_count','last_contact','first_contact','lead_status'];

export async function GET(req: NextRequest) {
  const db = getDb();
  if (!db) return NextResponse.json({ rows: [], total: 0 });
  const { searchParams: p } = req.nextUrl;
  const q     = p.get('q') || '';
  const sort  = ALLOWED_SORT.includes(p.get('sort') || '') ? p.get('sort')! : 'last_contact';
  const dir   = p.get('dir') === 'asc' ? 'ASC' : 'DESC';
  const limit = Math.min(parseInt(p.get('limit') || '100'), 500);
  const offset= parseInt(p.get('offset') || '0');
  const where = q ? ' WHERE (name LIKE ? OR phone LIKE ? OR normalized_phone LIKE ? OR address LIKE ?)' : '';
  const like  = `%${q}%`;
  const args  = q ? [like,like,like,like] : [];
  const rows  = db.prepare(`SELECT * FROM contacts${where} ORDER BY ${sort} ${dir} LIMIT ? OFFSET ?`).all(...args, limit, offset);
  const total = (db.prepare(`SELECT COUNT(*) as c FROM contacts${where}`).get(...args) as any).c;
  return NextResponse.json({ rows, total });
}
