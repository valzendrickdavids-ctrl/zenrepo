import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Trophy, Flame, Crown, Sprout} from 'lucide-react';
import Modal from './Modal.jsx';
import {difficulties} from '../lib/engine.js';
import {completionAwards,validateFeedback} from '../lib/experience.js';
import {supabase} from '../lib/supabase.js';

export function GameIdentity({tagline='Scratch the image. Guess the concept.'}){return <section className="hero"><img className="hero-logo" src="./game-artwork.png" alt="Clear & Conquer game logo"/><h1>Clear <em>&</em> Conquer</h1><p className="intro">{tagline}</p></section>;}
export function StartScreen({continueTo,ready=true,paused=false}){
 const navigate=useNavigate(),[elapsed,setElapsed]=useState(false);
 useEffect(()=>{const timer=setTimeout(()=>setElapsed(true),5000);return()=>clearTimeout(timer);},[]);
 useEffect(()=>{if(elapsed&&ready&&!paused)navigate(continueTo,{replace:true});},[elapsed,ready,paused,continueTo,navigate]);
 return <main className="home start-screen splash-screen" aria-busy="true">
  <GameIdentity tagline="One wipe, more guess — less stress, more success."/>
  <div className="splash-loader" role="status"><div className="splash-loader-track" aria-hidden="true"><span className="splash-loader-bar"/></div><p>Loading your next discovery…</p></div>
 </main>;
}
export function Tutorial({onFinish}){
 const [step,setStep]=useState(0);
 const lessons=[
  ['Choose your challenge','Each difficulty has its own clues and leaderboard. Try Beginner first.'],
  ['Scratch a little. Look closely.','Drag with a mouse or touch. Each stroke reveals at most 7% of the image. With a keyboard, hold and release Space on the image to reveal a patch.'],
  ['Release, remember, repeat','Release to reset the readout to 0%. The patch stays visible for 2 seconds, then is covered instantly. Brushing is locked while you wait; extra inputs use no attempts.'],
  ['Follow your difficulty’s answer rules','Beginner accepts synonyms, partial answers, abbreviations and extra spaces. Moderate accepts synonyms and partial answers, with single spaces and full names for abbreviation alternatives. Partial answers need at least 3 letters or digits. In both modes, capitalize the first word and preserve the remaining spelling/case; keep abbreviations uppercase. Expert requires the complete official answer, including exact capitalization, spaces and punctuation. Check the reminder below the brushing guide.'],
  ['Guess and earn points','Choose Guess to answer. More time remaining means more points: up to 1,000 for Beginner, 1,500 for Moderate, or 2,000 for Expert. Wrong guesses do not deduct points. The timer runs during recovery. You can still guess with no brushes left.'],
  ['Finish, celebrate, and save','Finish every clue, including missed ones, to earn a trophy. Save your leaderboard score at the end. Save & quit pauses your run; closing the tab does not pause the timer.'],
 ];
 return <main className="home tutorial"><section className="panel tutorial-card" aria-labelledby="tutorial-title">
  <span className="eyebrow">HOW TO PLAY · {step+1} OF {lessons.length}</span>
  <progress aria-label="Tutorial progress" value={step+1} max={lessons.length}/>
  <div className="tutorial-body"><h1 id="tutorial-title">{lessons[step][0]}</h1><p>{lessons[step][1]}</p>
   {step===0&&<div className="tutorial-modes">{Object.entries(difficulties).map(([key,d])=><div key={key} style={{borderColor:d.color}}><strong>{d.label}</strong><span>{d.seconds}s · {d.attempts} brushes · {d.multiplier}× points</span></div>)}</div>}
   {step===2&&<div className="recovery-example" aria-label="Recovery timeline"><span>Release</span><span>Wait 2 seconds</span><span>Instant cover</span></div>}
  </div>
  <div className="flow-actions">{step>0&&<button className="button secondary" onClick={()=>setStep(s=>s-1)}>Back</button>}<button className="button primary" onClick={()=>step===lessons.length-1?onFinish():setStep(s=>s+1)}>{step===lessons.length-1?'Choose difficulty':'Next'}</button></div>
 </section></main>;
}
export function CompletionAward({difficulty,playerName='Player'}){const award=completionAwards[difficulty],Icon=difficulty==='easy'?Sprout:difficulty==='medium'?Flame:Crown;return <><div className="completion-confetti" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{left:`${5+i*5.2}%`,'--confetti-turn':`${i%2?160:-160}deg`,'--confetti-delay':`${i%6*55}ms`,background:['#e3b74c','#c88ee4','#66b9ec','#e78ba2'][i%4]}}/>)}</div><div className={'completion-trophy '+difficulty} role="img" aria-label={`${difficulties[difficulty].label} ${award.title}`}><Trophy size={88} strokeWidth={1.5}/><Icon className="trophy-emblem" size={24}/></div><span className="eyebrow">{difficulties[difficulty].label.toUpperCase()} COMPLETE</span><h1>{award.title}</h1><p>{award.message}<span className="completion-thanks">Thank you for playing, {playerName}!</span></p></>;}
export function Feedback({user,onClose}){
 const [category,setCategory]=useState('Bug report'),[message,setMessage]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState(false);
 async function send(e){e.preventDefault();if(!user||!supabase)return;setStatus('');setBusy(true);try{const draft=validateFeedback(category,message);const {error}=await supabase.rpc('submit_player_feedback',{p_category:draft.category,p_message:draft.message});if(error)throw Error('Feedback could not be sent. Your text is still here. Check your connection or ask the owner to install the feedback database update.');setSent(true);setStatus('Thank you! Your feedback was saved for the game owner to review.');}catch(e){setStatus(e.message);}finally{setBusy(false);}}
 return <Modal title="Feedback & reports" onClose={()=>{if(!busy)onClose();}}><p>Found a problem or have an idea? Tell us what happened and what you expected. Do not include passwords or private information.</p><form onSubmit={send}><label>Feedback type<select value={category} disabled={busy||sent||!user} onChange={e=>setCategory(e.target.value)}><option>Bug report</option><option>Suggestion</option><option>Other</option></select></label><label>Your message<textarea rows={6} minLength={10} maxLength={2000} required disabled={busy||sent||!user} value={message} onChange={e=>setMessage(e.target.value)}/></label><p className="small muted">{message.length}/2000 · {user?'Stored with your account ID; visible only to you and the game owner.':'Sign in to send feedback to the game owner.'}</p><button className="button primary full" disabled={busy||sent||!user}>{busy?'Sending…':sent?'Feedback sent':'Send feedback'}</button></form><p role="status">{status}</p><button className="button secondary full" disabled={busy} onClick={onClose}>Back to settings</button></Modal>;
}
