import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const cfg = loadConfig();
  if (!cfg.openPhoneApiKey)
    return NextResponse.json({ error: 'Quo not configured.' }, { status: 400 });
  try {
    const res = await fetch(`https://api.openphone.com/v1/call-transcripts/${params.id}`, {
      headers: { Authorization: cfg.openPhoneApiKey, 'Content-Type': 'application/json' },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Quo ${res.status}: ${text.slice(0, 300)}`);
    return NextResponse.json(JSON.parse(text));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
