import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Trophy, Clock, Eraser, Sun, Moon, Settings, Maximize, Minimize } from 'lucide-react';
import { supabase } from './lib/supabase.js';
import { difficulties, newRun, validRun, matches, answerPattern, points } from './lib/engine.js';
import { cacheRun, loadRun, readLocal, writeLocal, saveCloud, submitScore } from './lib/storage.js';
import { levels } from './data/levels.js';
import ScratchCanvas from './components/PrecisionCanvas.jsx';
import { emptyBrush, TOTAL_CELLS, STROKE_LIMIT } from './lib/brushEngine.js';
import { audio } from './lib/audio.js';
import Leaderboard from './components/Leaderboard.jsx';
import Modal from './components/Modal.jsx';
import Auth from './components/Auth.jsx';
import UsernameSettings from './components/UsernameSettings.jsx';
import PlayerProfile, {PlayerAvatar} from './components/PlayerProfile.jsx';
import {loadPlayerProfile,savePlayerProfile} from './lib/playerProfile.js';
import {StartScreen,Tutorial,CompletionAward,Feedback} from './components/Experience.jsx';
import {pausedRun,tutorialKey} from './lib/experience.js';
import useFullscreen from './lib/useFullscreen.js';
import {mergeRunSaves} from './lib/runSaves.js';
import AmbientBackground from './components/AmbientBackground.jsx';
import {queueScore,acknowledgeScore,flushScoreQueue,waitForScoreUploads,clearPendingScores} from './lib/scoreQueue.js';
import {withScoreAudit,recordScoreAnswer} from './lib/scoreAudit.js';
const QUEUED_SCORE_NOTICE='Progress saved on this device. Your leaderboard score will retry when connected.';

