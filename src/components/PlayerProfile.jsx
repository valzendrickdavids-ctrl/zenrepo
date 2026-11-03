import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Settings,LogOut,UserRound,ImagePlus} from 'lucide-react';
import Modal from './Modal.jsx';
import UsernameSettings from './UsernameSettings.jsx';
import {AVATARS,SEX_OPTIONS} from '../lib/profileRules.js';
import {createProfileAutosave} from '../lib/profileAutosave.js';
import {prepareProfilePhoto} from '../lib/profilePhoto.js';

export function PlayerAvatar({user,profile}) {
  return <span className="player-avatar" aria-hidden="true">{profile?.avatar==='rocket'&&profile.avatar_image?<img src={profile.avatar_image} alt=""/>:profile?(AVATARS[profile.avatar]||'🦉'):<UserRound size={23}/>}</span>;
}

export default function PlayerProfile({user,profile,loading,error,onRetry,onSave,onPreview,onFinish,onClose,onSettings,onSignOut,onboarding=false}){
  const [draft,setDraft]=useState(profile),[saveState,setSaveState]=useState({kind:'idle',message:''}),[leaving,setLeaving]=useState(false);
  const callbacks=useRef(null),editor=useRef(null),mounted=useRef(true),leavingRef=useRef(false),latestDraft=useRef(profile);
  const closeAnimation=useRef(null);
  const photoInput=useRef(null),photoVersion=useRef(0);
  const [photoBusy,setPhotoBusy]=useState(false),[photoError,setPhotoError]=useState('');
  callbacks.current={onSave,onPreview};
  useEffect(()=>{
    mounted.current=true;
    if(profile){
      editor.current=createProfileAutosave({
        initial:profile,
        save:input=>callbacks.current.onSave(input),
        onDraft:input=>{latestDraft.current=input;setDraft(input);callbacks.current.onPreview(input);},
        onStatus:setSaveState
      });
      for(const field of ['display_name','sex','age','avatar','avatar_image'])if(latestDraft.current)editor.current.update(field,latestDraft.current[field]);
    }
    return()=>{mounted.current=false;closeAnimation.current?.cancel();editor.current?.dispose();editor.current=null;};
  },[user?.id]);
  const current=draft||profile;
  const update=(field,value)=>editor.current?.update(field,value);
  const flush=()=>editor.current?.flush().catch(()=>{});
  async function choosePhoto(event){
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    const version=++photoVersion.current;setPhotoBusy(true);setPhotoError('');
    try{
      const image=await prepareProfilePhoto(file);
      if(!mounted.current||version!==photoVersion.current)return;
      update('avatar_image',image);update('avatar','rocket');await editor.current?.flush();
    }catch(error){if(mounted.current)setPhotoError(error.message);}
    finally{if(mounted.current&&version===photoVersion.current)setPhotoBusy(false);}
  }
  async function leave(next){
    if(leavingRef.current||photoBusy)return;leavingRef.current=true;setLeaving(true);
    try{await editor.current?.flush();await next();}
    catch{/* Keep the draft open and show the editor's failed-save message. */}
    finally{leavingRef.current=false;if(mounted.current)setLeaving(false);}
  }
  const close=event=>{
    const panel=event?.currentTarget?.closest('.profile-modal');
    return leave(async()=>{
      if(!mounted.current)return;
      try{
        if(panel&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
          const style=getComputedStyle(panel);
          closeAnimation.current=panel.animate([
            {opacity:style.opacity,transform:style.transform},
            {opacity:0,transform:'translateY(6px)'}
          ],{duration:220,easing:'ease-in',fill:'forwards'});
          await closeAnimation.current.finished.catch(()=>{});
        }
        if(mounted.current)await (onboarding?onFinish:onClose)();
        // Keep the final transparent frame until React removes the dialog.
        // Cancelling here restores the opening animation and flashes the panel.
      }catch(error){closeAnimation.current?.cancel();closeAnimation.current=null;throw error;}
    });
  };
  const displayedName=current?.display_name?.trim()||'Player';
  const statusText=saveState.kind==='pending'?'Changes save automatically.':saveState.kind==='saving'?'Saving changes…':saveState.kind==='saved'?'All changes saved.':saveState.message;
  return <Modal title={onboarding?'Welcome to Clear & Conquer!':'Your profile'} onClose={close} className="profile-modal">
    {loading?<p role="status">Loading your account…</p>:!user?<><p>You’re not signed in.</p><Link className="button primary full" to="/auth" onClick={onClose}>Sign in or create an account</Link></>:error?<><p role="alert">{error}</p><button className="button full" onClick={onRetry}>Retry profile</button></>:current&&<>
      {onboarding&&<p className="muted profile-intro">Make yourself at home! These details are optional and save automatically.</p>}
      <form className="profile-form" onSubmit={event=>{event.preventDefault();flush();}}>
        <fieldset disabled={leaving||photoBusy}>
          <div className="profile-overview">
            <section className="profile-identity" aria-label="Player identity"><PlayerAvatar user={user} profile={current}/><div><strong>{displayedName}</strong><UsernameSettings user={user} readOnly/></div></section>
            <div className="profile-details">
              <div><label htmlFor="player-name">In-game name (optional)</label><input id="player-name" value={current.display_name} maxLength={30} autoComplete="nickname" onChange={e=>update('display_name',e.target.value)} onBlur={flush}/></div>
              <div className="profile-fields"><div><label htmlFor="player-sex">Sex (optional)</label><select id="player-sex" value={current.sex} onChange={e=>update('sex',e.target.value)} onBlur={flush}>{SEX_OPTIONS.map(option=><option key={option}>{option}</option>)}</select></div><div><label htmlFor="player-age">Age (optional)</label><input id="player-age" type="number" min="1" max="120" step="1" value={current.age??''} placeholder="Not provided" onChange={e=>update('age',e.target.value)} onBlur={flush}/></div></div>
            </div>
          </div>
          <fieldset className="avatar-options"><legend>Choose your avatar or photo</legend><div className="avatar-grid">{Object.entries(AVATARS).filter(([key])=>key!=='rocket').map(([key,emoji])=><button type="button" key={key} aria-label={`${key} avatar`} aria-pressed={current.avatar===key} onClick={()=>update('avatar',key)}>{emoji}</button>)}<button type="button" className="photo-avatar-option" aria-label="Upload profile photo" aria-pressed={current.avatar==='rocket'&&Boolean(current.avatar_image)} onClick={()=>photoInput.current?.click()}>{current.avatar_image?<img src={current.avatar_image} alt=""/>:<ImagePlus size={23} aria-hidden="true"/>}</button></div><input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose profile image" hidden onChange={choosePhoto}/></fieldset>
          {photoBusy&&<p className="small muted" role="status">Saving your photo…</p>}
          {photoError&&<p className="small urgent" role="alert">{photoError}</p>}
          <p className="small muted profile-privacy">Your in-game name and selected avatar or photo appear on leaderboards. Age and sex are private to your account.</p>
        </fieldset>
      </form>
      <p className={'profile-save-status small '+(saveState.kind==='error'?'urgent':'muted')} role={saveState.kind==='error'?'alert':'status'} aria-live="polite">{statusText||'Changes save automatically.'}</p>
      {saveState.kind==='error'&&<button className="button secondary full" disabled={leaving} onClick={flush}>Retry saving</button>}
      {onboarding&&<button className="button primary full" disabled={leaving} onClick={close}>{leaving?'Please wait…':'Continue'}</button>}
    </>}
    {!onboarding&&<div className="profile-actions"><button className="button secondary" disabled={leaving||photoBusy} onClick={()=>leave(onSettings)}><Settings size={16}/>Settings</button>{user&&<button className="button" disabled={leaving||photoBusy} onClick={()=>leave(onSignOut)}><LogOut size={16}/>Sign out</button>}</div>}
  </Modal>;
}
