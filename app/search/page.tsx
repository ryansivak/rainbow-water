'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const CHIPS = ['water','delivery','pool','fill','price','cost','gallons','address','schedule','appointment','available','missed','call me','need water','quote','cistern'];

function fmtDT(s: string) {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
}

function SearchInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(sp.get('q') || '');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function doSearch(term: string) {
    if (!term.trim()) return;
    setLoading(true);
    const data = await fetch(`/api/search?q=${encodeURIComponent(term)}`).then(r => r.json());
    setResults(data);
    setLoading(false);
    router.replace(`/search?q=${encodeURIComponent(term)}`, { scroll: false });
  }

  useEffect(() => { if (sp.get('q')) doSearch(sp.get('q')!); }, []);

  return (
    <div>
      <h1>Search</h1>
      <div className="flex gap-2 mb-4">
        <input type="text" value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch(q)}
          placeholder="Search messages, contacts, addresses, transcripts…" className="!w-96" />
        <button className="btn btn-primary" onClick={() => doSearch(q)}>Search</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {CHIPS.map(c => (
          <button key={c} className="px-3 py-1 rounded-full border border-[#2a2d3e] bg-[#1a1d27] text-[12px] text-zinc-400 hover:border-blue-500 hover:text-blue-400 cursor-pointer"
            onClick={() => { setQ(c); doSearch(c); }}>
            {c}
          </button>
        ))}
      </div>
      {loading && <div className="text-zinc-500 text-center py-16">Searching…</div>}
      {results && !loading && (
        <>
          {results.contacts?.length > 0 && (
            <div className="mb-7">
              <h2>Contacts ({results.contacts.length})</h2>
              <div className="table-wrap">
                <table className="w-full border-collapse">
                  <thead><tr>
                    {['Phone','Name','Address','Texts','Last Contact'].map(h => (
                      <th key={h} className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500 bg-[#20243a]">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {results.contacts.map((r: any) => (
                      <tr key={r.normalized_phone} className="border-t border-[#1e2133] hover:bg-[#1e2133]">
                        <td className="px-3.5 py-2"><Link href={`/contacts/${encodeURIComponent(r.normalized_phone)}`} className="text-blue-400 hover:underline font-mono text-[13px]">{r.phone}</Link></td>
                        <td className="px-3.5 py-2 text-[13px]">{r.name}</td>
                        <td className="px-3.5 py-2 text-[13px]">{r.address}</td>
                        <td className="px-3.5 py-2 text-[13px]">{r.text_count}</td>
                        <td className="px-3.5 py-2 text-[13px]">{r.last_contact ? new Date(r.last_contact).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {results.messages?.length > 0 && (
            <div className="mb-7">
              <h2>Messages ({results.messages.length})</h2>
              {results.messages.map((m: any, i: number) => (
                <div key={i} className={`bg-[#1a1d27] border border-[#2a2d3e] border-l-4 ${m.direction==='inbound'?'border-l-blue-500':'border-l-emerald-500'} rounded-lg px-3.5 py-2.5 text-[13px] mb-2`}>
                  <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                    <Link href={`/contacts/${encodeURIComponent(m.normalized_phone)}`} className="text-blue-400 hover:underline">{m.name || m.phone}</Link>
                    <span>{fmtDT(m.datetime)}</span>
                  </div>
                  <div className="break-words">{m.body}</div>
                </div>
              ))}
            </div>
          )}
          {results.voicemails?.length > 0 && (
            <div className="mb-7">
              <h2>Voicemails ({results.voicemails.length})</h2>
              {results.voicemails.map((v: any, i: number) => (
                <div key={i} className="bg-[#1c1a10] border border-[#2a2d3e] border-l-4 border-l-amber-400 rounded-lg px-3.5 py-2.5 text-[13px] mb-2">
                  <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                    <Link href={`/contacts/${encodeURIComponent(v.normalized_phone)}`} className="text-blue-400 hover:underline">{v.name || v.phone}</Link>
                    <span>{fmtDT(v.datetime)}</span>
                  </div>
                  <div className="break-words">{v.transcript}</div>
                </div>
              ))}
            </div>
          )}
          {!results.contacts?.length && !results.messages?.length && !results.voicemails?.length && (
            <div className="text-zinc-500 text-center py-16">No results found.</div>
          )}
        </>
      )}
    </div>
  );
}

export default function Search() {
  return <Suspense><SearchInner /></Suspense>;
}
