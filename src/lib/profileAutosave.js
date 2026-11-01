import {validateProfile} from './profileRules.js';

const fingerprint=profile=>JSON.stringify([profile.display_name,profile.sex,profile.age??null,profile.avatar,Boolean(profile.onboarding_complete),profile.avatar_image||null]);

export function createProfileAutosave({initial,save,onDraft=()=>{},onStatus=()=>{},delay=600}){
  let draft={...initial},confirmed=fingerprint(initial),revision=0,timer=null,running=null,disposed=false;
  const status=(kind,message='')=>{if(!disposed)onStatus({kind,message});};
  const clear=()=>{if(timer!==null){clearTimeout(timer);timer=null;}};
  function flush(){
    clear();
    if(disposed)return Promise.resolve(null);
    if(running)return running;
    running=(async()=>{
      while(!disposed){
        let value;
        try{value=validateProfile(draft);}catch(error){status('error',error.message);throw error;}
        const version=revision,key=fingerprint(value);
        if(key===confirmed){status('saved');return value;}
        status('saving');
        try{await save(value);}catch(error){
          if(!disposed&&revision!==version)continue;
          status('error',error.message||'Your changes could not be saved.');throw error;
        }
        confirmed=key;
        if(disposed)return value;
        if(revision===version){status('saved');return value;}
      }
      return null;
    })().finally(()=>{running=null;});
    return running;
  }
  return {
    update(field,value){
      if(disposed||draft[field]===value)return;
      draft={...draft,[field]:value};revision++;clear();
      onDraft({...draft});status('pending');
      timer=setTimeout(()=>{timer=null;flush().catch(()=>{});},delay);
    },
    flush,
    getDraft:()=>({...draft}),
    dispose(){disposed=true;clear();}
  };
}
