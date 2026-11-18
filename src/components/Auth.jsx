import {useState} from 'react';
import {supabase,config} from '../lib/supabase.js';
import {registerWithUsername,signInWithUsername} from '../lib/username.js';
import {beginGoogleSignIn} from '../lib/googleAuth.js';

export default function Auth(){
  const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
  const [signup,setSignup]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function submit(event){
    event.preventDefault();if(busy||!supabase)return;
    setMessage('');
    if(signup&&password!==confirmation){setMessage('The passwords do not match.');return;}
    setBusy(true);
    let created=false;
    try{
      if(signup){await registerWithUsername(supabase,username,password);created=true;}
      await signInWithUsername(supabase,username,password);
    }catch(error){
      if(created){setSignup(false);setPassword('');setConfirmation('');setMessage('Account created. Sign in with your username and password.');}
      else setMessage(error.message||'Please try again.');
    }finally{setBusy(false);}
  }
  function toggle(){setSignup(value=>!value);setPassword('');setConfirmation('');setMessage('');}
  async function google(){
    if(busy||!supabase)return;
    setBusy(true);setMessage('');
    try{await beginGoogleSignIn(supabase,window.location.href);}
    catch(error){setMessage(error.message);setBusy(false);}
  }
  return <main className="auth-wrap"><section className="panel auth">
    <span className="eyebrow">YOUR NEXT DISCOVERY STARTS HERE</span>
    <h1>{signup?'Create your account.':'Welcome back.'}</h1>
    <p className="muted auth-intro">{signup?'Choose a username and password to save your discoveries.':'Sign in to continue your discoveries and climb the leaderboard.'}</p>
    {!config.valid&&<div className="notice" role="status">{config.message}</div>}
    {!signup&&<><button type="button" className="button google-login full" disabled={busy||!supabase} onClick={google}>Continue with Google</button>
    <p className="auth-divider">or use your username</p></>}
    <form onSubmit={submit}><fieldset disabled={busy||!supabase}>
      <div className="auth-field"><label htmlFor="account-username">Username</label><input id="account-username" type="text" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={24} pattern="[A-Za-z][A-Za-z0-9_]{2,23}" title="3–24 letters, numbers or underscores, starting with a letter." aria-describedby={signup?'username-help':undefined} required/>
      {signup&&<p id="username-help" className="small muted auth-help">3–24 letters, numbers or _; start with a letter.</p>}</div>
      <div className="auth-field"><label htmlFor="account-password">Password</label><input id="account-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={signup?'new-password':'current-password'} minLength={signup?8:undefined} maxLength={signup?128:1024} aria-describedby={signup?'password-help':undefined} required/>
      {signup&&<p id="password-help" className="small muted auth-help">8–128 characters. Store it somewhere safe.</p>}</div>
      {signup&&<div className="auth-field"><label htmlFor="account-confirm-password">Confirm password</label><input id="account-confirm-password" type="password" value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required/></div>}
      {message&&<p className="auth-message" role="status">{message}</p>}
      <button className="button primary full" disabled={busy||!supabase}>{busy?'Please wait…':signup?'Create account':'Sign in'}</button>
    </fieldset></form>
    <div className="auth-actions"><button type="button" className="text-button" disabled={busy} onClick={toggle}>{signup?'Already have an account? Sign in':'New here? Create an account'}</button></div>
  </section></main>;
}
