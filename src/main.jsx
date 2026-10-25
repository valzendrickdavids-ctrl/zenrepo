import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { supabase } from './lib/supabase.js';
import { finishAuthCallback } from './lib/authFlow.js';
import './index.css';
import './simple-theme.css';
import './experience.css';
async function boot() {
  const url = window.location.href;
  let initialNotice = '';
  const callback = await finishAuthCallback(supabase,url);
  if(callback){
    initialNotice=callback.notice;
    window.history.replaceState(null,'',callback.notice?callback.path:callback.path.replace(/#\/$/,'#/tutorial'));
  }
  createRoot(document.getElementById('root')).render(<HashRouter><App initialNotice={initialNotice}/></HashRouter>);
}
boot();

