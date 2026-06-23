'use client';
import { useState } from 'react';
import useSWR from 'swr';
import Badge from '@/components/Badge';
import ErrorBanner from '@/components/ErrorBanner';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const fmtDT = (s: string) => s ? new Date(s).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) : '—';

export default function Bookings() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, mutate } = useSWR('/api/wix/bookings', fetcher, { revalidateOnFocus: false });

  const bookings = (data?.bookings || []).filter((b: any) => !statusFilter || b.status === statusFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="mb-0">Wix Bookings</h1>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="!w-auto">
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELED">Canceled</option>
            <option value="WAITING_LIST">Waiting List</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => mutate()}>Refresh</button>
        </div>
      </div>
      {data?.error && <ErrorBanner message={data.error} />}
      {!data?.error && (
        <div className="table-wrap">
          <table className="w-full border-collapse">
            <thead><tr>
              {['Date/Time','Customer','Phone','Email','Service','Status','Payment'].map(h => (
                <th key={h} className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500 bg-[#20243a] whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {bookings.map((b: any, i: number) => {
                const cd = b.contactDetails || {};
                const name = [cd.firstName, cd.lastName].filter(Boolean).join(' ') || '—';
                const start = b.startDate || b.slot?.startDate || '';
                return (
                  <tr key={b.id || i} className="border-t border-[#1e2133] hover:bg-[#1e2133]">
                    <td className="px-3.5 py-2 text-[13px] whitespace-nowrap">{fmtDT(start)}</td>
                    <td className="px-3.5 py-2 text-[13px] font-medium">{name}</td>
                    <td className="px-3.5 py-2 font-mono text-[13px] text-blue-400">{cd.phone || '—'}</td>
                    <td className="px-3.5 py-2 text-[12px] text-zinc-400">{cd.email || '—'}</td>
                    <td className="px-3.5 py-2 text-[12px]">{b.serviceName || b.slot?.serviceId || '—'}</td>
                    <td className="px-3.5 py-2"><Badge value={b.status || ''} /></td>
                    <td className="px-3.5 py-2 text-[12px] text-zinc-400">{b.paymentStatus || '—'}</td>
                  </tr>
                );
              })}
              {!bookings.length && !data?.error && (
                <tr><td colSpan={7} className="text-center py-12 text-zinc-500">No bookings found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
