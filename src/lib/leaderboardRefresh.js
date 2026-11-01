import {loadWithDeadline} from './loadDeadline.js';

export const LEADERBOARD_REFRESH_MS=10000;

// Only one request may run at a time. Hidden/offline pages wait for a wake event.
export function watchLeaderboard({load,onData,onError,page=document,host=window}) {
  let active=true,busy=false,controller=null;
  async function refresh() {
    if(!active||busy||page.hidden)return;
    if(host.navigator.onLine===false){onError(new Error('Offline. Scores will refresh when you reconnect.'));return;}
    busy=true;
    const request=new AbortController();controller=request;
    try {
      const data=await loadWithDeadline(signal=>{
        signal.addEventListener('abort',()=>request.abort(),{once:true});
        return load(request.signal);
      },{timeoutMessage:'Scores took too long to refresh. Retrying automatically.'});
      if(active)onData(data);
    } catch(error) {
      if(active)onError(error);
    } finally {
      busy=false;
      if(controller===request)controller=null;
    }
  }
  const wake=()=>{void refresh();};
  const interval=setInterval(wake,LEADERBOARD_REFRESH_MS);
  page.addEventListener('visibilitychange',wake);
  host.addEventListener('online',wake);
  host.addEventListener('offline',wake);
  host.addEventListener('focus',wake);
  wake();
  return()=>{
    active=false;clearInterval(interval);controller?.abort();
    page.removeEventListener('visibilitychange',wake);
    host.removeEventListener('online',wake);
    host.removeEventListener('offline',wake);
    host.removeEventListener('focus',wake);
  };
}
