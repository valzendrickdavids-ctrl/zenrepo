import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Settings,LogOut,UserRound} from 'lucide-react';
import Modal from './Modal.jsx';
import UsernameSettings from './UsernameSettings.jsx';
import {AVATARS,SEX_OPTIONS,googlePhoto} from '../lib/profileRules.js';
import {hasGoogle,googleEmail} from '../lib/google.js';

export function PlayerAvatar({user,profile}) {
  const photo=profile?.avatar==='google'&&hasGoogle(user)?googlePhoto(user):null;
  const [failed,setFailed]=useState(null);
  return <span className="player-avatar" aria-hidden="true">{photo&&failed!==photo?<img src={photo} alt="" referrerPolicy="no-referrer" onError={()=>setFailed(photo)}/>:profile?(AVATARS[profile.avatar]||'🦉'):<UserRound size={23}/>}</span>;
}

export default function PlayerProfile({user,profile,loading,error,onRetry,onSave,onSkip,onClose,onSettings,onSignOut,onboarding=false}) {
  const [draft,setDraft]=useState(profile);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const current=draft||profile;
  const update=(field,value)=>setDraft({...current,[field]:value});
  async function save(e){
    e.preventDefault();setBusy(true);setMessage('');
    try{await onSave(current);setMessage('Your profile is saved.');}catch(e){setMessage(e.message);}finally{setBusy(false);}
  }
  async function skip(){setBusy(true);setMessage('');try{await onSkip();}catch(e){setMessage(e.message);}finally{setBusy(false);}}
  const close=()=>{if(busy)return;if(onboarding)skip();else onClose();};
  return <Modal title={onboarding?'Welcome to Clear & Conquer!':'Your profile'} onClose={close}>
    {loading?<p role="status">Loading your account…</p>:!user?<><p>You’re not signed in.</p><Link className="button primary full" to="/auth" onClick={onClose}>Sign in or create an account</Link></>:error?<><p role="alert">{error}</p><button className="button full" onClick={onRetry}>Retry profile</button></>:current&&<>
      <div className="profile-identity"><PlayerAvatar user={user} profile={current}/><div><strong>{profile.display_name}</strong><span>{user.demo?'Local demo · this browser only':hasGoogle(user)?'Google account':'Email account'}</span>{!user.demo&&<span className="profile-account-email">{googleEmail(user)||user.email}</span>}</div></div>
      {onboarding&&<p className="muted">Make yourself at home! These details are optional. You can change them later in your profile.</p>}
      {!onboarding&&!hasGoogle(user)&&<UsernameSettings user={user}/>}
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <label htmlFor="player-name">In-game name (optional)</label><input id="player-name" value={current.display_name} maxLength={30} autoComplete="nickname" onChange={e=>update('display_name',e.target.value)}/>
          <div className="profile-fields"><div><label htmlFor="player-sex">Sex (optional)</label><select id="player-sex" value={current.sex} onChange={e=>update('sex',e.target.value)}>{SEX_OPTIONS.map(option=><option key={option}>{option}</option>)}</select></div><div><label htmlFor="player-age">Age (optional)</label><input id="player-age" type="number" min="1" max="120" step="1" value={current.age??''} placeholder="Not provided" onChange={e=>update('age',e.target.value)}/></div></div>
          <fieldset className="avatar-options"><legend>Choose your avatar</legend><div className="avatar-grid">{Object.entries(AVATARS).map(([key,emoji])=><button type="button" key={key} aria-label={`${key} avatar`} aria-pressed={current.avatar===key} onClick={()=>update('avatar',key)}>{emoji}</button>)}</div>
            {hasGoogle(user)&&(googlePhoto(user)?<button type="button" className="button secondary full" aria-pressed={current.avatar==='google'} onClick={()=>update('avatar','google')}>Use my Google profile picture</button>:<p className="small muted">Google did not provide a photo. Choose an avatar instead.</p>)}
          </fieldset>
          <p className="small muted">Only your in-game name appears on leaderboards. Age and sex are private to your account.{user.demo?' Demo details are stored on this browser; anyone using this browser can access them.':''}</p>
          <button className="button primary full" disabled={busy}>{busy?'Saving…':onboarding?'Save & continue':'Save profile'}</button>
          {onboarding&&<button type="button" className="text-button" onClick={skip}>Skip for now</button>}
        </fieldset>
      </form>
    </>}
    {message&&<p role="status">{message}</p>}
    {!onboarding&&<div className="profile-actions"><button className="button secondary full" disabled={busy} onClick={onSettings}><Settings size={18}/>Settings</button>{user&&<button className="button full" disabled={busy} onClick={onSignOut}><LogOut size={18}/>Sign out</button>}</div>}
  </Modal>;
}
