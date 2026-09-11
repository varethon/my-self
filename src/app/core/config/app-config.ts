export interface AppConfig {
  production: boolean;
  supabaseUrl: string;
  supabasePublishableKey: string;
}

declare global {
  interface Window {
    __VARETHON_CONFIG__?: Partial<AppConfig>;
  }
}

const runtimeConfig: Partial<AppConfig> = typeof window === 'undefined' ? {} : window.__VARETHON_CONFIG__ ?? {};

export const appConfig: AppConfig = {
  production: true,
  supabaseUrl: 'https://qphzagsrntgjktnqiyaz.supabase.co',
  supabasePublishableKey: '',
  ...runtimeConfig,
};

export const isSupabaseConfigured = (): boolean =>
  appConfig.supabaseUrl.startsWith('https://') && appConfig.supabasePublishableKey.length > 20;
