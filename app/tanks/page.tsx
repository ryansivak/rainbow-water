'use client';
import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import ErrorBanner from '@/components/ErrorBanner';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const LEVEL_KEYS = ['percent_state','water_level_percent','level','battery_percentage','va_humidity','residual_electricity','water_percent'];

function levelFrom(status: any[]): number | null {
  if (!Array.isArray(status)) return null;
  for (const k of LEVEL_KEYS) {
    const dp = status.find(d => d.code === k);
    if (dp != null && typeof dp.value === 'number') return dp.value;
  }
  const num = status.find(d => typeof d.value === 'number' && d.value >= 0 && d.value <= 100);
  return num ? num.value : null;
}

function TankCard({ device, threshold }: { device: any; threshold?: number }) {
  const pct = levelFrom(device.status);
  const online = device.online !== false;
  const low = threshold != null && pct != null && pct <= threshold;
  const fillColor = low ? 'from-red-900 to-red-500' : pct != null && pct < 40 ? 'from-amber-900 to-amber-500' : 'from-blue-900 to-blue-400';

  return (
    <div className="card flex flex-col items-center gap-3 text-center">
      <div className="font-bold text-[15px]">{device.name || device.id}</div>
      <span className={`text-[11px] font-semibold ${online ? 'text-emerald-400' : 'text-red-400'}`}>● {online ? 'Online' : 'Offline'}</span>
      {pct != null ? (
        <div className="relative w-24 h-36 border-2 border-[#2a2d3e] rounded-lg bg-[#0f1117] overflow-hidden">
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${fillColor} transition-all duration-700`} style={{ height: `${pct}%` }} />
          <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-white drop-shadow-lg">{Math.round(pct)}%</div>
        </div>
      ) : <div className="text-zinc-500 text-[13px]">Level N/A</div>}
      {low && <div className="text-red-400 text-[12px] font-semibold">⚠ Below {threshold}% threshold</div>}
      <div className="w-full text-left">
        {(device.status || []).map((dp: any) => (
          <div key={dp.code} className="flex justify-between text-[12px] border-b border-[#1e2133] py-1 last:border-0">
            <span className="text-zinc-500 font-semibold uppercase text-[11px]">{dp.code}</span>
            <span className="font-mono text-[#e2e4f0]">{String(dp.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Tanks() {
  const { data, mutate } = useSWR('/api/tuya/devices', fetcher, { revalidateOnFocus: false });
  const [thresholds, setThresholds] = useState<Record<string,number>>({});
  const [saved, setSaved] = useState(false);
  const sseRef = useRef<EventSource | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    if (data?.thresholds) setThresholds(data.thresholds);
  }, [data?.thresholds]);

  useEffect(() => {
    if (sseRef.current) return;
    const es = new EventSource('/api/tuya/stream');
    sseRef.current = es;
    es.onmessage = e => {
      try {
        const payload = JSON.parse(e.data);
        mutate(payload, false);
        setLastUpdated(new Date().toLocaleTimeString());
        checkAlerts(payload.devices, payload.thresholds);
      } catch {}
    };
    es.onerror = () => { es.close(); sseRef.current = null; };
    return () => { es.close(); sseRef.current = null; };
  }, []);

  function checkAlerts(devices: any[], th: Record<string,number>) {
    if (Notification.permission !== 'granted') return;
    for (const d of devices) {
      const pct = levelFrom(d.status);
      const t = th[d.id];
      if (pct != null && t && pct <= t) {
        new Notification(`⚠ Tank Low: ${d.name || d.id}`, { body: `Level is ${Math.round(pct)}% — below ${t}% threshold.`, tag: 'tank-' + d.id });
      }
    }
  }

  async function requestNotifications() {
    await Notification.requestPermission();
  }

  async function saveThresholds() {
    await fetch('/api/tuya/thresholds', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(thresholds) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const devices: any[] = data?.devices || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="mb-0">Tank Levels</h1>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="text-[12px] text-zinc-500">Updated {lastUpdated}</span>}
          <button className="btn btn-secondary btn-sm" onClick={() => mutate()}>Refresh</button>
          <button className="btn btn-secondary btn-sm" onClick={requestNotifications}>Enable Notifications</button>
        </div>
      </div>
      {data?.error && <ErrorBanner message={data.error} />}
      {devices.length === 0 && !data?.error && (
        <div className="text-zinc-500 text-center py-16">No devices found. Configure Device IDs in Settings.</div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mb-8">
        {devices.map((d: any) => <TankCard key={d.id} device={d} threshold={thresholds[d.id]} />)}
      </div>
      {devices.length > 0 && (
        <div className="card max-w-md">
          <h2>Alert Thresholds</h2>
          <p className="text-[13px] text-zinc-500 mb-4">Get a browser notification when a tank drops below these levels.</p>
          {devices.map((d: any) => (
            <div key={d.id} className="flex items-center gap-3 mb-3">
              <span className="text-[13px] font-semibold w-44 truncate">{d.name || d.id}</span>
              <input type="number" min={0} max={100} value={thresholds[d.id] || ''} placeholder="e.g. 20"
                className="!w-20" onChange={e => setThresholds(t => ({ ...t, [d.id]: parseFloat(e.target.value) }))} />
              <span className="text-[12px] text-zinc-500">%</span>
            </div>
          ))}
          <div className="flex items-center gap-3 mt-3">
            <button className="btn btn-primary btn-sm" onClick={saveThresholds}>Save Thresholds</button>
            {saved && <span className="text-emerald-400 text-[13px]">Saved.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
