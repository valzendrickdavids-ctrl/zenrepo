import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowRight, Trophy, Clock, Eraser, Sun, Moon, Settings } from 'lucide-react';
import { supabase, config } from './lib/supabase.js';
import { difficulties, newRun, validRun, matches, points } from './lib/engine.js';
import { cacheRun, loadRun, readLocal, writeLocal, saveCloud, submitScore } from './lib/storage.js';
import { levels, poolCounts } from './data/levels.js';
import ScratchCanvas from './components/PrecisionCanvas.jsx';
import { emptyBrush, TOTAL_CELLS } from './lib/brushEngine.js';
import { audio } from './lib/audio.js';
import Leaderboard from './components/Leaderboard.jsx';
import Modal from './components/Modal.jsx';
import { startGoogleLogin } from './lib/google.js';
import { notifyLogin } from './lib/loginNotification.js';
import {normalizeUsername,signInWithUsername} from './lib/username.js';
import PlayerProfile, {PlayerAvatar} from './components/PlayerProfile.jsx';
import {loadPlayerProfile,savePlayerProfile} from './lib/playerProfile.js';
import {GameIdentity,StartScreen,Tutorial,CompletionAward,Feedback} from './components/Experience.jsx';
import {pausedRun,tutorialKey} from './lib/experience.js';

