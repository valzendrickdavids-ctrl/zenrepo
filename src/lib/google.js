import {checkGoogleProvider,authErrorMessage} from './authFlow.js';

export function googleIdentity(user) {
  if(!user||user.demo)return null;
  return user.identities?.find(identity=>identity.provider==='google') ||
    (user.app_metadata?.provider==='google'?{provider:'google',identity_data:user.user_metadata}:null);
}
export function hasGoogle(user) { return Boolean(googleIdentity(user)); }
export function googleEmail(user) {
  const identity=googleIdentity(user);
  return identity ? identity.identity_data?.email || user.email || '' : '';
}
export async function startGoogleLogin(client,currentUrl,project) {
  if(!client)throw Error('Online sign-in is not configured.');
  let redirect;
  try { redirect=new URL(currentUrl); } catch { throw Error('Open the game through its local server or HTTPS website.'); }
  if(!['http:','https:'].includes(redirect.protocol)||redirect.username||redirect.password)throw Error('Open the game through its local server or HTTPS website.');
  redirect.search='';redirect.hash='';
  if(project)await checkGoogleProvider(project);
  let result;
  try {
    result=await client.auth.signInWithOAuth({provider:'google',options:{
      redirectTo:redirect.href,scopes:'openid email profile',queryParams:{prompt:'select_account'}
    }});
  } catch { throw Error('Google sign-in could not start. Check your connection and try again.'); }
  if(result.error)throw Error(authErrorMessage(result.error));
}
