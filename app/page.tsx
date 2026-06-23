'use client';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const fmtDT = (s: string) => s ? new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
const fmtDur = (sec: number) => { if (!sec) return ''; const m = Math.floor(sec / 60), s = sec % 60; return m ? `${m}m ${s}s` : `${s}s`; };

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[13px] font-bold uppercase tracking-widest text-zinc-400 mb-0">{title}</h2>
      <Link href={href} className="text-[12px] text-blue-400 hover:text-blue-300">View all →</Link>
    </div>
  );
}

function RecentCalls() {
  const { data } = useSWR('/api/quo/calls', fetcher, { revalidateOnFocus: false });
  const calls: any[] = (data?.data || []).slice(0, 6);
  return (
    <div className="card">
      <SectionHeader title="Recent Calls" href="/calls" />
      {!calls.length && <div className="text-zinc-600 text-[13px] py-4 text-center">No calls yet</div>}
      <div className="space-y-1.5">
        {calls.map((c: any, i: number) => {
          const raw = (c.direction || '').toLowerCase();
          const isIn = raw === 'incoming' || raw === 'inbound';
          const missed = (c.status || '').toLowerCase() === 'missed';
          const num = c.from || c.to || (c.participants || [])[0] || '—';
          return (
            <div key={c.id || i} className="flex items-center justify-between py-1.5 border-b border-[#1e2133] last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[11px] font-bold w-16 shrink-0 ${missed ? 'text-red-400' : isIn ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {missed ? '✗ Missed' : isIn ? '↙ In' : '↗ Out'}
                </span>
                <span className="font-mono text-[13px] truncate">{num}</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-zinc-500 shrink-0 ml-2">
                {c.duration ? <span>{fmtDur(c.duration)}</span> : null}
                <span>{fmtDT(c.createdAt || c.startedAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentMessages() {
  const { data } = useSWR('/api/quo/messages', fetcher, { revalidateOnFocus: false });
  const msgs: any[] = (data?.data || []).slice(0, 6);
  return (
    <div className="card">
      <SectionHeader title="Recent Messages" href="/messages" />
      {!msgs.length && <div className="text-zinc-600 text-[13px] py-4 text-center">No messages yet</div>}
      <div className="space-y-1.5">
        {msgs.map((m: any, i: number) => {
          const raw = (m.direction || '').toLowerCase();
          const isIn = raw === 'incoming' || raw === 'inbound';
          const contact = isIn ? (m.from || '—') : (m.to || '—');
          const body = m.text || m.body || '';
          return (
            <div key={m.id || i} className="flex items-start justify-between py-1.5 border-b border-[#1e2133] last:border-0 gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <span className={`text-[11px] font-bold w-12 shrink-0 mt-0.5 ${isIn ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {isIn ? '↙ In' : '↗ Out'}
                </span>
                <div className="min-w-0">
                  <div className="font-mono text-[12px] text-zinc-300">{contact}</div>
                  <div className="text-[12px] text-zinc-500 truncate max-w-[220px]">{body || 'No text'}</div>
                </div>
              </div>
              <span className="text-[11px] text-zinc-600 shrink-0">{fmtDT(m.createdAt)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TanksMini() {
  const { data } = useSWR('/api/tuya/devices', fetcher, { revalidateOnFocus: false });
  const devices: any[] = data?.devices || [];
  const LEVEL_KEYS = ['percent_state', 'water_level_percent', 'level', 'battery_percentage', 'water_percent'];
  function lvl(status: any[]) {
    if (!Array.isArray(status)) return null;
    for (const k of LEVEL_KEYS) { const dp = status.find(d => d.code === k); if (dp && typeof dp.value === 'number') return dp.value; }
    const n = status.find(d => typeof d.value === 'number' && d.value >= 0 && d.value <= 100);
    return n ? n.value : null;
  }
  return (
    <div className="card">
      <SectionHeader title="Tank Levels" href="/tanks" />
      {!devices.length && <div className="text-zinc-600 text-[13px] py-4 text-center">No tanks configured</div>}
      <div className="grid grid-cols-2 gap-3">
        {devices.map((d: any) => {
          const pct = lvl(d.status);
          const low = pct != null && pct <= 20;
          const barColor = low ? 'bg-red-500' : pct != null && pct < 40 ? 'bg-amber-400' : 'bg-blue-400';
          return (
            <div key={d.id} className="bg-[#20243a] rounded-lg px-3 py-2.5">
              <div className="text-[12px] font-semibold truncate mb-1.5">{d.name || d.id}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 bg-[#0f1117] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: pct != null ? `${pct}%` : '0%' }} />
                </div>
                <span className={`text-[12px] font-bold w-10 text-right ${low ? 'text-red-400' : 'text-[#e2e4f0]'}`}>
                  {pct != null ? `${Math.round(pct)}%` : 'N/A'}
                </span>
              </div>
              <span className={`text-[11px] ${d.online !== false ? 'text-emerald-500' : 'text-red-500'}`}>
                ● {d.online !== false ? 'Online' : 'Offline'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentBookings() {
  const { data } = useSWR('/api/wix/bookings', fetcher, { revalidateOnFocus: false });
  const bookings: any[] = (data?.bookings || []).slice(0, 6);
  const statusColor: Record<string, string> = {
    CONFIRMED: 'text-emerald-400',
    PENDING: 'text-amber-400',
    CANCELED: 'text-red-400',
    WAITING_LIST: 'text-blue-400',
  };
  return (
    <div className="card">
      <SectionHeader title="Recent Bookings" href="/bookings" />
      {data?.error && <div className="text-red-400 text-[12px] mb-2">{data.error}</div>}
      {!bookings.length && !data?.error && <div className="text-zinc-600 text-[13px] py-4 text-center">No bookings found</div>}
      <div className="space-y-1.5">
        {bookings.map((b: any, i: number) => {
          const cd = b.contactDetails || {};
          const name = [cd.firstName, cd.lastName].filter(Boolean).join(' ') || '—';
          const start = b.startDate || b.slot?.startDate || '';
          const st = b.status || '';
          return (
            <div key={b.id || i} className="flex items-center justify-between py-1.5 border-b border-[#1e2133] last:border-0 gap-2">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate">{name}</div>
                <div className="text-[11px] text-zinc-500">{b.serviceName || '—'}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] text-zinc-400">{fmtDT(start)}</div>
                <div className={`text-[11px] font-semibold ${statusColor[st] || 'text-zinc-400'}`}>{st || '—'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentRequests() {
  const { data } = useSWR('/api/wix/forms', fetcher, { revalidateOnFocus: false });
  const subs: any[] = (data?.submissions || []).slice(0, 5);
  return (
    <div className="card">
      <SectionHeader title="Delivery Requests" href="/requests" />
      {data?.error && <div className="text-red-400 text-[12px] mb-2">{data.error}</div>}
      {!subs.length && !data?.error && <div className="text-zinc-600 text-[13px] py-4 text-center">No requests found</div>}
      <div className="space-y-1.5">
        {subs.map((s: any, i: number) => {
          const fields = s.submissions || {};
          const name = s.submitter?.name || fields.name || fields.Name || fields.firstName || '—';
          const phone = s.submitter?.phone || fields.phone || fields.Phone || '';
          const address = fields.address || fields.Address || fields.deliveryAddress || '';
          return (
            <div key={s.id || i} className="py-1.5 border-b border-[#1e2133] last:border-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{name}</div>
                  <div className="text-[12px] text-zinc-500 truncate">{address || phone || 'No details'}</div>
                </div>
                <span className="text-[11px] text-zinc-600 shrink-0">{fmtDT(s.submittedAt || s.createdDate)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div>
      <h1 className="mb-5">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentCalls />
        <RecentMessages />
        <TanksMini />
        <RecentBookings />
        <div className="lg:col-span-2">
          <RecentRequests />
        </div>
      </div>
    </div>
  );
}
