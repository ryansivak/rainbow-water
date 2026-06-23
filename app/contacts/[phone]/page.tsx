'use client';
import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Badge from '@/components/Badge';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function fmtDT(s: string) {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function fmtDur(sec: number) {
  if (!sec) return '';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
}

export default function ContactDetail({ params }: { params: { phone: string } }) {
  const norm = decodeURIComponent(params.phone);
  const { data, mutate } = useSWR(`/api/contacts/${encodeURIComponent(norm)}`, fetcher);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const c = data?.contact;
  const editForm = form ?? (c ? { name: c.name||'', address: c.address||'', tags: c.tags||'', lead_status: c.lead_status||'none', notes: c.notes||'' } : {});

  async function save() {
    setSaving(true);
    await fetch(`/api/contacts/${encodeURIComponent(norm)}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(editForm) });
    setSaving(false);
    mutate();
  }

  async function approveAddr(id: number, approved: boolean) {
    await fetch(`/api/addresses/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ approved }) });
    mutate();
  }

  const timeline = [
    ...(data?.messages  || []).map((m: any) => ({ dt: m.datetime, type: 'message',  data: m })),
    ...(data?.calls     || []).map((c: any) => ({ dt: c.datetime, type: 'call',     data: c })),
    ...(data?.voicemails|| []).map((v: any) => ({ dt: v.datetime, type: 'voicemail',data: v })),
  ].sort((a, b) => a.dt?.localeCompare(b.dt));

  const leftBorder: Record<string, string> = {
    inbound: 'border-l-blue-500', outbound: 'border-l-emerald-500',
    'call-missed': 'border-l-red-500', 'call-answered': 'border-l-indigo-400',
    'call-outgoing': 'border-l-cyan-500', voicemail: 'border-l-amber-400',
  };

  return (
    <div>
      <div className="mb-4"><Link href="/contacts" className="btn btn-secondary btn-sm">← Back to Contacts</Link></div>
      {c && (
        <>
          <div className="card mb-5">
            <div className="text-xl font-bold">{c.name || c.phone || norm}</div>
            <div className="font-mono text-sm text-zinc-400 mt-0.5">{c.normalized_phone}</div>
            <div className="flex gap-5 mt-3 flex-wrap text-[13px] text-zinc-400">
              <span><strong className="text-white">{c.text_count}</strong> texts</span>
              <span><strong className="text-white">{c.call_count}</strong> calls</span>
              <span><strong className="text-white">{c.voicemail_count}</strong> voicemails</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
            {/* Timeline */}
            <div>
              <h2>Timeline</h2>
              <div className="flex flex-col gap-1.5">
                {timeline.map((item, i) => {
                  let cls = '', typeLabel = '';
                  if (item.type === 'message') {
                    cls = item.data.direction === 'inbound' ? leftBorder.inbound : leftBorder.outbound;
                    typeLabel = item.data.direction === 'inbound' ? '↙ Text In' : '↗ Text Out';
                  } else if (item.type === 'call') {
                    cls = leftBorder[`call-${item.data.call_type}`] || 'border-l-zinc-500';
                    typeLabel = item.data.call_type === 'missed' ? '✗ Missed Call' : item.data.call_type === 'answered' ? '↙ Call In' : '↗ Call Out';
                  } else {
                    cls = leftBorder.voicemail;
                    typeLabel = '📞 Voicemail';
                  }
                  return (
                    <div key={i} className={`bg-[#1a1d27] border border-[#2a2d3e] border-l-4 ${cls} rounded-lg px-3.5 py-2.5 text-[13px]`}>
                      <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                        <span className="font-semibold uppercase tracking-wide">{typeLabel}</span>
                        <span>{fmtDT(item.dt)}</span>
                      </div>
                      {item.type === 'message'   && <div className="break-words">{item.data.body}</div>}
                      {item.type === 'call'      && item.data.duration ? <div className="text-zinc-400 text-[12px]">{fmtDur(item.data.duration)}</div> : null}
                      {item.type === 'voicemail' && <div className="break-words">{item.data.transcript || <em className="text-zinc-500">No transcript</em>}</div>}
                    </div>
                  );
                })}
                {!timeline.length && <div className="text-zinc-500 text-center py-8">No records.</div>}
              </div>
            </div>

            {/* Sidebar */}
            <div className="card">
              <h2 className="text-[12px] font-bold uppercase tracking-wide text-zinc-500">Contact Info</h2>
              {(['name','address','tags'] as const).map(field => (
                <div key={field}>
                  <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <input type="text" value={editForm[field] || ''} onChange={e => setForm({ ...editForm, [field]: e.target.value })} />
                </div>
              ))}
              <label>Status</label>
              <select value={editForm.lead_status || 'none'} onChange={e => setForm({ ...editForm, lead_status: e.target.value })}>
                {['none','lead','customer','inactive'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <label>Notes</label>
              <textarea rows={3} value={editForm.notes || ''} onChange={e => setForm({ ...editForm, notes: e.target.value })} />
              <button className="btn btn-primary btn-sm mt-3" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>

              {(data?.addresses || []).length > 0 && (
                <div className="mt-5 pt-4 border-t border-[#2a2d3e]">
                  <h2 className="text-[12px] font-bold uppercase tracking-wide text-zinc-500 mb-3">Detected Addresses</h2>
                  {data.addresses.map((a: any) => (
                    <div key={a.id} className="bg-[#20243a] rounded-lg p-2.5 mb-2 text-[13px]">
                      <div className="font-semibold">{a.address_candidate}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">Confidence: {a.confidence}%</div>
                      <div className="flex gap-2 mt-2">
                        {a.approved === 1 ? <span className="text-emerald-400 text-[12px]">✓ Approved</span>
                         : a.approved === 0 ? <span className="text-red-400 text-[12px]">✗ Rejected</span>
                         : <>
                             <button className="btn btn-success btn-xs" onClick={() => approveAddr(a.id, true)}>Approve</button>
                             <button className="btn btn-sm btn-xs bg-red-950 text-red-300 hover:bg-red-900" onClick={() => approveAddr(a.id, false)}>Reject</button>
                           </>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
