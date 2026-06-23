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
    return NextResponse.json({ error: 'Quo not configured — go to Settings.' }, { status: 400 });

  try {
    const p = req.nextUrl.searchParams;
    const maxResults = p.get('maxResults') || '50';

    const numbersData = await quoFetch('/phone-numbers', cfg.openPhoneApiKey);
    const phoneNumbers: any[] = numbersData.data || [];

    if (phoneNumbers.length === 0)
      return NextResponse.json({ data: [], phoneNumbers: [] });

    const allCalls: any[] = [];

    for (const num of phoneNumbers) {
      try {
        // Fetch recent conversations to get participant phone numbers
        const convData = await quoFetch(
          `/conversations?phoneNumberId=${num.id}&maxResults=25`,
          cfg.openPhoneApiKey
        );
        const conversations: any[] = convData.data || [];

        // Fetch calls for each conversation's participants
        for (const conv of conversations) {
          const participants: string[] = conv.participants || [];
          if (!participants.length) continue;
          try {
            const qs = new URLSearchParams({ phoneNumberId: num.id, maxResults: '5' });
            participants.forEach(p => qs.append('participants[]', p));
            const callData = await quoFetch(`/calls?${qs}`, cfg.openPhoneApiKey);
            const calls = (callData.data || []).map((c: any) => ({
              ...c,
              phoneNumber: num.formattedNumber,
              phoneNumberId: num.id,
            }));
            allCalls.push(...calls);
          } catch {
            // skip conversations that error
          }
        }
      } catch {
        // skip numbers that error
      }
    }

    // Deduplicate by call ID
    const seen = new Set<string>();
    const unique = allCalls.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
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
