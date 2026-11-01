import {supabase} from './supabase.js';
import {AVATARS,validateProfile} from './profileRules.js';
import {loadWithDeadline} from './loadDeadline.js';
import {validPhotoData} from './profilePhoto.js';

export async function loadPlayerProfile(user) {
  return loadWithDeadline(async signal=>{
    const {data,error}=await supabase.from('player_private_profiles').select('display_name,sex,age,avatar,onboarding_complete').eq('user_id',user.id).maybeSingle().abortSignal(signal);
    if(error||!data)throw Error('Your profile could not load. Check your connection and try again.');
    let avatar_image;
    if(data.avatar==='rocket'){
      const photo=await supabase.from('player_profile_photos').select('image_data').eq('user_id',user.id).maybeSingle().abortSignal(signal);
      if(!photo.error&&validPhotoData(photo.data?.image_data))avatar_image=photo.data.image_data;
    }
    return {...data,avatar:Object.hasOwn(AVATARS,data.avatar)?data.avatar:'owl',...(avatar_image?{avatar_image}:{})};
  },{timeoutMessage:'Your profile did not load within 10 seconds. You can retry from your profile menu.'});
}
export async function savePlayerProfile(user,input) {
  const profile=validateProfile(input);
  if(profile.avatar==='rocket'&&profile.avatar_image){
    const {error}=await loadWithDeadline(signal=>supabase.from('player_profile_photos').upsert({user_id:user.id,image_data:profile.avatar_image,updated_at:new Date().toISOString()}).abortSignal(signal));
    if(error)throw Error('Your photo could not be saved. Please retry.');
  }
  const {error}=await supabase.rpc('save_player_profile',{p_name:profile.display_name,p_sex:profile.sex,p_age:profile.age,p_avatar:profile.avatar});
  if(error) throw Error('Your changes could not be saved. Check your connection and try again.');
  return profile;
}
