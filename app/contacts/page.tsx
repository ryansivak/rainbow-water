'use client';
import { useState, useCallback } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Badge from '@/components/Badge';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const PAGE = 100;

function fmtDate(s: string) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Contacts() {
  const [q, setQ]           = useState('');
  const [sort, setSort]     = useState('last_contact');
  const [dir, setDir]       = useState<'asc'|'desc'>('desc');
  const [offset, setOffset] = useState(0);

  const url = `/api/contacts?q=${encodeURIComponent(q)}&sort=${sort}&dir=${dir}&limit=${PAGE}&offset=${offset}`;
  const { data } = useSWR(url, fetcher);

  const toggleSort = (col: string) => {
    if (sort === col) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setDir('desc'); }
    setOffset(0);
  };

  const th = (col: string, label: string) => (
    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500 bg-[#20243a] cursor-pointer hover:text-zinc-300 whitespace-nowrap select-none"
        onClick={() => toggleSort(col)}>
      {label}{sort === col ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  );

  const pages = Math.ceil((data?.total || 0) / PAGE);
  const page  = Math.floor(offset / PAGE) + 1;

  return (
    <div>
      <h1>Contacts</h1>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input type="text" placeholder="Search name, phone, address…" value={q}
          onChange={e => { setQ(e.target.value); setOffset(0); }}
          className="!w-72" />
        {['contacts','with-address','no-address','top-customers'].map(t => (
          <a key={t} href={`/api/export/${t}`} className="btn btn-secondary btn-sm">
            Export {t.replace(/-/g,' ')}
          </a>
        ))}
      </div>
      <div className="table-wrap">
        <table className="w-full border-collapse">
          <thead><tr>
            {th('phone','Phone')} {th('name','Name')} {th('address','Address')}
            {th('text_count','Texts')} {th('call_count','Calls')} {th('voicemail_count','VMs')}
            {th('last_contact','Last Contact')} <th className="px-3.5 py-2.5 bg-[#20243a] text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Status</th>
          </tr></thead>
          <tbody>
            {(data?.rows || []).map((r: any) => (
              <tr key={r.normalized_phone} className="border-t border-[#1e2133] hover:bg-[#1e2133] transition-colors">
                <td className="px-3.5 py-2">
                  <Link href={`/contacts/${encodeURIComponent(r.normalized_phone)}`}
                    className="text-blue-400 hover:underline font-mono text-[13px]">
                    {r.phone || r.normalized_phone}
                  </Link>
                </td>
                <td className="px-3.5 py-2 text-[13px]">{r.name || ''}</td>
                <td className="px-3.5 py-2 text-[13px] max-w-[200px] truncate">{r.address || ''}</td>
                <td className="px-3.5 py-2 text-[13px]">{r.text_count}</td>
                <td className="px-3.5 py-2 text-[13px]">{r.call_count}</td>
                <td className="px-3.5 py-2 text-[13px]">{r.voicemail_count}</td>
                <td className="px-3.5 py-2 text-[13px] whitespace-nowrap">{fmtDate(r.last_contact)}</td>
                <td className="px-3.5 py-2"><Badge value={r.lead_status || 'none'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 mt-3 text-[13px] text-zinc-400">
        <span>{(data?.total || 0).toLocaleString()} contacts</span>
        <button className="btn btn-secondary btn-sm" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - PAGE))}>← Prev</button>
        <span>Page {page} of {pages || 1}</span>
        <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => setOffset(o => o + PAGE)}>Next →</button>
      </div>
    </div>
  );
}