export default function App({initialNotice=''}) {
  const navigate=useNavigate();
  const [profile,setProfile]=useState(null),[profileOpen,setProfileOpen]=useState(false);
  const [profileLoading,setProfileLoading]=useState(false),[profileError,setProfileError]=useState('');
  const [profileRevision,setProfileRevision]=useState(0),[onboarding,setOnboarding]=useState(false),[welcome,setWelcome]=useState('');
  const welcomed=useRef(null);
  const location=useLocation();
  const [tutorialRevision,setTutorialRevision]=useState(0),[feedbackOpen,setFeedbackOpen]=useState(false),[tutorialUser,setTutorialUser]=useState(null);
  const [exitAction,setExitAction]=useState(null),[exiting,setExiting]=useState(false),[exitError,setExitError]=useState('');
  const exitBusy=useRef(false),allowLeave=useRef(false),previousPath=useRef(location.pathname);
  const [sound,setSound]=useState(()=>readLocal('cc-sound',true));
  const [music,setMusic]=useState(()=>readLocal('cc-music',false));
  const [resetting,setResetting]=useState(false);
  const resettingRef=useRef(false);
  const [user,setUser]=useState(null),[ready,setReady]=useState(!supabase),[loaded,setLoaded]=useState(false);
  const [loginSession,setLoginSession]=useState(null);
  const [run,setRun]=useState(null),[notice,setNotice]=useState(initialNotice),[settings,setSettings]=useState(false);
  const [theme,setTheme]=useState(()=>readLocal('cc-theme','light'));
  const latest=useRef(null),saveQueue=useRef(Promise.resolve());
  const activeUserId=useRef(user?.id);activeUserId.current=user?.id;
  const tutorialDone=Boolean(user&&(tutorialUser===user.id||readLocal(tutorialKey(user.id),false)));
  function finishTutorial(){writeLocal(tutorialKey(user.id),true);setTutorialUser(user.id);setTutorialRevision(n=>n+1);navigate('/home');}
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
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{authEvent=true;if(active){setUser(session?.user||null);setReady(true);if(event==='SIGNED_IN'||event==='INITIAL_SESSION')setLoginSession(session);if(event==='SIGNED_OUT')setLoginSession(null);}});
    return()=>{active=false;subscription.unsubscribe();};
  },[]);
  useEffect(()=>{
    if(!loginSession)return;
    let active=true;
    notifyLogin(supabase,loginSession).then(result=>{
      if(!active)return;
      if(result==='sent')setNotice('Sign-in successful. A login notification was sent to your account email.');
      if(result==='unavailable')setNotice('You are signed in, but the login-notification email could not be sent. Please contact the game owner.');
    });
    return()=>{active=false;};
  },[loginSession]);
  useEffect(()=>{
    let active=true;setLoaded(false);setRun(null);latest.current=null;
    if(!user){setLoaded(true);return;}
    loadRun(user).then(saved=>{if(active){setRun(validRun(saved,levels)?saved:null);setLoaded(true);}}).catch(e=>{
      if(active){const saved=readLocal('cc-run-'+user.id);setRun(validRun(saved,levels)?saved:null);setNotice(e.message);setLoaded(true);}
    });
    return()=>{active=false;};
  },[user?.id]);
  useEffect(()=>{
    let active=true;
    setProfile(null);setProfileError('');setOnboarding(false);setWelcome('');
    if(!user){setProfileLoading(false);welcomed.current=null;return;}
    setProfileLoading(true);
    loadPlayerProfile(user).then(data=>{
      if(!active)return;
      setProfile(data);setProfileLoading(false);
      const isNew=!data.onboarding_complete;
      if(welcomed.current!==user.id){
        setWelcome(isNew?'Welcome to Clear & Conquer! Your first discovery starts here.':`Welcome back, ${data.display_name}! Ready for another discovery?`);
        welcomed.current=user.id;
      }
      setOnboarding(isNew);if(isNew)setProfileOpen(false);
    }).catch(e=>{if(active){setProfileError(e.message);setProfileLoading(false);}});
    return()=>{active=false;};
  },[user?.id,profileRevision]);
  async function saveProfile(input){
    const accountId=user.id;
    const saved=await savePlayerProfile(user,input);
    if(activeUserId.current!==accountId)return;
    setProfile(saved);
    if(onboarding){setOnboarding(false);setWelcome(`Welcome, ${saved.display_name}! Let’s uncover something.`);}
  }
  function openSettings(){setProfileOpen(false);setSettings(true);}
  function closeSettings(){setSettings(false);setProfileOpen(!['/','/auth'].includes(location.pathname));}
  function sync(u,r) {
    if(resettingRef.current)return;
    saveQueue.current=saveQueue.current.catch(()=>{}).then(()=>saveCloud(u,r)).catch(e=>setNotice(e.message));
  }
  useEffect(()=>{
    latest.current=run;
    if(!run||!user||!loaded)return;
    if(!cacheRun(user,run))setNotice('Device storage is unavailable. Progress may not survive closing this tab.');
  },[run,user?.id,loaded]);
  useEffect(()=>{
    if(!user||!loaded)return;
    let lastSaved=0;
    const timer=setInterval(()=>{const r=latest.current;if(r&&r.updatedAt!==lastSaved){lastSaved=r.updatedAt;sync(user,r);}},3000);
    return()=>clearInterval(timer);
  },[user?.id,loaded]);
  useEffect(()=>{
    const save=()=>{if(user&&latest.current)cacheRun(user,latest.current);};
    window.addEventListener('pagehide',save);return()=>window.removeEventListener('pagehide',save);
  },[user?.id]);
  const update=fn=>setRun(prev=>{const next=fn(prev);return next===prev?prev:next?{...next,updatedAt:Date.now()}:next;});
  function start(difficulty) {
    if(!tutorialDone){navigate('/tutorial');return;}
    const next=newRun(levels,difficulty);next.deadline=Date.now()+next.remaining*1000;setRun(next);navigate('/play');
  }
  function resume() {
    update(r=>({...r,deadline:r.phase==='playing'?(r.deadline??Date.now()+r.remaining*1000):null}));navigate('/play');
  }
  function quit() {
    setSettings(false);setProfileOpen(false);setExitError('');setExitAction({type:'quit'});
  }
  function signOut(){setProfileOpen(false);setExitError('');setExitAction({type:'signout'});}
  async function confirmExit(){
    if(exitBusy.current)return;exitBusy.current=true;setExiting(true);setExitError('');
    try{
      const next=pausedRun(latest.current);
      if(next){setRun(next);latest.current=next;if(!cacheRun(user,next))throw Error('Device save failed. Please retry before leaving.');sync(user,next);await saveQueue.current;}
      if(exitAction.type==='signout'){
        if(!user.demo){const {error}=await supabase.auth.signOut();if(error)throw Error('Sign out failed. Please retry.');}
        setUser(null);setRun(null);latest.current=null;setProfileOpen(false);setSettings(false);setOnboarding(false);setWelcome('');
      }
      allowLeave.current=true;setExitAction(null);navigate(exitAction.type==='signout'?'/':'/home');
    }catch(e){setExitError(e.message||'Could not finish. Please retry.');}
    finally{exitBusy.current=false;setExiting(false);}
  }
  function cancelExit(){if(exiting)return;setExitAction(null);setExitError('');if(location.pathname==='/play')update(r=>r?.phase==='playing'&&!r.deadline?{...r,deadline:Date.now()+r.remaining*1000}:r);}
  async function resetProgress() {
    if(!user||resettingRef.current||!window.confirm('Reset your progress and saved scores? You will return to Level 1 with zero points.'))return;
    resettingRef.current=true;setResetting(true);audio.stopScratch();
    try{
      await saveQueue.current;
      if(!user.demo){const {error}=await supabase.rpc('reset_my_game');if(error)throw Error('Reset failed. Run the updated supabase.sql and try again.');}
      if(user.demo)localStorage.removeItem('cc-demo-scores');
      localStorage.removeItem('cc-run-'+user.id);
      const fresh=newRun(levels,run?.difficulty||'easy');
      latest.current=fresh;cacheRun(user,fresh);setRun(fresh);
      if(!user.demo)await saveCloud(user,fresh);
      setSettings(false);allowLeave.current=true;navigate('/home');setNotice('Progress reset. Resume to begin Level 1 with zero points.');
    }catch(e){setNotice(e.message||'Reset could not finish. Please try again.');}
    finally{resettingRef.current=false;setResetting(false);}
  }
  if(!ready)return <main className="loading">Opening Clear & Conquer…</main>;
  return <div className="app-shell">
    <header className="header"><span aria-hidden="true"/>
      {['/','/auth'].includes(location.pathname)?<button className="profile-trigger" aria-label="Open game settings" onClick={openSettings}><span className="player-avatar" aria-hidden="true"><Settings size={23}/></span><span>Settings</span></button>:<button className="profile-trigger" aria-label={user?'Open your profile':'Open profile menu'} onClick={()=>setProfileOpen(true)}>
        <PlayerAvatar user={user} profile={profile}/><span>{profile?.display_name||'Profile'}</span>
      </button>}</header>
    {user&&welcome&&<div className="notice welcome-banner" role="status">{welcome}<button aria-label="Dismiss welcome" onClick={()=>setWelcome('')}>×</button></div>}
    {notice&&<div className="notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss message">×</button></div>}
    <Routes>
      <Route path="/" element={<StartScreen user={user} continueTo={user?(tutorialDone?'/home':'/tutorial'):'/auth'}/>}/>
      <Route path="/tutorial" element={!user?<Navigate to="/auth" replace/>:<Tutorial key={user.id+':'+tutorialRevision} onFinish={finishTutorial}/>}/>
      <Route path="/home" element={!user?<Navigate to="/auth" replace/>:!tutorialDone?<Navigate to="/tutorial" replace/>:<Home profileName={profile?.display_name} user={user} loaded={loaded&&!profileLoading&&!onboarding} run={run} start={start} resume={resume}/>}/>
      <Route path="/auth" element={user?<Navigate to="/tutorial" replace/>:<Auth onDemo={()=>{setUser({id:'local-demo',name:'Demo player',demo:true});navigate('/tutorial');}}/>}/>
      <Route path="/play" element={!user?<Navigate to="/auth" replace/>:!tutorialDone?<Navigate to="/tutorial" replace/>:resetting?<main className="loading">Resetting progress…</main>:(!loaded||profileLoading)?<main className="loading">Loading your progress…</main>:run?<Game key={run.id} user={{...user,name:profile?.display_name||user.name}} run={run} update={update} onQuit={quit}/>:<Navigate to="/home" replace/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
    <footer>{['/','/home'].includes(location.pathname)?'Scratch the image. Guess the concept.':'One wipe, more guess — less stress, more success.'}</footer>
    {(profileOpen||(onboarding&&location.pathname==='/home'&&!exitAction&&!feedbackOpen&&!settings))&&<PlayerProfile key={String(user?.id)+':'+profileLoading+':'+onboarding} user={user} profile={profile} loading={profileLoading} error={profileError} onboarding={onboarding&&location.pathname==='/home'} onRetry={()=>setProfileRevision(n=>n+1)} onSave={saveProfile} onSkip={()=>saveProfile(profile)} onClose={()=>setProfileOpen(false)} onSettings={openSettings} onSignOut={signOut}/>}
    {settings&&<Modal title="Game settings" onClose={closeSettings}><p className="muted">Adjust audio, appearance, and saved progress.</p><button className="button secondary full" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>} Switch to {theme==='dark'?'light':'dark'} mode</button>
      <button className="button secondary full" role="switch" aria-checked={sound} onClick={()=>setSound(!sound)}>Sound effects: {sound?'On':'Off'}</button>
      <button className="button secondary full" role="switch" aria-checked={music} onClick={()=>setMusic(!music)}>Background music: {music?'On':'Off'}</button>
      {user&&location.pathname!=='/play'&&<button className="button secondary full" onClick={()=>{setSettings(false);navigate('/tutorial');}}>How to play</button>}
      <button className="button secondary full" onClick={()=>{setSettings(false);setFeedbackOpen(true);}}>Feedback & reports</button>
      {user&&<button className="button full danger" disabled={resetting} onClick={resetProgress}>{resetting?'Resetting…':'Reset game progress'}</button>}
      {user&&run&&location.pathname==='/play'&&<button className="button full" disabled={resetting} onClick={quit}>Save & quit to home</button>}
      <p className="small muted">Your run timer keeps counting while settings are open.</p></Modal>}
    {feedbackOpen&&<Feedback user={user} onClose={()=>{setFeedbackOpen(false);setSettings(true);}}/>}
    {exitAction&&<Modal title={exitAction.type==='signout'?'Sign out of your account?':'Quit this game?'} onClose={cancelExit}><p>Your current progress will be saved on this device and synced when possible. The timer pauses when you confirm. {exitAction.type==='signout'?'You will return to the start screen.':'You can resume from the difficulty screen.'}</p><p className="small muted">Until you confirm, an active round’s timer keeps counting.</p>{exitError&&<p role="alert">{exitError}</p>}<button className="button primary full" disabled={exiting} onClick={confirmExit}>{exiting?'Saving…':exitAction.type==='signout'?'Save & sign out':'Save & quit'}</button><button className="button secondary full" disabled={exiting} onClick={cancelExit}>Stay here</button></Modal>}
  </div>;
}
function Home({user,loaded,run,start,resume,demo,profileName}) {
  const [difficulty,setDifficulty]=useState('easy'),[confirm,setConfirm]=useState(false);
  return <main className="home">
    <GameIdentity tagline="One wipe, more guess — less stress, more success."/>
    <div className="home-grid"><section className="panel challenge"><h2>Choose your difficulty</h2>
      <div className="difficulty-grid">{Object.entries(difficulties).map(([key,d])=><button key={key} className={'difficulty '+(difficulty===key?'selected':'')} style={{'--mode':d.color}} onClick={()=>setDifficulty(key)} onFocus={()=>setDifficulty(key)} aria-pressed={difficulty===key}><strong>{d.label}</strong><span>{d.seconds} seconds · {d.multiplier}× points</span><span>{d.attempts} brushes · {poolCounts[key]} clues</span></button>)}</div>
      {user?<><button disabled={!loaded} className="button primary full" onClick={()=>run&&run.phase!=='complete'?setConfirm(true):start(difficulty)}>Let’s uncover something <ArrowRight size={19}/></button><p className="small muted">{user.demo?'Local demo • progress and scores stay in this browser.':'Signed in • progress syncs to your account.'}</p></>:<><Link className="button primary full" to="/auth">Sign in to play <ArrowRight size={19}/></Link><button className="text-button" onClick={demo}>Try the local demo first</button></>}
      {user&&loaded&&run&&run.phase!=='complete'&&<div className="resume row spread"><div><strong>Continue where you left off</strong><p className="small muted">Clue {run.index+1} of {run.order.length} · {run.score.toLocaleString()} points</p></div><button className="button secondary" onClick={resume}>Resume</button></div>}
    </section></div>
    <Leaderboard key={difficulty} demo={!user||user.demo} difficulty={difficulty} refresh={profileName}/>

    {confirm&&<Modal title="Start a fresh run?" onClose={()=>setConfirm(false)}><p>This replaces your unfinished run. Your previous completed scores stay saved.</p><button className="button primary full" onClick={()=>{setConfirm(false);start(difficulty);}}>Start new run</button><button className="button secondary full" onClick={()=>setConfirm(false)}>Keep current run</button></Modal>}
  </main>;
}
function Auth({onDemo}) {
  const [username,setUsername]=useState(''),[legacyEmail,setLegacyEmail]=useState(false);
  const [signup,setSignup]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function googleLogin() {
    setBusy(true);setMessage('');
    try { await startGoogleLogin(supabase,window.location.href,config); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Google sign-in is unavailable. Check your connection and Google provider setup, or use email sign-in.'); }
    finally { setBusy(false); }
  }
  async function submit(e) {
    e.preventDefault();if(!supabase)return;setBusy(true);setMessage('');
    try {
      const result=signup?await supabase.auth.signUp({email,password,options:{data:{display_name:name.trim()||'Player',username:normalizeUsername(username)}}})
        :legacyEmail?await supabase.auth.signInWithPassword({email,password})
        :await signInWithUsername(supabase,username,password);
      if(result.error)throw result.error;
      if(signup&&!result.data.session)setMessage('Check your email to confirm your account, then sign in.');
    } catch {setMessage(signup?'Account could not be created. Try a different username and check your email, password and connection.':'Sign in failed. Check your '+(legacyEmail?'email':'username')+', password and email confirmation, or try again later.');}
    finally {setBusy(false);}
  }
  return <main className="auth-wrap"><section className="panel auth"><span className="eyebrow">YOUR NEXT DISCOVERY STARTS HERE</span><h1>{signup?'Join the curious.':'Welcome back.'}</h1><p className="muted">Save your discoveries and climb the leaderboard.</p>
    {!config.valid&&<div className="notice" role="status">{config.message} See README.md for setup.</div>}
    <button className="button google-button full" disabled={busy||!supabase} onClick={googleLogin}>Continue with Google</button>
    {!supabase&&<p className="small muted">Google sign-in requires online account setup.</p>}
    <p className="auth-divider">or sign in with your {legacyEmail&&!signup?'email':'username'}</p>
    <form onSubmit={submit}>{signup&&<label>Display name (optional)<input value={name} onChange={e=>setName(e.target.value)} maxLength="30" autoComplete="nickname"/></label>}
    {(signup||!legacyEmail)&&<label>Username<input type="text" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" minLength={3} maxLength={24} pattern="[A-Za-z][A-Za-z0-9_]{2,23}" title="3–24 letters, numbers or underscores, starting with a letter." required/></label>}
    {(signup||legacyEmail)&&<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label>}
    {signup&&<p className="small muted">Your email stays private and is used for verification and login notifications.</p>}
    <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={signup?'new-password':'current-password'} minLength="8" required/></label>
    {message&&<p role="status">{message}</p>}<button disabled={busy||!supabase} className="button primary full">{busy?'Please wait…':signup?'Create account':'Sign in'}</button></form>
    <button className="text-button" onClick={()=>{setSignup(!signup);setMessage('');}}>{signup?'Already have an account? Sign in':'New here? Create an account'}</button>
    {!signup&&<button className="text-button" onClick={()=>{setLegacyEmail(!legacyEmail);setMessage('');}}>{legacyEmail?'Use my username instead':'Existing account without a username? Use email'}</button>}
    <button className="button secondary full" onClick={onDemo}>Play local demo</button><Link className="text-button" to="/">Return home</Link></section></main>;
}
function Game({user,run,update,onQuit}) {
  const [guess,setGuess]=useState(''),[feedback,setFeedback]=useState(''),[scoreStatus,setScoreStatus]=useState(''),[saving,setSaving]=useState(false),[refresh,setRefresh]=useState(0);
  const level=levels.find(l=>l.id===run.order[run.index]), d=difficulties[run.difficulty];
  const revealed=run.phase==='playing'&&run.brushing.active?run.brushing.stroke.length/TOTAL_CELLS*100:0;
  const scoreCoverage=run.brushing.seen.length/TOTAL_CELLS*100;
  const remainingAttempts=d.attempts-run.brushing.used;
  useEffect(()=>{if(run.phase==='playing'&&run.remaining>0&&run.remaining<=5)audio.effect('warning');if(run.phase==='answered'&&run.outcome==='timeout')audio.effect('timeout');},[run.remaining,run.phase]);
  useEffect(()=>{
    if(run.phase!=='playing'||!run.deadline)return;
    const tick=()=>update(r=>{
      if(!r||r.phase!=='playing'||!r.deadline)return r;
      const remaining=Math.max(0,Math.ceil((r.deadline-Date.now())/1000));
      return remaining===0?{...r,remaining:0,phase:'answered',outcome:'timeout',earned:0,deadline:null}:remaining!==r.remaining?{...r,remaining}:r;
    });
    tick();const timer=setInterval(tick,250);return()=>clearInterval(timer);
  },[run.phase,run.deadline]);
  useEffect(()=>{setGuess('');setFeedback('');},[run.index]);
  function answer(e) {
    e.preventDefault();if(!guess.trim()||run.phase!=='playing')return;
    const remaining=run.deadline?Math.max(0,Math.ceil((run.deadline-Date.now())/1000)):run.remaining;
    if(remaining===0){update(r=>({...r,phase:'answered',outcome:'timeout',earned:0,remaining:0,deadline:null}));return;}
    if(matches(level,guess)){
      const earned=points(scoreCoverage,remaining,run.difficulty);
      audio.effect('correct');
      update(r=>({...r,phase:'answered',outcome:'correct',score:r.score+earned,correct:r.correct+1,earned,remaining,deadline:null}));
    }else{audio.effect('wrong');update(r=>({...r,score:Math.max(0,r.score-100)}));setFeedback('Not quite — try again. −100 points (minimum score: 0).');}
  }
  function next() {update(r=>r.index+1===r.order.length?{...r,phase:'complete',deadline:null}:{...r,index:r.index+1,phase:'playing',brushing:emptyBrush(),remaining:d.seconds,deadline:Date.now()+d.seconds*1000});}
  async function publish() {setSaving(true);try{await submitScore(user,run);setScoreStatus('Score saved!');setRefresh(n=>n+1);}catch(e){setScoreStatus(e.message);}finally{setSaving(false);}}
  if(run.phase==='complete')return <main className="results"><div className="panel result"><CompletionAward difficulty={run.difficulty}/><p className="big-score">{run.score.toLocaleString()} <small>points</small></p><p>{run.correct} correct out of {run.order.length} clues · {d.label}</p><button disabled={saving||scoreStatus==='Score saved!'} className="button primary" onClick={publish}>{saving?'Saving…':'Save leaderboard score'}</button><p role="status">{scoreStatus}</p><Link to="/home" className="button secondary">Choose another category</Link></div><Leaderboard key={user.name} demo={user.demo} difficulty={run.difficulty} refresh={refresh}/></main>;
  return <main className="game"><div className="row spread"><div><span className="eyebrow">CLUE {String(run.index+1).padStart(2,'0')} / {run.order.length}</span><h1>What do you see?</h1></div><span className="mode-pill" style={{color:d.color,borderColor:d.color}}>{d.label} · {d.multiplier}×</span></div><button className="button secondary quit-game" onClick={onQuit}>Save & quit</button>
    <div className="game-grid"><section><div className="hud"><div><Clock size={17}/><strong className={run.remaining<10?'urgent':''}>{run.remaining}s</strong><span>remaining</span></div><div><Eraser size={17}/><strong>{revealed.toFixed(1)}%</strong><span>revealed</span></div><div><Trophy size={17}/><strong>{run.score.toLocaleString()}</strong><span>points</span></div></div>
      <div className={'attempt-hud '+(remainingAttempts===0?'urgent':'')} role="status"><strong data-testid="attempts">{remainingAttempts}</strong> / {d.attempts} brushes left <span>7% per stroke · covers after 2s</span></div>
      <ScratchCanvas key={level.id} image={level.image} saved={run.brushing} attempts={d.attempts} brush={d.brush} disabled={run.phase!=='playing'} audio={audio} onChange={brushing=>update(r=>r.phase==='playing'?{...r,brushing}:r)}/>
      <div className="board-caption"><span>{level.category}</span><span>Scratch with mouse or touch • Space reveals a patch</span></div>
      {run.phase==='playing'?<form className="guess-form" onSubmit={answer}><label htmlFor="guess">Your best guess</label><div className="row"><input id="guess" autoComplete="off" value={guess} onChange={e=>setGuess(e.target.value)} placeholder="Name the object or concept…" maxLength="100" required/><button className="button primary">Guess <ArrowRight size={18}/></button></div><p className="small" role="status">{feedback}</p></form>:<section className="panel fact"><span className="eyebrow">{run.outcome==='correct'?'NICELY SPOTTED! +'+run.earned+' POINTS':'TIME’S UP — A NEW THING LEARNED'}</span><h2>{level.answer}</h2><h3>Did you know?</h3><p>{level.fact}</p><a href={level.source} target="_blank" rel="noreferrer">Explore this concept ↗</a><button className="button primary full" onClick={next}>{run.index+1===run.order.length?'See your results':'Next discovery'} <ArrowRight size={18}/></button></section>}
    </section></div>
  </main>;
}
