'use client';
import { useState } from 'react';
import useSWR from 'swr';
import ErrorBanner from '@/components/ErrorBanner';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const fmtDT = (s: string) => s ? new Date(s).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) : '—';
const fmtDur = (sec: number) => { if (!sec) return ''; const m=Math.floor(sec/60),s=sec%60; return m?`${m}m ${s}s`:`${s}s`; };

function CallCard({ call }: { call: any }) {
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const status = (call.status || '').toLowerCase();
  // Quo API uses 'incoming'/'outgoing', normalize to inbound/outbound
  const rawDir = (call.direction || '').toLowerCase();
  const isInbound = rawDir === 'incoming' || rawDir === 'inbound';
  const borderColor = status === 'missed' ? 'border-l-red-500' : status === 'voicemail' ? 'border-l-amber-400'
    : isInbound ? 'border-l-blue-500' : 'border-l-emerald-500';
  const dirLabel = status === 'missed' ? '✗ Missed' : status === 'voicemail' ? '📞 Voicemail'
    : isInbound ? '↙ Inbound' : '↗ Outbound';
  const dirColor = status === 'missed' ? 'text-red-400' : isInbound ? 'text-blue-400' : 'text-emerald-400';
  // Quo uses participants[] instead of from/to
  const participant = (call.participants || [])[0] || call.from || call.to || '—';
  const number = call.from || call.to || participant;

  async function toggleTranscript() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (!transcript && call.id) {
      setLoading(true);
      try {
        const data = await fetch(`/api/quo/calls/${encodeURIComponent(call.id)}/transcript`).then(r => r.json());
        setTranscript(data);
      } catch {}
      setLoading(false);
    }
  }

  const dialogue = transcript?.data?.dialogue || transcript?.dialogue || [];

  return (
    <div className={`bg-[#1a1d27] border border-[#2a2d3e] border-l-4 ${borderColor} rounded-lg px-4 py-3 mb-2.5`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-wide ${dirColor}`}>{dirLabel}</div>
            <div className="font-mono text-[14px] font-semibold">{number}</div>
            {call.contact?.name && <div className="text-[12px] text-zinc-400">{call.contact.name}</div>}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-zinc-400">
          {call.duration ? <span>{fmtDur(call.duration)}</span> : null}
          <span>{fmtDT(call.createdAt || call.startedAt)}</span>
          {call.id && (
            <button className="btn btn-secondary btn-xs" onClick={toggleTranscript}>
              {open ? 'Hide' : 'Transcript'}
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="mt-3 bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2.5 text-[13px] leading-7">
          {loading && <span className="text-zinc-500 italic">Loading transcript…</span>}
          {!loading && !dialogue.length && <span className="text-zinc-500 italic">No transcript available.</span>}
          {dialogue.map((d: any, i: number) => (
            <div key={i} className="mb-1">
              <span className="font-semibold text-blue-400 mr-2">{d.identifier || d.speaker || 'Speaker'}:</span>
              <span>{d.content || d.text || ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Calls() {
  const [dirFilter, setDirFilter]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data, mutate } = useSWR('/api/quo/calls', fetcher, { revalidateOnFocus: false });

  let calls: any[] = data?.data || [];
  if (dirFilter) calls = calls.filter(c => {
    const d = (c.direction || '').toLowerCase();
    if (dirFilter === 'inbound') return d === 'incoming' || d === 'inbound';
    if (dirFilter === 'outbound') return d === 'outgoing' || d === 'outbound';
    return true;
  });
  if (statusFilter) calls = calls.filter(c => (c.status||'').toLowerCase() === statusFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="mb-0">Quo Calls</h1>
        <div className="flex gap-2">
          <select value={dirFilter} onChange={e => setDirFilter(e.target.value)} className="!w-auto">
            <option value="">All Directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="!w-auto">
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
            <option value="voicemail">Voicemail</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => mutate()}>Refresh</button>
        </div>
      </div>
      {data?.error && <ErrorBanner message={data.error} />}
      {!calls.length && !data?.error && <div className="text-zinc-500 text-center py-16">No calls found.</div>}
      {calls.map((c: any, i: number) => <CallCard key={c.id || i} call={c} />)}
    </div>
  );
}
