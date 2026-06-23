import fs from 'fs';

const CONFIG_PATH = 'D:\\Rainbow_Water\\app\\config.json';

export interface AppConfig {
  wixApiKey?: string;
  wixSiteId?: string;
  openPhoneApiKey?: string;
  tuyaClientId?: string;
  tuyaSecret?: string;
  tuyaRegion?: string;
  tuyaDeviceIds?: string;
  tuyaThresholds?: Record<string, number>;
}

function fileConfig(): AppConfig {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch { return {}; }
}

export function loadConfig(): AppConfig {
  const file = fileConfig();
  return {
    wixApiKey:      process.env.WIX_API_KEY      || file.wixApiKey,
    wixSiteId:      process.env.WIX_SITE_ID      || file.wixSiteId,
    openPhoneApiKey:process.env.QUO_API_KEY       || file.openPhoneApiKey,
    tuyaClientId:   process.env.TUYA_CLIENT_ID    || file.tuyaClientId,
    tuyaSecret:     process.env.TUYA_SECRET       || file.tuyaSecret,
    tuyaRegion:     process.env.TUYA_REGION       || file.tuyaRegion,
    tuyaDeviceIds:  process.env.TUYA_DEVICE_IDS   || file.tuyaDeviceIds,
    tuyaThresholds: file.tuyaThresholds,
  };
}

export function saveConfig(data: AppConfig): void {
  const current = fileConfig();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ ...current, ...data }, null, 2));
}
