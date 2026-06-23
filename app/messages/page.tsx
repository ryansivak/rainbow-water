'use client';
import { useState } from 'react';
import useSWR from 'swr';
import ErrorBanner from '@/components/ErrorBanner';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const fmtDT = (s: string) => s ? new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

function MessageCard({ msg }: { msg: any }) {
  const dir = (msg.direction || '').toLowerCase();
  const isInbound = dir === 'incoming' || dir === 'inbound';
  const borderColor = isInbound ? 'border-l-blue-500' : 'border-l-emerald-500';
  const dirLabel = isInbound ? '↙ Inbound' : '↗ Outbound';
  const dirColor = isInbound ? 'text-blue-400' : 'text-emerald-400';
  const contact = isInbound ? (msg.from || '—') : (msg.to || '—');

  return (
    <div className={`bg-[#1a1d27] border border-[#2a2d3e] border-l-4 ${borderColor} rounded-lg px-4 py-3 mb-2.5`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0">
            <div className={`text-[11px] font-bold uppercase tracking-wide ${dirColor}`}>{dirLabel}</div>
            <div className="font-mono text-[14px] font-semibold">{contact}</div>
          </div>
          {msg.text || msg.body ? (
            <div className="text-[13px] text-zinc-200 mt-0.5 leading-relaxed break-words min-w-0">
              {msg.text || msg.body}
            </div>
          ) : (
            <div className="text-[13px] text-zinc-500 italic mt-0.5">No text content</div>
          )}
        </div>
        <div className="text-[12px] text-zinc-400 shrink-0">{fmtDT(msg.createdAt)}</div>
      </div>
    </div>
  );
}

export default function Messages() {
  const [dirFilter, setDirFilter] = useState('');
  const { data, mutate } = useSWR('/api/quo/messages', fetcher, { revalidateOnFocus: false });

  let msgs: any[] = data?.data || [];
  if (dirFilter) msgs = msgs.filter(m => {
    const d = (m.direction || '').toLowerCase();
    if (dirFilter === 'inbound') return d === 'incoming' || d === 'inbound';
    if (dirFilter === 'outbound') return d === 'outgoing' || d === 'outbound';
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="mb-0">Quo Messages</h1>
        <div className="flex gap-2">
          <select value={dirFilter} onChange={e => setDirFilter(e.target.value)} className="!w-auto">
            <option value="">All Directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => mutate()}>Refresh</button>
        </div>
      </div>
      {data?.error && <ErrorBanner message={data.error} />}
      {!msgs.length && !data?.error && (
        <div className="text-zinc-500 text-center py-16">No messages found.</div>
      )}
      {msgs.map((m: any, i: number) => <MessageCard key={m.id || i} msg={m} />)}
    </div>
  );
}
