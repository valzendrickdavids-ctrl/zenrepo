import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase.js';
import {normalizeUsername,validatePassword} from '../lib/username.js';
import {usesGoogle} from '../lib/googleAuth.js';

export default function UsernameSettings({user,readOnly=false}) {
  const googleAccount=usesGoogle(user);
  const [current,setCurrent]=useState(null),[name,setName]=useState('');
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
  const needsPassword=!user.identities?.some(identity=>identity.provider==='email')&&user.app_metadata?.account_type!=='username';
  useEffect(()=>{
    let active=true;
    if(!supabase||googleAccount){setLoading(false);return;}
    supabase.from('player_usernames').select('username').eq('user_id',user.id).maybeSingle()
      .then(({data,error})=>{
        if(!active)return;
        setLoading(false);
        if(error){setMessage('Username settings need the username SQL update.');return;}
        setCurrent(data?.username||'');
      }).catch(()=>{if(active){setLoading(false);setMessage('Username settings could not load.');}});
    return()=>{active=false;};
  },[user.id,googleAccount]);
  async function save(e){
    e.preventDefault();setMessage('');setBusy(true);
    try {
      const value=normalizeUsername(name);
      const {error}=await supabase.rpc('set_my_username',{p_username:value});
      if(error)throw Error('That username could not be saved. It may be taken; try another.');
      setCurrent(value);setMessage('Username saved. Make sure you have set a password for this account.');
    }catch(error){setMessage(error.message);}finally{setBusy(false);}
  }
  async function savePassword(e){
    e.preventDefault();setMessage('');setBusy(true);
    try{
      validatePassword(password);
      if(password!==confirmation)throw Error('The passwords do not match.');
      const {error}=await supabase.auth.updateUser({password});
      if(error)throw Error('Your password could not be updated. Your session may need to be refreshed, or the password may not meet account requirements.');
      setPassword('');setConfirmation('');setMessage('Password saved. Use your username and this password to sign in.');
    }catch(error){setMessage(error.message);}finally{setBusy(false);}
  }
  if(googleAccount)return readOnly?<span className="profile-username">Google account</span>:<section className="username-settings"><h3>Google account</h3><p>You sign in with Google. Manage your password and account security in your Google account.</p></section>;
  if(readOnly)return <span className="profile-username" aria-label="Sign-in username">{loading?'Loading username…':current||'Player account'}</span>;
  return <section className="username-settings">
    <h3>Sign-in username</h3>
    {loading?<p role="status">Loading username…</p>:current?<p><strong>{current}</strong></p>:current===''?<form onSubmit={save}>
      <label>Username<input autoComplete="username" value={name} maxLength={24} required pattern="[A-Za-z][A-Za-z0-9_]{2,23}" onChange={e=>setName(e.target.value)} disabled={busy}/></label>
      <p className="small muted">Choose a unique name, 3–24 letters, numbers or underscores. This is separate from your in-game name.</p>
      <button className="button secondary full" disabled={busy}>{busy?'Saving…':'Set username'}</button>
    </form>:null}
    {needsPassword&&<p className="small muted">Set a username and password before signing out so you can return to this account and keep your progress.</p>}
    {current&&<section className="account-password"><h3>Set / change password</h3><form onSubmit={savePassword}><label>New password<input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} disabled={busy} onChange={e=>setPassword(e.target.value)}/></label><label>Confirm new password<input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} disabled={busy} onChange={e=>setConfirmation(e.target.value)}/></label><button className="button secondary full" disabled={busy}>{busy?'Saving…':'Save password'}</button></form></section>}
    {message&&<p role="status">{message}</p>}
  </section>;
}
