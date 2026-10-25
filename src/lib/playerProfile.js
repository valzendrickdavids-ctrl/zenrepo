import {supabase} from './supabase.js';
import {readLocal,writeLocal} from './storage.js';
import {profileDefaults,validateProfile} from './profileRules.js';

export async function loadPlayerProfile(user) {
  if(user.demo){
    const saved=readLocal('cc-player-'+user.id);
    if(saved) return {...profileDefaults(user),...saved};
    const returning=Boolean(readLocal('cc-run-'+user.id)) || readLocal('cc-demo-scores')!==null;
    return profileDefaults(user,returning);
  }
  const {data,error}=await supabase.from('player_private_profiles').select('display_name,sex,age,avatar,onboarding_complete').eq('user_id',user.id).maybeSingle();
  if(error||!data) throw Error('Your profile could not load. Check your connection and apply the updated supabase.sql.');
  // Retired provider avatars fall back without linking a different identity.
  return {...data,avatar:data.avatar==='facebook'?'owl':data.avatar};
}
export async function savePlayerProfile(user,input) {
  const profile=validateProfile(input);
  if(user.demo){
    if(!writeLocal('cc-player-'+user.id,profile)) throw Error('Device storage is unavailable. Your profile was not saved.');
    const scores=readLocal('cc-demo-scores',[]);
    if(scores.length)writeLocal('cc-demo-scores',scores.map(s=>(!s.user_id||s.user_id===user.id)?{...s,display_name:profile.display_name}:s));
  }else{
    const {error}=await supabase.rpc('save_player_profile',{p_name:profile.display_name,p_sex:profile.sex,p_age:profile.age,p_avatar:profile.avatar});
    if(error) throw Error('Your profile was not saved. Check your connection and apply the updated supabase.sql.');
  }
  return profile;
}
