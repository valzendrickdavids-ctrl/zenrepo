import { createClient } from '@supabase/supabase-js';
import { validateConfig } from './config.js';
export const config = validateConfig(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
export const supabase = config.valid ? createClient(config.url, config.key, {
  auth: { flowType: 'pkce', detectSessionInUrl: true },
}) : null;

