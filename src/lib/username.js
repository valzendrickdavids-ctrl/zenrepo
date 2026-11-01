export function normalizeUsername(value) {
  const username=String(value||'').trim().toLowerCase();
  if(!/^[a-z][a-z0-9_]{2,23}$/.test(username))
    throw Error('Use 3–24 letters, numbers or underscores, starting with a letter.');
  return username;
}
export async function signInWithUsername(client,name,password) {
  const username=normalizeUsername(name);
  const {data,error}=await client.functions.invoke('username-login',{body:{username,password}});
  if(error||!data?.session?.access_token||!data?.session?.refresh_token)
    throw Error('Sign in failed. Check your username and password, or try again later.');
  const result=await client.auth.setSession({
    access_token:data.session.access_token,refresh_token:data.session.refresh_token
  });
  if(result.error)throw Error('Your session could not start. Please try signing in again.');
  return result;
}

export function validatePassword(password) {
  if(typeof password!=='string'||password.length<8||password.length>128)
    throw Error('Use a password between 8 and 128 characters.');
  return password;
}

export async function registerWithUsername(client,name,password) {
  const username=normalizeUsername(name);
  validatePassword(password);
  const {data,error}=await client.functions.invoke('username-register',{body:{username,password}});
  if(error||data?.created!==true)
    throw Error('Account could not be created. The username may be taken, or registration is temporarily unavailable.');
  return data;
}
