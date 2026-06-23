import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    if (!db) return NextResponse.json({ contacts:{c:0},messages:{c:0},calls:{c:0},missed:{c:0},voicemails:{c:0},leads:{c:0},noAddress:{c:0},lastRun:null });
    return NextResponse.json({
      contacts:  db.prepare('SELECT COUNT(*) as c FROM contacts').get(),
      messages:  db.prepare('SELECT COUNT(*) as c FROM messages').get(),
      calls:     db.prepare('SELECT COUNT(*) as c FROM calls').get(),
      missed:    db.prepare("SELECT COUNT(*) as c FROM calls WHERE call_type='missed'").get(),
      voicemails:db.prepare('SELECT COUNT(*) as c FROM voicemails').get(),
      leads:     db.prepare("SELECT COUNT(*) as c FROM leads WHERE follow_up_status!='done'").get(),
      noAddress: db.prepare("SELECT COUNT(*) as c FROM contacts WHERE address IS NULL OR address=''").get(),
      lastRun:   db.prepare('SELECT * FROM import_runs ORDER BY run_date DESC LIMIT 1').get(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
