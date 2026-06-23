'use client';
import useSWR from 'swr';
import ErrorBanner from '@/components/ErrorBanner';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const fmtDT = (s: string) => s ? new Date(s).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) : '—';

export default function Requests() {
  const { data, mutate } = useSWR('/api/wix/forms', fetcher, { revalidateOnFocus: false });
  const subs: any[] = data?.submissions || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="mb-0">Delivery Requests</h1>
        <button className="btn btn-primary btn-sm" onClick={() => mutate()}>Refresh</button>
      </div>
      {data?.error && <ErrorBanner message={data.error} />}
      {!subs.length && !data?.error && <div className="text-zinc-500 text-center py-16">No form submissions found.</div>}
      {subs.map((s: any, i: number) => {
        const fields = s.submissions || {};
        const keys = Object.keys(fields);
        return (
          <div key={s.id || i} className="card mb-4">
            <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
              <div>
                <div className="font-bold text-[15px]">Delivery Request</div>
                <div className="text-[12px] text-zinc-500">{fmtDT(s.submittedAt || s.createdDate)}</div>
              </div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300">
                {s.status || 'submitted'}
              </span>
            </div>
            {keys.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {keys.map(k => (
                  <div key={k} className="bg-[#20243a] rounded-lg px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">{k}</div>
                    <div className="text-[13px] break-words">
                      {Array.isArray(fields[k]) ? fields[k].join(', ') : String(fields[k] ?? '')}
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="text-zinc-500 text-[13px]">No field data available</div>}
          </div>
        );
      })}
    </div>
  );
}
