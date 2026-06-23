'use client';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';

export default function TopCustomers() {
  const { data: rows = [] } = useSWR('/api/top-customers', fetcher);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="mb-0">Top Customers</h1>
        <a href="/api/export/top-customers" className="btn btn-secondary btn-sm">Export CSV</a>
      </div>
      <div className="table-wrap">
        <table className="w-full border-collapse">
          <thead><tr>
            {['#','Phone','Name','Address','Texts','Calls','VMs','Last Contact',''].map(h => (
              <th key={h} className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500 bg-[#20243a] whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={r.normalized_phone} className="border-t border-[#1e2133] hover:bg-[#1e2133]">
                <td className="px-3.5 py-2 text-zinc-500 font-bold w-8">{i + 1}</td>
                <td className="px-3.5 py-2"><Link href={`/contacts/${encodeURIComponent(r.normalized_phone)}`} className="text-blue-400 hover:underline font-mono text-[13px]">{r.phone}</Link></td>
                <td className="px-3.5 py-2 text-[13px]">{r.name || ''}</td>
                <td className="px-3.5 py-2 text-[13px] max-w-[180px] truncate">{r.address || ''}</td>
                <td className="px-3.5 py-2 text-[13px]">{r.text_count}</td>
                <td className="px-3.5 py-2 text-[13px]">{r.call_count}</td>
                <td className="px-3.5 py-2 text-[13px]">{r.voicemail_count}</td>
                <td className="px-3.5 py-2 text-[13px] whitespace-nowrap">{fmtDate(r.last_contact)}</td>
                <td className="px-3.5 py-2"><Link href={`/contacts/${encodeURIComponent(r.normalized_phone)}`} className="btn btn-secondary btn-xs">Timeline</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
