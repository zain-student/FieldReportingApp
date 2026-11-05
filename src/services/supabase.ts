import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { appStorage } from '../storage/mmkv';

const SUPABASE_URL = 'https://fuvnvabefkmzcfwmxhpy.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_PyRG51DREmbPMBu8F-Vs2A_VaJ0RNjj';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: {
      getItem: async (key: string) => {
        return appStorage.getString(key) ?? null;
      },

      setItem: async (key: string, value: string) => {
        appStorage.set(key, value);
      },

      removeItem: async (key: string) => {
        appStorage.remove(key);
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
