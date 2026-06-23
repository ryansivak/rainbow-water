import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

async function opFetch(path: string, apiKey: string) {
  const res = await fetch('https://api.openphone.com/v1' + path, {
    headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`OpenPhone ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

export async function GET(req: NextRequest) {
  const cfg = loadConfig();
  if (!cfg.openPhoneApiKey)
    return NextResponse.json({ error: 'OpenPhone not configured — go to Settings.' }, { status: 400 });

  try {
    const p = req.nextUrl.searchParams;
    const maxResults = p.get('maxResults') || '50';
    const pageToken = p.get('pageToken');

    // Get all phone numbers for this account
    const numbersData = await opFetch('/phone-numbers', cfg.openPhoneApiKey);
    const phoneNumbers: any[] = numbersData.data || [];

    if (phoneNumbers.length === 0)
      return NextResponse.json({ data: [], phoneNumbers: [] });

    // Get conversations across all phone numbers (conversations = call/message threads)
    const allConversations: any[] = [];
    for (const num of phoneNumbers) {
      try {
        const qs = new URLSearchParams({ phoneNumberId: num.id, maxResults });
        if (pageToken) qs.set('pageToken', pageToken);
        const convData = await opFetch(`/conversations?${qs}`, cfg.openPhoneApiKey);
        const convs = (convData.data || []).map((c: any) => ({
          ...c,
          phoneNumber: num.formattedNumber,
          phoneNumberId: num.id,
        }));
        allConversations.push(...convs);
      } catch {
        // Skip numbers that error
      }
    }

    // For each conversation, fetch the last call if any
    const conversationsWithCalls = await Promise.all(
      allConversations.map(async (conv) => {
        try {
          const participant = conv.participants?.[0];
          if (!participant) return { ...conv, lastCall: null };
          const qs = new URLSearchParams({
            phoneNumberId: conv.phoneNumberId,
            maxResults: '1',
          });
          qs.append('participants', participant);
          const callData = await opFetch(`/calls?${qs}`, cfg.openPhoneApiKey!);
          return { ...conv, lastCall: (callData.data || [])[0] || null };
        } catch {
          return { ...conv, lastCall: null };
        }
      })
    );

    // Sort by most recent activity
    conversationsWithCalls.sort(
      (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    );

    return NextResponse.json({ data: conversationsWithCalls, phoneNumbers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
