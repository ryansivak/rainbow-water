import { NextRequest, NextResponse } from 'next/server';
import { loadConfig, saveConfig } from '@/lib/config';
import { invalidateToken } from '@/lib/tuya';

export async function GET() {
  const cfg = loadConfig();
  return NextResponse.json({
    wixSiteId:      cfg.wixSiteId || '',
    hasWixKey:      !!cfg.wixApiKey,
    hasQuoKey:      !!cfg.openPhoneApiKey,
    tuyaClientId:   cfg.tuyaClientId || '',
    tuyaRegion:     cfg.tuyaRegion || 'us',
    tuyaDeviceIds:  cfg.tuyaDeviceIds || '',
    hasTuyaSecret:  !!cfg.tuyaSecret,
  });
}

export async function POST(req: NextRequest) {
  const cfg = loadConfig();
  const body = await req.json();
  if (body.wixApiKey)      cfg.wixApiKey      = body.wixApiKey;
  if (body.wixSiteId !== undefined) cfg.wixSiteId = body.wixSiteId;
  if (body.quoApiKey) cfg.openPhoneApiKey = body.quoApiKey;
  if (body.tuyaClientId !== undefined) cfg.tuyaClientId = body.tuyaClientId;
  if (body.tuyaSecret)     { cfg.tuyaSecret = body.tuyaSecret; invalidateToken(); }
  if (body.tuyaRegion !== undefined) cfg.tuyaRegion = body.tuyaRegion;
  if (body.tuyaDeviceIds !== undefined) cfg.tuyaDeviceIds = body.tuyaDeviceIds;
  saveConfig(cfg);
  return NextResponse.json({ ok: true });
}
