import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function toCSV(headers: string[], rows: any[]) {
  const head = headers.join(',');
  const body = rows.map(r => headers.map(h => `"${(r[h]??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
  return head + '\n' + body;
}

export async function GET(_req: NextRequest, { params }: { params: { type: string } }) {
  const db = getDb();
  let csv = '', filename = '';

  if (params.type === 'contacts') {
    const rows = db.prepare('SELECT * FROM contacts ORDER BY last_contact DESC').all();
    csv = toCSV(['phone','name','address','text_count','call_count','voicemail_count','first_contact','last_contact','lead_status','tags','notes'], rows);
    filename = 'contacts.csv';
  } else if (params.type === 'top-customers') {
    const rows = db.prepare('SELECT * FROM contacts ORDER BY text_count DESC LIMIT 20').all();
    csv = toCSV(['phone','name','address','text_count','call_count','voicemail_count','last_contact'], rows);
    filename = 'top-customers.csv';
  } else if (params.type === 'leads') {
    const rows = db.prepare("SELECT l.*,c.name as cname FROM leads l LEFT JOIN contacts c ON l.phone=c.normalized_phone ORDER BY confidence DESC").all();
    csv = toCSV(['phone','cname','address','reason_flagged','confidence','follow_up_status','notes'], rows);
    filename = 'missed-leads.csv';
  } else if (params.type === 'with-address') {
    const rows = db.prepare("SELECT * FROM contacts WHERE address IS NOT NULL AND address!='' ORDER BY last_contact DESC").all();
    csv = toCSV(['phone','name','address','text_count','call_count','last_contact'], rows);
    filename = 'contacts-with-address.csv';
  } else if (params.type === 'no-address') {
    const rows = db.prepare("SELECT * FROM contacts WHERE address IS NULL OR address='' ORDER BY last_contact DESC").all();
    csv = toCSV(['phone','name','text_count','call_count','last_contact'], rows);
    filename = 'contacts-no-address.csv';
  } else {
    return NextResponse.json({ error: 'Unknown export type' }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
