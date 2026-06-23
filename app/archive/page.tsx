'use client';
import { useState, useCallback } from 'react';
import useSWR from 'swr';
import ErrorBanner from '@/components/ErrorBanner';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const fmtDT = (s: string) => s ? new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

export default function Archive() {
  const [search, setSearch] = useState('');
  const [dirFilter, setDirFilter] = useState('');
  const [query, setQuery] = useState('');

  const { data, isLoading } = useSWR(
    `/api/quo/messages?maxResults=200`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleSearch = useCallback(() => setQuery(search), [search]);

  let msgs: any[] = data?.data || [];

  if (dirFilter) msgs = msgs.filter(m => {
    const d = (m.direction || '').toLowerCase();
    if (dirFilter === 'inbound') return d === 'incoming' || d === 'inbound';
    if (dirFilter === 'outbound') return d === 'outgoing' || d === 'outbound';
    return true;
  });

  if (query.trim()) {
    const q = query.toLowerCase();
    msgs = msgs.filter(m =>
      (m.text || m.body || '').toLowerCase().includes(q) ||
      (m.from || '').includes(q) ||
      (m.to || '').includes(q) ||
      (m.participants || []).some((p: string) => p.includes(q))
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="mb-0">Message Archive</h1>
        <div className="text-[12px] text-zinc-500">{msgs.length} messages</div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        <input
          className="flex-1 min-w-[200px]"
          placeholder="Search by phone number, message content…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn btn-primary btn-sm" onClick={handleSearch}>Search</button>
        <select value={dirFilter} onChange={e => setDirFilter(e.target.value)} className="!w-auto">
          <option value="">All Directions</option>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>
        {(query || dirFilter) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setQuery(''); setDirFilter(''); }}>
            Clear
          </button>
        )}
      </div>

      {data?.error && <ErrorBanner message={data.error} />}
      {isLoading && <div className="text-zinc-500 text-center py-16">Loading messages…</div>}

      {!isLoading && !data?.error && msgs.length === 0 && (
        <div className="text-zinc-500 text-center py-16">
          {query ? `No messages matching "${query}"` : 'No messages found.'}
        </div>
      )}

      <div className="space-y-2">
        {msgs.map((m: any, i: number) => {
          const raw = (m.direction || '').toLowerCase();
          const isIn = raw === 'incoming' || raw === 'inbound';
          const contact = isIn ? (m.from || '—') : (m.to || '—');
          const body = m.text || m.body || '';
          const highlight = query.trim()
            ? body.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                '<mark class="bg-yellow-400/30 text-yellow-200 rounded px-0.5">$1</mark>')
            : body;

          return (
            <div key={m.id || i} className="bg-[#1a1d27] border border-[#2a2d3e] border-l-4 rounded-lg px-4 py-3"
              style={{ borderLeftColor: isIn ? '#3b82f6' : '#10b981' }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="shrink-0">
                    <div className={`text-[11px] font-bold uppercase tracking-wide ${isIn ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {isIn ? '↙ Inbound' : '↗ Outbound'}
                    </div>
                    <div className="font-mono text-[13px] font-semibold">{contact}</div>
                  </div>
                  {body ? (
                    <div
                      className="text-[13px] text-zinc-200 mt-0.5 leading-relaxed break-words min-w-0"
                      dangerouslySetInnerHTML={{ __html: highlight }}
                    />
                  ) : (
                    <div className="text-[13px] text-zinc-500 italic mt-0.5">No text content</div>
                  )}
                </div>
                <span className="text-[12px] text-zinc-400 shrink-0">{fmtDT(m.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