export default function App({initialNotice=''}) {
  const navigate=useNavigate();
  const [profile,setProfile]=useState(null),[profilePreview,setProfilePreview]=useState(null),[profileOpen,setProfileOpen]=useState(false),[accounts,setAccounts]=useState(false);
  const [profileLoading,setProfileLoading]=useState(false),[profileError,setProfileError]=useState('');
  const [profileRevision,setProfileRevision]=useState(0),[onboarding,setOnboarding]=useState(false),[welcome,setWelcome]=useState('');
  const welcomed=useRef(null);
  const location=useLocation();
  const [tutorialRevision,setTutorialRevision]=useState(0),[feedbackOpen,setFeedbackOpen]=useState(false),[tutorialUser,setTutorialUser]=useState(null);
  const [exitAction,setExitAction]=useState(null),[exiting,setExiting]=useState(false),[exitError,setExitError]=useState('');
  const [armedExit,setArmedExit]=useState(null);
  const [localQuitAvailable,setLocalQuitAvailable]=useState(false),[scoreRevision,setScoreRevision]=useState(0);
  // Require the quit prompt to be on screen before a second activation can accept it.
  const exitReady=exitAction?.type!=='quit'||armedExit===exitAction;
  useEffect(()=>{
    if(exitAction?.type!=='quit')return;
    const timer=setTimeout(()=>setArmedExit(exitAction),400);
    return()=>clearTimeout(timer);
  },[exitAction]);
  const exitBusy=useRef(false),allowLeave=useRef(false),previousPath=useRef(location.pathname);
  const [sound,setSound]=useState(()=>readLocal('cc-sound',true));
  const [music,setMusic]=useState(()=>readLocal('cc-music',false));
  const [resetting,setResetting]=useState(false);
  const [resetOpen,setResetOpen]=useState(false),[resetError,setResetError]=useState('');
  const resettingRef=useRef(false);
  const [user,setUser]=useState(null),[ready,setReady]=useState(!supabase),[loadedUserId,setLoadedUserId]=useState(null);
  const loaded=Boolean(user&&loadedUserId===user.id);
  const [run,setRun]=useState(null),[notice,setNotice]=useState(initialNotice),[settings,setSettings]=useState(false);
  const [savedRuns,setSavedRuns]=useState({});
  const [settingsPage,setSettingsPage]=useState('main');
  const [theme,setTheme]=useState(()=>readLocal('cc-theme','light'));
  const fullscreen=useFullscreen();
  const latest=useRef(null),saveQueue=useRef(Promise.resolve());
  const lastCloudSave=useRef(null),pendingSaves=useRef(new Map()),syncError=useRef('');
  const activeUserId=useRef(user?.id);activeUserId.current=user?.id;
  const visibleProfile=profilePreview||profile;
  const visibleName=visibleProfile?.display_name?.trim()||'Player';
  const welcomeText=welcome==='new'?'Welcome to Clear & Conquer! Your first discovery starts here.':welcome==='returning'?`Welcome back, ${visibleName}! Ready for another discovery?`:welcome==='personalized'?`Welcome, ${visibleName}! Let’s uncover something.`:'';
  const tutorialDone=Boolean(user&&(tutorialUser===user.id||readLocal(tutorialKey(user.id),false)));
  function finishTutorial(){writeLocal(tutorialKey(user.id),true);setTutorialUser(user.id);setTutorialRevision(n=>n+1);navigate('/home');}
  useEffect(()=>{
    if(location.pathname!=='/home'||!user||!welcome)return;
    const timer=setTimeout(()=>setWelcome(''),3000);
    return()=>clearTimeout(timer);
  },[location.pathname,user?.id,welcome]);
  useEffect(()=>{
    const wasPlaying=previousPath.current==='/play';previousPath.current=location.pathname;
    if(wasPlaying&&location.pathname!=='/play'&&latest.current?.phase!=='complete'&&latest.current&&user&&!allowLeave.current){
      setExitAction({type:'quit'});setExitError('');navigate('/play',{replace:true});
    }
    allowLeave.current=false;
  },[location.pathname]);
  useEffect(()=>{const warn=e=>{if(location.pathname==='/play'&&latest.current&&latest.current.phase!=='complete'){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[location.pathname]);
  useEffect(()=>{writeLocal('cc-sound',sound);writeLocal('cc-music',music);audio.configure(sound,music,location.pathname==='/play'&&run?.phase==='playing'&&!resetting);},[sound,music,location.pathname,run?.phase,resetting]);
  useEffect(()=>{window.addEventListener('pointerdown',audio.unlock);window.addEventListener('keydown',audio.unlock);return()=>{window.removeEventListener('pointerdown',audio.unlock);window.removeEventListener('keydown',audio.unlock);audio.dispose();};},[]);
  useEffect(()=>{document.documentElement.classList.toggle('dark',theme==='dark');writeLocal('cc-theme',theme);},[theme]);
  useEffect(()=>{
    if(!supabase) return;
    let active=true, authEvent=false;
    supabase.auth.getSession().then(({data,error})=>{if(active&&!authEvent){if(error)setNotice('Session could not load. Please sign in again.');setUser(data.session?.user||null);setReady(true);}}).catch(()=>{if(active){setReady(true);setNotice('Connection unavailable. Please sign in again.');}});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{authEvent=true;if(active){setUser(session?.user||null);setReady(true);}});
    return()=>{active=false;subscription.unsubscribe();};
  },[]);
  useEffect(()=>{
    let active=true;setLoadedUserId(null);setRun(null);setSavedRuns({});latest.current=null;lastCloudSave.current=null;
    if(!user)return;
    const restore=saved=>{
      const runs=Object.fromEntries(Object.entries(mergeRunSaves(saved)).filter(([,r])=>validRun(r,levels)));
      setSavedRuns(runs);setRun(runs[saved?.difficulty]||null);
      if(saved&&validRun(saved,levels))cacheRun(user,saved);
      setLoadedUserId(user.id);
    };
    loadRun(user).then(saved=>{if(active)restore(saved);}).catch(e=>{
      if(active){
        const local=readLocal('cc-run-'+user.id);
        const available=Object.values(mergeRunSaves(local)).some(saved=>validRun(saved,levels));
        restore(local);
        setNotice(`${e.message} ${available?'Your progress saved on this device is available.':'No saved progress was found on this device.'}`);
      }
    });
    return()=>{active=false;};
  },[user?.id]);
  useEffect(()=>{
    let active=true;
    setProfile(null);setProfilePreview(null);setProfileError('');setOnboarding(false);setWelcome('');
    if(!user){setProfileLoading(false);welcomed.current=null;return;}
    setProfileLoading(true);
    loadPlayerProfile(user).then(data=>{
      if(!active)return;
      setProfile(data);setProfileLoading(false);
      const isNew=!data.onboarding_complete;
      if(welcomed.current!==user.id){
        setWelcome(isNew?'new':'returning');
        welcomed.current=user.id;
      }
      setOnboarding(isNew);if(isNew)setProfileOpen(false);
    }).catch(e=>{if(active){setProfileError(e.message);setProfileLoading(false);}});
    return()=>{active=false;};
  },[user?.id,profileRevision]);
  async function saveProfile(input){
    const accountId=user.id;
    if(activeUserId.current!==accountId)throw Error('Your account changed. Open your current profile and try again.');
    const saved=await savePlayerProfile(user,input);
    if(activeUserId.current!==accountId)return;
    setProfile(saved);
    return saved;
  }
  function closeProfile(){setProfileOpen(false);setProfilePreview(null);}
  function finishProfile(){setOnboarding(false);closeProfile();setWelcome('personalized');}
  function openSettings(){closeProfile();setSettingsPage('main');setSettings(true);}
  function closeSettings(){setSettings(false);setProfileOpen(!['/','/auth'].includes(location.pathname));}
  function sync(u,r) {
    if(!u||!r||resettingRef.current||activeUserId.current!==u.id)return Promise.resolve(false);
    if(lastCloudSave.current?.userId===u.id&&lastCloudSave.current.run===r)return Promise.resolve(true);
    if(pendingSaves.current.has(r))return pendingSaves.current.get(r);
    const pending=saveQueue.current.catch(()=>{}).then(async()=>{
      if(resettingRef.current||activeUserId.current!==u.id)return false;
      try{
        await saveCloud(u,r);
        if(activeUserId.current===u.id&&!resettingRef.current){
          lastCloudSave.current={userId:u.id,run:r};
          const previousError=syncError.current;syncError.current='';
          if(previousError)setNotice(message=>message===previousError?'':message);
        }
        return true;
      }catch(e){
        if(activeUserId.current===u.id&&!resettingRef.current){syncError.current=e.message;setNotice(e.message);}
        return false;
      }
    }).finally(()=>pendingSaves.current.delete(r));
    pendingSaves.current.set(r,pending);saveQueue.current=pending;
    return pending;
  }
  useEffect(()=>{
    latest.current=run;
    if(!run||!user||!loaded)return;
    setSavedRuns(previous=>({...previous,[run.difficulty]:run}));
    if(!cacheRun(user,run))setNotice('Device storage is unavailable. Progress may not survive closing this tab.');
  },[run,user?.id,loaded]);
  useEffect(()=>{
    if(!user||!loaded)return;
    const flush=()=>{
      if(navigator.onLine===false||pendingSaves.current.size||resettingRef.current)return;
      const r=latest.current;if(r)sync(user,r);
    };
    const timer=setInterval(flush,3000);
    window.addEventListener('online',flush);
    return()=>{clearInterval(timer);window.removeEventListener('online',flush);};
  },[user?.id,loaded]);
  useEffect(()=>{
    if(!user||!loaded||exitAction)return;
    let active=true;
    const retry=()=>{
      if(navigator.onLine===false||resettingRef.current)return;
      flushScoreQueue(user,submitScore,()=>active&&activeUserId.current===user.id&&!resettingRef.current).then(result=>{
        if(!active||activeUserId.current!==user.id)return;
        if(result.uploaded)setScoreRevision(n=>n+1);
        if(result.uploaded&&!result.remaining)setNotice(text=>text===QUEUED_SCORE_NOTICE?'':text);
      });
    };
    retry();const timer=setInterval(retry,15000);window.addEventListener('online',retry);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('online',retry);};
  },[user?.id,loaded,Boolean(exitAction)]);
  useEffect(()=>{
    const save=()=>{if(user&&latest.current)cacheRun(user,latest.current);};
    window.addEventListener('pagehide',save);return()=>window.removeEventListener('pagehide',save);
  },[user?.id]);
  const update=fn=>setRun(prev=>{const next=fn(withScoreAudit(prev));return next===prev?prev:next?{...next,updatedAt:Date.now()}:next;});
  useEffect(()=>{
    if(location.pathname==='/play'&&loaded)
      update(r=>r?.phase==='playing'&&r.deadline==null?{...r,deadline:Date.now()+r.remaining*1000}:r);
  },[location.pathname,loaded,run?.id]);
  function start(difficulty) {
    if(!tutorialDone){navigate('/tutorial');return;}
    const next=newRun(levels,difficulty);next.deadline=Date.now()+next.remaining*1000;setRun(next);navigate('/play');
  }
  function resume(difficulty) {
    const saved=savedRuns[difficulty];if(!saved)return;
    const next=saved.phase==='playing'&&saved.deadline==null?{...saved,deadline:Date.now()+saved.remaining*1000,updatedAt:Date.now()}:saved;
    setRun(next);latest.current=next;navigate('/play');
  }
  function quit() {
    setSettings(false);setProfileOpen(false);setExitError('');setLocalQuitAvailable(false);setExitAction({type:'quit'});
  }
  function signOut(){setProfileOpen(false);setExitError('');setExitAction({type:'signout'});}
  async function confirmExit(){
    if(!exitAction||!exitReady||exitBusy.current)return;exitBusy.current=true;setExiting(true);setExitError('');setLocalQuitAvailable(false);
    try{
      const next=pausedRun(latest.current);
      if(next){
        if(!cacheRun(user,next))throw Error('Device save failed. Please retry before leaving.');
        setRun(next);latest.current=next;
        const upload=sync(user,next);
        if(exitAction.type==='signout')await upload;
        else{
          if(!queueScore(user,next))throw Error('Progress is saved, but the pending score could not be stored. Please retry.');
          setLocalQuitAvailable(true);
          await submitScore(user,next);
          acknowledgeScore(user,next);setScoreRevision(n=>n+1);
        }
      }
      if(exitAction.type==='signout'){
        const {error}=await supabase.auth.signOut();if(error)throw Error('Sign out failed. Please retry.');
        setUser(null);setRun(null);latest.current=null;setProfileOpen(false);setProfilePreview(null);setAccounts(false);setSettings(false);setOnboarding(false);setWelcome('');
      }
      allowLeave.current=true;setExitAction(null);navigate(exitAction.type==='signout'?'/':'/home');
    }catch(e){setExitError(e.message||'Could not finish. Please retry.');}
    finally{exitBusy.current=false;setExiting(false);}
  }
  function quitLocally(){
    if(exiting||!localQuitAvailable||exitAction?.type!=='quit')return;
    const next=pausedRun(latest.current);
    if(!next||!cacheRun(user,next)||!queueScore(user,next)){setExitError('Could not save on this device. Please retry before leaving.');return;}
    latest.current=next;setRun(next);allowLeave.current=true;setExitAction(null);setNotice(QUEUED_SCORE_NOTICE);navigate('/home');
  }
  function cancelExit(){if(exiting)return;setExitAction(null);setExitError('');if(location.pathname==='/play')update(r=>r?.phase==='playing'&&!r.deadline?{...r,deadline:Date.now()+r.remaining*1000}:r);}
  function requestReset(){if(!user||resettingRef.current)return;setResetError('');setSettings(false);setResetOpen(true);}
  function cancelReset(){if(resettingRef.current)return;setResetOpen(false);setResetError('');setSettings(true);}
  async function resetProgress() {
    if(!user||resettingRef.current)return;
    resettingRef.current=true;setResetting(true);setResetError('');audio.stopScratch();
    try{
      await saveQueue.current;
      await waitForScoreUploads(user);
      const {error}=await supabase.rpc('reset_my_game');if(error)throw Error('Reset failed. Run the updated supabase.sql and try again.');
      localStorage.removeItem('cc-run-'+user.id);clearPendingScores(user);
      const fresh=newRun(levels,run?.difficulty||'easy');
      setSavedRuns({[fresh.difficulty]:fresh});
      latest.current=fresh;cacheRun(user,fresh);setRun(fresh);
      await saveCloud(user,fresh);
      lastCloudSave.current={userId:user.id,run:fresh};
      setResetOpen(false);setSettings(false);allowLeave.current=true;navigate('/home');setNotice('Progress reset. Resume to begin Level 1 with zero points.');
    }catch(e){setResetError(e.message||'Reset could not finish. Please try again.');}
    finally{resettingRef.current=false;setResetting(false);}
  }
  if(!ready&&location.pathname!=='/')return <main className="loading">Opening Clear & Conquer…</main>;
  return <div className={'app-shell'+(location.pathname==='/auth'?' auth-shell':location.pathname==='/tutorial'?' tutorial-shell':location.pathname==='/home'?' home-shell':['/play','/complete'].includes(location.pathname)?' play-shell':location.pathname==='/'?' splash-shell':'')}>
    <AmbientBackground calm={location.pathname==='/play'&&run?.phase!=='complete'}/>
    {location.pathname!=='/'&&<header className="header">{['/home','/play','/complete'].includes(location.pathname)&&user&&welcomeText?<div className="menu-welcome welcome-banner" role="status"><span>{welcome==='new'?'Welcome, explorer!':welcome==='returning'?`Welcome back, ${visibleName}!`:`Welcome, ${visibleName}!`}</span><button aria-label="Dismiss welcome" onClick={()=>setWelcome('')}>×</button></div>:<span aria-hidden="true"/>}
      {location.pathname==='/auth'?<button className="profile-trigger" aria-label="Open game settings" onClick={openSettings}><span className="player-avatar" aria-hidden="true"><Settings size={23}/></span><span>Settings</span></button>:<button className="profile-trigger" aria-label={user?'Open your profile':'Open profile menu'} onClick={()=>setProfileOpen(true)}>
        <PlayerAvatar user={user} profile={visibleProfile}/><span>{visibleProfile?visibleName:'Profile'}</span>
      </button>}</header>}
    {user&&welcomeText&&!['/home','/play','/complete'].includes(location.pathname)&&<div className="notice welcome-banner" role="status">{welcomeText}<button aria-label="Dismiss welcome" onClick={()=>setWelcome('')}>×</button></div>}
    {notice&&<div className="notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss message">×</button></div>}
    {fullscreen.error&&!settings&&<div className="notice" role="status">{fullscreen.error}<button onClick={fullscreen.clearError} aria-label="Dismiss full screen message">×</button></div>}
    <Routes>
      <Route path="/" element={<StartScreen ready={ready} paused={settings||feedbackOpen||accounts||resetOpen||Boolean(exitAction)} continueTo={user?(tutorialDone?'/home':'/tutorial'):'/auth'}/>}/>
      <Route path="/tutorial" element={!user?<Navigate to="/auth" replace/>:<Tutorial key={user.id+':'+tutorialRevision} onFinish={finishTutorial}/>}/>
      <Route path="/home" element={!user?<Navigate to="/auth" replace/>:!tutorialDone?<Navigate to="/tutorial" replace/>:<Home profileName={profile?.display_name} scoreRefresh={scoreRevision} user={user} loaded={loaded&&!profileLoading&&!onboarding} run={run} savedRuns={savedRuns} start={start} resume={resume}/>}/>
      <Route path="/auth" element={user?<Navigate to={tutorialDone?'/home':'/tutorial'} replace/>:<Auth/>}/>
      {import.meta.env.DEV&&<Route path="/complete" element={<CompletionPreview user={user} playerName={visibleName}/>}/>}
      <Route path="/play" element={!user?<Navigate to="/auth" replace/>:!tutorialDone?<Navigate to="/tutorial" replace/>:resetting?<main className="loading">Resetting progress…</main>:(!loaded||profileLoading)?<main className="loading">Loading your progress…</main>:run?<Game key={run.id} user={{...user,name:profile?.display_name||user.name}} run={run} update={update} onQuit={quit}/>:<Navigate to="/home" replace/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
    {location.pathname!=='/'&&<footer>{location.pathname==='/home'?'Scratch the image. Guess the concept.':'One wipe, more guess — less stress, more success.'}</footer>}
    {(profileOpen||(onboarding&&location.pathname==='/home'&&!exitAction&&!feedbackOpen&&!settings&&!accounts&&!resetOpen))&&<PlayerProfile key={String(user?.id)+':'+profileLoading+':'+onboarding} user={user} profile={profile} loading={profileLoading} error={profileError} onboarding={onboarding&&location.pathname==='/home'} onRetry={()=>setProfileRevision(n=>n+1)} onSave={saveProfile} onPreview={setProfilePreview} onFinish={finishProfile} onClose={closeProfile} onSettings={openSettings} onSignOut={signOut}/>}
    {settings&&settingsPage==='main'&&<Modal title="Game settings" className="settings-modal" animateClose={location.pathname==='/auth'} onClose={closeSettings}><p className="muted settings-description">Customize your game.</p>
      <div className="settings-options">
      <button className="button secondary full" disabled={!fullscreen.supported||fullscreen.busy} aria-pressed={fullscreen.active} aria-keyshortcuts="f" aria-describedby="fullscreen-help" onClick={fullscreen.toggle}>{fullscreen.active?<Minimize size={18}/>:<Maximize size={18}/>} {fullscreen.active?'Exit full screen':'Enter full screen'}</button>
      <p id="fullscreen-help" className="small muted fullscreen-help">{fullscreen.supported?<>Press <kbd>F</kbd> to toggle full screen. Press <kbd>Esc</kbd> to exit.</>:<>Full screen is unavailable in this browser view. Open the game in Chrome and press <kbd>F11</kbd>.</>}</p>
      {fullscreen.error&&<p role="alert" className="small">{fullscreen.error}</p>}
      <button className="button secondary full" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>} Switch to {theme==='dark'?'light':'dark'} mode</button>
      {user&&<button className="button secondary full" onClick={()=>{setSettings(false);setAccounts(true);}}>Accounts</button>}
      <button className="button secondary full" aria-haspopup="dialog" onClick={()=>setSettingsPage('audio')}>Audio</button>
      {user&&location.pathname!=='/play'&&<button className="button secondary full" onClick={()=>{setSettings(false);navigate('/tutorial');}}>How to play</button>}
      <button className="button secondary full" onClick={()=>{setSettings(false);setFeedbackOpen(true);}}>Feedback & reports</button>
      {user&&<button className="button full danger" disabled={resetting} onClick={requestReset}>{resetting?'Resetting…':'Reset game progress'}</button>}
      </div>
      {location.pathname==='/play'&&<p className="small muted settings-timer-note">Your run timer keeps counting while settings are open.</p>}</Modal>}
    {settings&&settingsPage==='audio'&&<Modal title="Audio settings" className="settings-modal audio-settings-modal" animateClose={location.pathname==='/auth'} onClose={()=>setSettingsPage('main')}><p className="muted settings-description">Choose what you hear while playing.</p>
      <div className="settings-options">
        <button className="button secondary full audio-setting" role="switch" aria-checked={sound} onClick={()=>setSound(!sound)}><span>Sound effects</span><span className="audio-state">{sound?'On':'Off'}</span></button>
        <button className="button secondary full audio-setting" role="switch" aria-checked={music} onClick={()=>setMusic(!music)}><span>Background music</span><span className="audio-state">{music?'On':'Off'}</span></button>
        <button className="button secondary full" onClick={()=>setSettingsPage('main')}>Back to settings</button>
      </div></Modal>}
    {accounts&&user&&<Modal title="Accounts" onClose={()=>{setAccounts(false);setSettings(true);}}><UsernameSettings user={user}/><button className="button secondary full" onClick={()=>{setAccounts(false);setSettings(true);}}>Back to settings</button></Modal>}
    {feedbackOpen&&<Feedback user={user} onClose={()=>{setFeedbackOpen(false);setSettings(true);}}/>}
    {exitAction&&<Modal title={exitAction.type==='signout'?'Sign out of your account?':'Quit this game?'} onClose={cancelExit} confirmOnEnter inPage={exitAction.type==='quit'}><p>Your current progress will be saved on this device and synced when possible. The timer pauses when you confirm. {exitAction.type==='signout'?'You will return to the start screen.':'Your current score will also be saved to the leaderboard. You can resume from the difficulty screen.'}</p><p className="small muted">{localQuitAvailable?'Your run is paused and saved on this device.':'Until you confirm, an active round’s timer keeps counting.'}</p>{exitError&&<p role="alert">{exitError}</p>}<button className="button primary full" data-confirm-action aria-keyshortcuts="Enter" disabled={exiting||!exitReady} onClick={confirmExit}>{exiting?(exitAction.type==='signout'?'Signing out…':'Saving…'):exitAction.type==='signout'?'Sign out':'Confirm save & quit'}</button>{exitError&&localQuitAvailable&&exitAction.type==='quit'&&<button className="button secondary full" disabled={exiting} onClick={quitLocally}>Quit with local save</button>}<button className="button secondary full" disabled={exiting} onClick={cancelExit}>Stay here</button></Modal>}
    {resetOpen&&<Modal title="Reset game progress?" onClose={cancelReset} confirmOnEnter><p>Reset your progress and saved scores? You will return to Level 1 with zero points.</p>{resetError&&<p role="alert">{resetError}</p>}<button className="button full danger" data-confirm-action aria-keyshortcuts="Enter" disabled={resetting} onClick={resetProgress}>{resetting?'Resetting…':'Reset progress'}</button><button className="button secondary full" disabled={resetting} onClick={cancelReset}>Keep my progress</button></Modal>}
  </div>;
}
function Home({user,loaded,run,savedRuns,start,resume,profileName,scoreRefresh}) {
  const [difficulty,setDifficulty]=useState(run?.difficulty||'easy'),[confirm,setConfirm]=useState(false);
  const mode=difficulties[difficulty],savedRun=user&&loaded&&savedRuns[difficulty],completedRun=savedRun&&savedRun.phase==='complete';
  return <main className="home home-menu" aria-label="Main menu">
    <section className="menu-identity"><img className="menu-logo" src="./game-artwork.png" alt="Clear & Conquer game logo"/><div><h1>Clear <em>&</em> Conquer</h1><p className="intro">One wipe, more guess — less stress, more success.</p></div></section>
    <div className="menu-layout"><section className="panel menu-controls" aria-labelledby="difficulty-heading">
      <h2 id="difficulty-heading">Choose your difficulty</h2>
      <div className="difficulty-grid" role="group" aria-label="Game difficulty">{Object.entries(difficulties).map(([key,d])=><button key={key} className={'difficulty '+(difficulty===key?'selected':'')} style={{'--mode':d.color}} onClick={()=>setDifficulty(key)} onFocus={()=>setDifficulty(key)} aria-pressed={difficulty===key} aria-labelledby={`difficulty-${key}`} aria-describedby={`difficulty-details-${key}`}><strong id={`difficulty-${key}`}>{d.label}</strong><span className="difficulty-details" id={`difficulty-details-${key}`}><span>{d.seconds} seconds</span><span>{d.multiplier}× points</span></span></button>)}</div>
      <div className="menu-play-actions"><button disabled={!loaded} className="button primary" onClick={()=>savedRun&&savedRun.phase!=='complete'?setConfirm(true):start(difficulty)}>Play {mode.label} <ArrowRight size={17}/></button>{savedRun&&<button className="button secondary" onClick={()=>resume(difficulty)}>{completedRun?'View results':'Resume'}</button>}</div>
      <p className="menu-resume-note" aria-hidden={!savedRun||undefined}>{savedRun&&<>{completedRun?'Completed':'Saved'} {difficulties[savedRun.difficulty].label} · {!completedRun&&<>clue {savedRun.index+1}/{savedRun.order.length} · </>}{savedRun.score.toLocaleString()} pts</>}</p>
    </section>
    <Leaderboard key={difficulty} difficulty={difficulty} refresh={profileName+':'+scoreRefresh}/></div>
    {confirm&&<Modal title="Start a fresh run?" onClose={()=>setConfirm(false)} confirmOnEnter><p>This replaces your unfinished {mode.label} run. Saved runs in other difficulties and your leaderboard scores stay saved.</p><button className="button primary full" data-confirm-action aria-keyshortcuts="Enter" onClick={()=>{setConfirm(false);start(difficulty);}}>Start new run</button><button className="button secondary full" onClick={()=>setConfirm(false)}>Keep current run</button></Modal>}
  </main>;
}
function CompletionPreview({user,playerName}){
  const [run]=useState(()=>({...newRun(levels,'easy'),phase:'complete',score:0,correct:0}));
  return <><p className="small muted completion-preview-note" role="status">Completion screen preview · sample results · score saving disabled.</p><Game user={user?{...user,name:playerName}:{name:'Player'}} run={run} update={()=>{}} onQuit={()=>{}} preview/></>;
}
function Game({user,run,update,onQuit,preview=false}) {
  const guessInput=useRef(null);
  const [guess,setGuess]=useState(''),[feedback,setFeedback]=useState(''),[scoreStatus,setScoreStatus]=useState(''),[saving,setSaving]=useState(false),[refresh,setRefresh]=useState(0);
  const level=levels.find(l=>l.id===run.order[run.index]), d=difficulties[run.difficulty];
  const revealed=run.phase==='playing'&&run.brushing.active?run.brushing.stroke.length/TOTAL_CELLS*100:0;
  const brushLimitPercent=STROKE_LIMIT/TOTAL_CELLS*100;
  const remainingAttempts=d.attempts-run.brushing.used;
  useEffect(()=>{if(run.phase==='playing'&&run.remaining>0&&run.remaining<=5)audio.effect('warning');if(run.phase==='answered'&&run.outcome==='timeout')audio.effect('timeout');},[run.remaining,run.phase]);
  useEffect(()=>{
    if(run.phase!=='playing'||!run.deadline)return;
    const tick=()=>update(r=>{
      if(!r||r.phase!=='playing'||!r.deadline)return r;
      const remaining=Math.max(0,Math.ceil((r.deadline-Date.now())/1000));
      return remaining===0?{...recordScoreAnswer(r,null,0),remaining:0,phase:'answered',outcome:'timeout',earned:0,deadline:null}:remaining!==r.remaining?{...r,remaining}:r;
    });
    tick();const timer=setInterval(tick,250);return()=>clearInterval(timer);
  },[run.phase,run.deadline]);
  useEffect(()=>{setGuess('');setFeedback('');},[run.index]);
  function answer(e) {
    e.preventDefault();if(!guess.length||run.phase!=='playing')return;
    const secondsRemaining=run.deadline?Math.max(0,(run.deadline-Date.now())/1000):run.remaining;
    const remaining=Math.ceil(secondsRemaining);
    if(remaining===0){update(r=>r.phase==='playing'?{...recordScoreAnswer(r,null,0),phase:'answered',outcome:'timeout',earned:0,remaining:0,deadline:null}:r);return;}
    if(matches(level,guess)){
      const earned=points(secondsRemaining,run.difficulty);
      audio.effect('correct');
      update(r=>r.phase==='playing'&&r.order[r.index]===level.id?{...recordScoreAnswer(r,guess,secondsRemaining),phase:'answered',outcome:'correct',score:r.score+earned,correct:r.correct+1,earned,remaining,deadline:null}:r);
    }else{if(guessInput.current&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){guessInput.current.getAnimations().forEach(animation=>animation.cancel());guessInput.current.animate([{transform:'translateX(0)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(-2px)'},{transform:'translateX(0)'}],{duration:240,easing:'ease-out'});}audio.effect('wrong');update(r=>r.phase==='playing'&&r.order[r.index]===level.id?{...recordScoreAnswer(r,guess,secondsRemaining),score:Math.max(0,r.score-100)}:r);setFeedback(`Incorrect — match the exact spelling, case, spaces and punctuation. Format: ${answerPattern(level.answer)}. −100 points (minimum score: 0).`);}
  }
  function next() {update(r=>r.index+1===r.order.length?{...r,phase:'complete',deadline:null}:{...r,index:r.index+1,phase:'playing',brushing:emptyBrush(),remaining:d.seconds,deadline:Date.now()+d.seconds*1000});}
  async function publish() {setSaving(true);try{await submitScore(user,run);setScoreStatus('Score saved!');setRefresh(n=>n+1);}catch(e){setScoreStatus(e.message);}finally{setSaving(false);}}
  if(run.phase==='complete')return <main className="results play-results" style={{'--mode':d.color}}><div className="panel result"><div className="completion-award"><CompletionAward difficulty={run.difficulty} playerName={user.name||'Player'}/></div><div className="completion-score"><p className="big-score">{run.score.toLocaleString()} <small>points</small></p><p>{run.correct} correct out of {run.order.length} clues · {d.label}</p></div><div className="completion-actions"><button disabled={preview||saving||scoreStatus==='Score saved!'} className="button primary" onClick={publish}>{saving?'Saving…':'Save leaderboard score'}</button><Link to="/home" className="button secondary">Choose another category</Link></div><p className="completion-save-status" role="status">{scoreStatus}</p></div>{preview?<section className="panel leaderboard"><h2>{d.label} leaderboard</h2><p className="small muted">Preview only. No leaderboard score is submitted.</p></section>:<Leaderboard key={user.name} difficulty={run.difficulty} refresh={refresh}/>}</main>;
  return <main className="game" style={{'--mode':d.color}}><header className="game-heading"><div className="game-heading-identity"><img className="game-mark" src="./game-artwork.png" alt="Clear & Conquer game logo"/><div><span className="eyebrow">CLUE {String(run.index+1).padStart(2,'0')} / {run.order.length}</span><h1>What do you see?</h1></div></div><div className="game-heading-actions"><span className="mode-pill">{d.label} · {d.multiplier}×</span><button type="button" className="button secondary quit-game" aria-haspopup="dialog" onClick={onQuit}>Save & quit</button></div></header>
    <div className="game-grid"><section className="play-visual" aria-label="Visual clue and brushing controls"><div className="panel clue-panel"><div className="hud"><div><Clock size={17}/><strong className={run.remaining<10?'urgent':''}>{Math.ceil(run.remaining)}s</strong><span>remaining</span></div><div className="reveal-hud"><div className="reveal-readout"><Eraser size={17}/><strong>{revealed.toFixed(1)}%</strong><span>revealed</span></div><progress className="brush-usage" aria-label="Brush usage for current attempt" aria-valuetext={`${revealed.toFixed(1)}% of ${brushLimitPercent}% maximum per attempt`} value={revealed} max={brushLimitPercent}/></div><div><Trophy size={17}/><strong>{run.score.toLocaleString()}</strong><span>points</span></div></div>
      <div className={'attempt-hud '+(remainingAttempts===0?'urgent':'')} role="status"><strong data-testid="attempts">{remainingAttempts}</strong> / {d.attempts} brushes left <span>7% per stroke · covers after 2s</span></div>
      <ScratchCanvas key={level.id} image={level.image} saved={run.brushing} attempts={d.attempts} brush={d.brush} disabled={run.phase!=='playing'} audio={audio} onChange={brushing=>update(r=>r.phase==='playing'?{...r,brushing}:r)}/>
      </div>
      <p className="stage-hint"><strong>Hint:</strong> {level.hint}</p>
    </section><aside className="game-answer-area" aria-label="Answer and round information">
      {run.phase==='playing'?<form className="panel guess-form answer-panel" onSubmit={answer}><span className="eyebrow">{level.category}</span><label htmlFor="guess">Your best guess</label><p className="game-prompt muted">Brush a little, look closely, then name the object or concept.</p><div className="guess-controls"><input ref={guessInput} id="guess" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-describedby="answer-rules guess-feedback" aria-invalid={Boolean(feedback)} value={guess} onChange={e=>{setGuess(e.target.value);setFeedback('');}} placeholder="Type the exact answer…" maxLength="100" required/><button className="button primary full">Guess <ArrowRight size={18}/></button></div><p id="guess-feedback" className="small guess-feedback" role="status">{feedback}</p><p className="small muted game-mode-note">{d.seconds} seconds · {d.multiplier}× points</p></form>:<section className={"panel fact answer-panel"+(run.outcome==='correct'?' correct-answer':'')} aria-label="Round result">
        <span className="eyebrow round-outcome">{run.outcome==='correct'&&<CheckCircle2 className="correct-check" size={18} aria-hidden="true"/>}{run.outcome==='correct'?'NICELY SPOTTED!':'TIME’S UP — A NEW THING LEARNED'}</span>
        <p className={'round-points'+(run.outcome==='correct'?'':' is-timeout')} role="status"><strong>{run.outcome==='correct'?'+'+(run.earned??0).toLocaleString():'0'}</strong><span>points earned this round</span></p>
        <p className="round-total">Total score: <strong>{run.score.toLocaleString()}</strong> points</p>
        <h2>{level.answer}</h2><h3>Did you know?</h3><p>{level.fact}</p><a href={level.source} target="_blank" rel="noreferrer">Explore this concept ↗</a><button className="button primary full" onClick={next}>{run.index+1===run.order.length?'See your results':'Next discovery'} <ArrowRight size={18}/></button>
      </section>}
      <div className="game-notes"><p>Scratch with mouse or touch. Hold and release Space on the image to brush with the keyboard.</p><p id="answer-rules" className="answer-rules"><strong>Exact match only:</strong> use the official spelling, capitalization, spaces and punctuation. No synonyms or variations.<span>Required format: <code>{answerPattern(level.answer)}</code> <small>(A = uppercase, a = lowercase, 0 = digit)</small></span></p></div>
    </aside></div>
  </main>;
}
