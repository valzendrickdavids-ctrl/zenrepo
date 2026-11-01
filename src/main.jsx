import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import {supabase} from './lib/supabase.js';
import {finishGoogleSignIn} from './lib/googleAuth.js';
import './index.css';
import './simple-theme.css';
import './experience.css';
import './motion.css';
import './ambient.css';
async function boot(){
  const notice=await finishGoogleSignIn(supabase,window.location.href,url=>window.history.replaceState(null,'',url));
  createRoot(document.getElementById('root')).render(<HashRouter><App initialNotice={notice}/></HashRouter>);
}
boot();

