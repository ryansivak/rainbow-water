import crypto from 'crypto';
import { AppConfig } from './config';

const ENDPOINTS: Record<string, string> = {
  us: 'https://openapi.tuyaus.com',
  eu: 'https://openapi.tuyaeu.com',
  cn: 'https://openapi.tuyacn.com',
  in: 'https://openapi.tuyain.com',
};

let tokenCache = { token: '', expiresAt: 0 };

function sign(secret: string, message: string) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex').toUpperCase();
}

async function getToken(cfg: AppConfig): Promise<string> {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  const base = ENDPOINTS[cfg.tuyaRegion || 'us'];
  const t = Date.now().toString();
  const s = sign(cfg.tuyaSecret!, cfg.tuyaClientId! + t);
  const res = await fetch(`${base}/v1.0/token?grant_type=1`, {
    headers: { client_id: cfg.tuyaClientId!, sign: s, t, sign_method: 'HMAC-SHA256' },
  });
  const data = await res.json();
  if (!data.success) throw new Error('Tuya auth failed: ' + (data.msg ?? JSON.stringify(data)));
  tokenCache = { token: data.result.access_token, expiresAt: Date.now() + (data.result.expire_time - 60) * 1000 };
  return tokenCache.token;
}

export async function tuyaFetch(endpoint: string, cfg: AppConfig) {
  const base = ENDPOINTS[cfg.tuyaRegion || 'us'];
  const token = await getToken(cfg);
  const t = Date.now().toString();
  const s = sign(cfg.tuyaSecret!, cfg.tuyaClientId! + token + t);
  const res = await fetch(`${base}${endpoint}`, {
    headers: { client_id: cfg.tuyaClientId!, access_token: token, sign: s, t, sign_method: 'HMAC-SHA256' },
  });
  const data = await res.json();
  if (!data.success) throw new Error('Tuya error: ' + (data.msg ?? JSON.stringify(data)));
  return data.result;
}

export function invalidateToken() { tokenCache = { token: '', expiresAt: 0 }; }
