export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { loadConfig, saveConfig } from '@/lib/config';

export async function POST(req: NextRequest) {
  const cfg = loadConfig();
  cfg.tuyaThresholds = await req.json();
  saveConfig(cfg);
  return NextResponse.json({ ok: true });
}

