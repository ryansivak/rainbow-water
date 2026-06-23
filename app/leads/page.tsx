'use client';
import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Badge from '@/components/Badge';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';

export default function Leads() {
  const [filter, setFilter] = useState('all');
  const url = filter === 'all' ? '/api/leads' : `/api/leads?status=${filter}`;
  const { data: rows = [], mutate } = useSWR(url, fetcher);

  async function update(id: number, body: object) {
    await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    mutate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="mb-0">Missed Leads</h1>
        <div className="flex gap-2 items-center">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="!w-auto">
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <a href="/api/export/leads" className="btn btn-secondary btn-sm">Export CSV</a>
        </div>
      </div>
      {!rows.length && <div className="text-zinc-500 text-center py-16">No leads found.</div>}
      {rows.map((r: any) => (
        <div key={r.id} className="card mb-4">
          <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
            <div>
              <div className="font-bold text-[15px]">{r.name || r.contact_name || r.phone}</div>
              <div className="font-mono text-[12px] text-zinc-500">{r.phone}</div>
              {r.address && <div className="text-[13px] mt-1">📍 {r.address}</div>}
            </div>
            <div className="flex items-center gap-2">
              <Badge value={r.follow_up_status} />
              <span className="text-[12px] text-zinc-500">Confidence: {r.confidence}%</span>
            </div>
          </div>
          <div className="bg-[#20243a] rounded-lg px-3 py-2 text-[13px] mb-3">
            <strong>Why flagged:</strong> {r.reason_flagged}
          </div>
          <div className="text-[12px] text-zinc-500 mb-3">
            Last contact: {fmtDate(r.last_contact)} · Texts: {r.text_count} · Calls: {r.call_count}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <select value={r.follow_up_status} className="!w-auto text-[12px]"
              onChange={e => update(r.id, { follow_up_status: e.target.value })}>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <Link href={`/contacts/${encodeURIComponent(r.phone)}`} className="btn btn-secondary btn-sm">Review Timeline</Link>
            <button className="btn btn-success btn-sm" onClick={() => update(r.id, { follow_up_status: 'done' })}>Mark Done</button>
          </div>
          <NotesField id={r.id} initial={r.notes} onSave={mutate} />
        </div>
      ))}
    </div>
  );
}

function NotesField({ id, initial, onSave }: { id: number; initial: string; onSave: () => void }) {
  const [notes, setNotes] = useState(initial || '');
  async function save() {
    await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ notes }) });
    onSave();
  }
  return (
    <div className="mt-3">
      <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes…" className="mb-2" />
      <button className="btn btn-secondary btn-xs" onClick={save}>Save Note</button>
    </div>
  );
}
