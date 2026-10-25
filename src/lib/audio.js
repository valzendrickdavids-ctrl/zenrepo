// Original synthesized audio. No third-party audio assets.
class GameAudio {
 context=null;sfx=true;music=false;playing=false;scratch=null;musicTimer=null;musicNodes=new Set();
 unlock=()=>{try{this.context??=new (window.AudioContext||window.webkitAudioContext)();this.context.resume().then(()=>this.updateMusic()).catch(()=>{});}catch{}};
 configure(sfx,music,playing){this.sfx=sfx;this.music=music;this.playing=playing;if(!sfx)this.stopScratch();this.updateMusic();}
 tone(frequency,duration=.15,volume=.06,music=false){
  const c=this.context;if(!c||c.state!=='running')return;
  const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=frequency;
  g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);
  o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+duration);
  if(music)this.musicNodes.add(o);o.onended=()=>{this.musicNodes.delete(o);o.disconnect();g.disconnect();};
 }
 effect(kind){if(!this.sfx)return;this.unlock();this.tone({correct:660,wrong:150,warning:440,timeout:110}[kind]||440,.2);}
 startScratch(){
  if(!this.sfx)return;this.unlock();this.stopScratch();const c=this.context;if(!c)return;
  const buffer=c.createBuffer(1,c.sampleRate,c.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.035;
  const source=c.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(c.destination);source.start();this.scratch=source;
 }
 stopScratch(){if(this.scratch){this.scratch.stop();this.scratch.disconnect();this.scratch=null;}}
 updateMusic(){
  if(this.music&&this.playing&&this.context?.state==='running'){
   if(!this.musicTimer){let i=0;const notes=[261.63,329.63,392,329.63,293.66,349.23,440,349.23];
    const play=()=>this.tone(notes[i++%notes.length],1.7,.022,true);play();this.musicTimer=setInterval(play,1500);}
  }else{clearInterval(this.musicTimer);this.musicTimer=null;for(const node of this.musicNodes){try{node.stop();}catch{}}this.musicNodes.clear();}
 }
 dispose(){this.stopScratch();this.music=false;this.updateMusic();this.context?.close();this.context=null;}
}
export const audio=new GameAudio();

