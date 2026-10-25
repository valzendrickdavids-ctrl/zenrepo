const disabledMessage='Google sign-in is not enabled for this Supabase project. The game owner must enable Google in Supabase → Authentication → Sign In / Providers, enter the Google Client ID and Client Secret there, and save. You can use email sign-in meanwhile.';
export function authErrorMessage(error) {
  const detail=`${error?.code||''} ${error?.error_code||''} ${error?.message||''} ${error?.error_description||''} ${error?.msg||''}`.toLowerCase();
  if(detail.includes('provider is not enabled')||detail.includes('provider_disabled'))return disabledMessage;
  if(detail.includes('access_denied'))return 'Google sign-in was cancelled or permission was declined. Try again, or use email sign-in.';
  if(detail.includes('flow_state')||detail.includes('code_verifier')||detail.includes('bad_code_verifier'))return 'This sign-in link expired or was opened in a different browser. Start Google sign-in again in the same browser and tab.';
  if(detail.includes('email'))return 'Google did not provide a usable email address. Allow email access or use email sign-in. The owner should check the Google email scope.';
  return 'Google sign-in could not finish. Try again in the same browser, or use email sign-in. The game owner should check the Google provider and allowed redirect URLs.';
}

export async function checkGoogleProvider(project, request=fetch) {
  if(!project?.url||!project?.key)throw Error('Online sign-in is not configured. Add the Supabase project URL and browser-safe key first.');
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
  let response;
  try {response=await request(`${project.url.replace(/\/+$/,'')}/auth/v1/settings`,{headers:{apikey:project.key},signal:controller.signal});}
  catch {throw Error('Could not reach the sign-in service. Check your internet connection and try again.');}
  finally {clearTimeout(timeout);}
  if(response.status===401||response.status===403)throw Error('Supabase rejected the browser key. The owner should check that the project URL and publishable key belong to the same project.');
  if(!response.ok)throw Error('The sign-in service is unavailable. Please try again later.');
  let settings;
  try{settings=await response.json();}catch{throw Error('The sign-in service returned an unexpected response. Please try again.');}
  if(settings.external?.google!==true)throw Error(disabledMessage);
}

export function readAuthCallback(href) {
  const url=new URL(href);
  const hash=new URLSearchParams(url.hash.startsWith('#/')?'':url.hash.slice(1));
  const fields=['code','error','error_code','error_description','access_token','refresh_token'];
  const isCallback=fields.some(key=>url.searchParams.has(key)||hash.has(key));
  const get=key=>url.searchParams.get(key)||hash.get(key)||'';
  const hasError=['error','error_code','error_description'].some(key=>Boolean(get(key)));
  return {isCallback,hasError,error:{code:get('error'),error_code:get('error_code'),error_description:get('error_description')},path:url.pathname};
}

export async function finishAuthCallback(client,href) {
  const callback=readAuthCallback(href);
  if(!callback.isCallback)return null;
  let notice='';
  try{
    if(callback.hasError)throw callback.error;
    if(!client)throw Error('Missing configuration');
    // Supabase owns the PKCE exchange. Never exchange the same code twice.
    const initialized=await client.auth.initialize();
    if(initialized.error)throw initialized.error;
    const result=await client.auth.getSession();
    if(result.error)throw result.error;
    if(!result.data?.session)throw Error('Missing session');
  }catch(error){notice=authErrorMessage(error);}
  return {notice,path:callback.path+(notice?'#/auth':'#/')};
}
