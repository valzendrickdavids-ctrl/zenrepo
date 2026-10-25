import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase.js';
import {normalizeUsername} from '../lib/username.js';

export default function UsernameSettings({user}) {
  const [current,setCurrent]=useState(null),[name,setName]=useState('');
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  useEffect(()=>{
    let active=true;
    if(!supabase||user.demo){setLoading(false);return;}
    supabase.from('player_usernames').select('username').eq('user_id',user.id).maybeSingle()
      .then(({data,error})=>{
        if(!active)return;
        setLoading(false);
        if(error){setMessage('Username settings need the username SQL update.');return;}
        setCurrent(data?.username||'');
      }).catch(()=>{if(active){setLoading(false);setMessage('Username settings could not load.');}});
    return()=>{active=false;};
  },[user.id]);
  async function save(e){
    e.preventDefault();setMessage('');setBusy(true);
    try {
      const value=normalizeUsername(name);
      const {error}=await supabase.rpc('set_my_username',{p_username:value});
      if(error)throw Error('That username could not be saved. It may be taken; try another.');
      setCurrent(value);setMessage('Username saved. Use it with your existing password next time.');
    }catch(error){setMessage(error.message);}finally{setBusy(false);}
  }
  if(user.demo)return null;
  return <section className="username-settings">
    <h3>Sign-in username</h3>
    {loading?<p role="status">Loading username…</p>:current?<p><strong>{current}</strong><br/><small>Your sign-in username is permanent. Your in-game name can still change.</small></p>:current===''?<form onSubmit={save}>
      <label>Username<input autoComplete="username" value={name} maxLength={24} required pattern="[A-Za-z][A-Za-z0-9_]{2,23}" onChange={e=>setName(e.target.value)} disabled={busy}/></label>
      <p className="small muted">Choose a unique name, 3–24 letters, numbers or underscores. This is separate from your in-game name. Google-only accounts still use Google unless a password is set.</p>
      <button className="button secondary full" disabled={busy}>{busy?'Saving…':'Set username'}</button>
    </form>:null}
    {message&&<p role="status">{message}</p>}
  </section>;
}
