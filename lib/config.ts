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

export function loadConfig(): AppConfig {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch { return {}; }
}

export function saveConfig(data: AppConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}
