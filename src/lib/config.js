export function validateConfig(rawUrl = '', rawKey = '') {
  const url = rawUrl.trim().replace(/\/+$/, '');
  const key = rawKey.trim();
  if (!url && !key) return { valid: false, message: 'Local demo mode. Add your Supabase settings to enable online accounts.' };
  if (!url || !key) return { valid: false, message: 'Both Supabase URL and browser key are required in .env.local.' };
  if (/[<>\[\]]|your-project|replace-me|example\.com/i.test(url)) return { valid: false, message: 'Replace the placeholder URL with your Supabase Project URL.' };
  try {
    const parsed = new URL(url);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if (!(parsed.protocol === 'https:' || (local && parsed.protocol === 'http:')) ||
        parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') throw Error();
  } catch { return { valid: false, message: 'Use a complete HTTPS Project URL, without a dashboard path, query, or credentials.' }; }
  if (key.startsWith('sb_secret_')) return { valid: false, message: 'Use a publishable or anon key, never a secret key.' };
  if (!key.startsWith('sb_publishable_')) {
    try {
      const parts = key.split('.');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (parts.length !== 3 || payload.role !== 'anon') throw Error();
    } catch { return { valid: false, message: 'The browser key must be a publishable key or a legacy anon key.' }; }
  }
  return { valid: true, url, key, message: '' };
}

