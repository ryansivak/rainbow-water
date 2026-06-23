import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

async function wixQuery(endpoint: string, body: object, apiKey: string, siteId: string) {
  const res = await fetch('https://www.wixapis.com' + endpoint, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'wix-site-id': siteId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Wix ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

export async function GET(req: NextRequest) {
  const cfg = loadConfig();
  if (!cfg.wixApiKey || !cfg.wixSiteId)
    return NextResponse.json({ error: 'Wix not configured — go to Settings.' }, { status: 400 });
  try {
    const p = req.nextUrl.searchParams;
    const body: any = {
      query: {
        paging: { limit: parseInt(p.get('limit') || '100') },
        sort: [{ fieldName: 'startDate', order: 'DESC' }],
      },
    };
    if (p.get('cursor')) body.query.cursorPaging = { cursor: p.get('cursor') };
    const data = await wixQuery('/bookings/v2/bookings/query', body, cfg.wixApiKey, cfg.wixSiteId);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
