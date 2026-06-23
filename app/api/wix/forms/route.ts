export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

async function wixReq(method: 'GET' | 'POST', path: string, apiKey: string, siteId: string, body?: object) {
  const res = await fetch('https://www.wixapis.com' + path, {
    method,
    headers: {
      Authorization: apiKey,
      'wix-site-id': siteId,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Wix ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

export async function GET(req: NextRequest) {
  const cfg = loadConfig();
  if (!cfg.wixApiKey || !cfg.wixSiteId)
    return NextResponse.json({ error: 'Wix not configured â€” go to Settings.' }, { status: 400 });

  const p = req.nextUrl.searchParams;
  const limit = parseInt(p.get('limit') || '50');

  // Try the Forms Submissions API first (requires Forms permission on API key)
  try {
    const body: any = {
      query: {
        paging: { limit },
        sort: [{ fieldName: '_createdDate', order: 'DESC' }],
      },
    };
    if (p.get('cursor')) body.query.cursorPaging = { cursor: p.get('cursor') };
    const data = await wixReq('POST', '/forms/v4/submissions/query', cfg.wixApiKey, cfg.wixSiteId, body);
    return NextResponse.json({ ...data, source: 'forms' });
  } catch {
    // Forms API unavailable â€” fall back to contacts with WIX_FORMS source
  }

  try {
    const contactBody = {
      filter: { 'source.sourceType': { $eq: 'WIX_FORMS' } },
      sort: [{ fieldName: 'createdDate', order: 'DESC' }],
      paging: { limit },
    };
    const data = await wixReq('POST', '/contacts/v4/contacts/query', cfg.wixApiKey, cfg.wixSiteId, contactBody);
    // Shape contacts to look like submissions for the UI
    const submissions = (data.contacts || []).map((c: any) => ({
      id: c.id,
      _createdDate: c.createdDate,
      submitter: {
        name: `${c.info?.name?.first || ''} ${c.info?.name?.last || ''}`.trim(),
        email: c.primaryInfo?.email,
        phone: c.primaryInfo?.phone,
      },
      source: 'contact',
    }));
    return NextResponse.json({
      submissions,
      source: 'contacts_fallback',
      notice: 'Add the Forms permission to your Wix API key to see full form submission data.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

