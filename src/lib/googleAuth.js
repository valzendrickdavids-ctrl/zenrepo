export const usesGoogle = user => user?.app_metadata?.provider === 'google' || user?.identities?.some(identity => identity.provider === 'google');

export function googleReturnUrl(href) {
  const url = new URL(href);
  url.search = '';
  url.hash = '';
  return url.href;
}

export async function beginGoogleSignIn(client, href) {
  const {error} = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {redirectTo: googleReturnUrl(href), queryParams: {prompt: 'select_account'}}
  });
  if (error) throw Error('Google sign-in could not start. Please try again or use your username and password.');
}

// Complete OAuth before HashRouter starts. Never render provider error text or tokens.
export async function finishGoogleSignIn(client, href, replace) {
  const url = new URL(href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const failed = url.searchParams.has('error') || fragment.has('error');
  const code = url.searchParams.get('code');
  if (!failed && !code) return '';
  for (const key of ['code','error','error_code','error_description']) url.searchParams.delete(key);
  url.hash = '/auth';
  replace(url.href);
  if (failed) return 'Google sign-in was cancelled or could not finish. Please try again.';
  try {
    if (!client) throw Error('Unavailable');
    const {data,error} = await client.auth.exchangeCodeForSession(code);
    if (error || !data?.session) throw Error('No session');
    return '';
  } catch {
    return 'Google sign-in could not finish. Please start again in this browser.';
  }
}
