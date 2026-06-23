'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Settings() {
  const { data: cfg, mutate } = useSWR('/api/config', fetcher);
  const [form, setForm] = useState({ wixApiKey:'', wixSiteId:'', quoApiKey:'', tuyaClientId:'', tuyaSecret:'', tuyaRegion:'us', tuyaDeviceIds:'' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (cfg) setForm(f => ({ ...f, wixSiteId: cfg.wixSiteId||'', tuyaClientId: cfg.tuyaClientId||'', tuyaRegion: cfg.tuyaRegion||'us', tuyaDeviceIds: cfg.tuyaDeviceIds||'', quoWebhookUrl: cfg.quoWebhookUrl||'' }));
  }, [cfg]);

  async function save() {
    await fetch('/api/config', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) });
    setForm(f => ({ ...f, wixApiKey:'', quoApiKey:'', tuyaSecret:'' }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    mutate();
  }

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));
  const statusDot = (has: boolean) => <span className={`text-[12px] ${has ? 'text-emerald-400' : 'text-zinc-500'}`}>{has ? '● Key set' : '● Not set'}</span>;

  return (
    <div>
      <h1>Settings</h1>
      <div className="max-w-[560px] space-y-5">

        <div className="card">
          <h2>Wix API</h2>
          <p className="text-[12px] text-zinc-500 mb-3 leading-relaxed">
            Find your API key in Wix Dashboard → Dev Center → API Keys.<br />
            Site ID is in Dashboard → Settings → General Info.
          </p>
          <div className="flex items-center justify-between"><label>Wix API Key</label>{statusDot(cfg?.hasWixKey)}</div>
          <input type="password" value={form.wixApiKey} onChange={set('wixApiKey')} placeholder="Leave blank to keep existing key" />
          <label>Wix Site ID</label>
          <input type="text" value={form.wixSiteId} onChange={set('wixSiteId')} placeholder="e.g. a1b2c3d4-e5f6-…" />
        </div>

        <div className="card">
          <h2>Quo API</h2>
          <p className="text-[12px] text-zinc-500 mb-3 leading-relaxed">
            Find your API key in Quo → Settings → Integrations → API.
          </p>
          <div className="flex items-center justify-between"><label>Quo API Key</label>{statusDot(cfg?.hasQuoKey)}</div>
          <input type="password" value={form.quoApiKey} onChange={set('quoApiKey')} placeholder="Leave blank to keep existing key" />
        </div>

        <div className="card">
          <h2>Tuya IoT</h2>
          <p className="text-[12px] text-zinc-500 mb-3 leading-relaxed">
            Set up a project at iot.tuya.com, link your Smart Life account, then copy your Client ID and Secret. Device IDs are shown in the Devices tab of your project.
          </p>
          <label>Client ID (Access ID)</label>
          <input type="text" value={form.tuyaClientId} onChange={set('tuyaClientId')} placeholder="e.g. a1b2c3d4e5f6g7h8" />
          <div className="flex items-center justify-between"><label>Client Secret (Access Key)</label>{statusDot(cfg?.hasTuyaSecret)}</div>
          <input type="password" value={form.tuyaSecret} onChange={set('tuyaSecret')} placeholder="Leave blank to keep existing" />
          <label>Region</label>
          <select value={form.tuyaRegion} onChange={set('tuyaRegion')}>
            <option value="us">US (America)</option>
            <option value="eu">EU (Europe)</option>
            <option value="cn">CN (China)</option>
            <option value="in">IN (India)</option>
          </select>
          <label>Device IDs (comma-separated)</label>
          <input type="text" value={form.tuyaDeviceIds} onChange={set('tuyaDeviceIds')} placeholder="deviceId1, deviceId2, …" />
        </div>

        <div className="flex items-center gap-3">
          <button className="btn btn-primary" onClick={save}>Save Settings</button>
          {saved && <span className="text-emerald-400 font-semibold text-[13px]">Settings saved.</span>}
        </div>
      </div>
    </div>
  );
}
