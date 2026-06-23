export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

async function quoFetch(path: string, apiKey: string) {
  const res = await fetch('https://api.openphone.com/v1' + path, {
    headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Quo ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

export async function GET(req: NextRequest) {
  const cfg = loadConfig();
  if (!cfg.openPhoneApiKey)
    return NextResponse.json({ error: 'Quo not configured â€” go to Settings.' }, { status: 400 });

  try {
    const p = req.nextUrl.searchParams;
    const maxResults = p.get('maxResults') || '50';

    const numbersData = await quoFetch('/phone-numbers', cfg.openPhoneApiKey);
    const phoneNumbers: any[] = numbersData.data || [];

    if (phoneNumbers.length === 0)
      return NextResponse.json({ data: [], phoneNumbers: [] });

    // Fetch conversations first, then get messages per conversation participant
    const allMessages: any[] = [];
    for (const num of phoneNumbers) {
      try {
        const convQs = new URLSearchParams({ phoneNumberId: num.id, maxResults: '25' });
        const convData = await quoFetch(`/conversations?${convQs}`, cfg.openPhoneApiKey);
        const conversations: any[] = convData.data || [];

        for (const conv of conversations) {
          const participants: string[] = conv.participants || [];
          if (!participants.length) continue;
          try {
            const qs = new URLSearchParams({ phoneNumberId: num.id, maxResults: '10' });
            participants.forEach(p => qs.append('participants[]', p));
            const msgData = await quoFetch(`/messages?${qs}`, cfg.openPhoneApiKey);
            const msgs = (msgData.data || []).map((m: any) => ({
              ...m,
              phoneNumber: num.formattedNumber,
              phoneNumberId: num.id,
            }));
            allMessages.push(...msgs);
          } catch {
            // skip conversations that error
          }
        }
      } catch {
        // skip numbers that error
      }
    }

    // Deduplicate by message ID
    const seen = new Set<string>();
    const unique = allMessages.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    unique.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ data: unique, phoneNumbers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

