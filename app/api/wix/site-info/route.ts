import { NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function GET() {
  const cfg = loadConfig();
  if (!cfg.wixApiKey)
    return NextResponse.json({ error: 'Wix API key not configured.' }, { status: 400 });
  try {
    // This endpoint returns the sites the API key has access to
    const res = await fetch('https://www.wixapis.com/site-list/v2/sites/query', {
      method: 'POST',
      headers: {
        Authorization: cfg.wixApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: {} }),
    });
    const text = await res.text();
    if (!res.ok) return NextResponse.json({ error: `Wix ${res.status}: ${text.slice(0, 400)}` }, { status: 500 });
    const data = JSON.parse(text);
    // Return site names + IDs to help user pick the right one
    const sites = (data.sites || []).map((s: any) => ({
      id: s.id,
      displayName: s.displayName,
      namespace: s.namespace,
    }));
    return NextResponse.json({ sites, raw: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
