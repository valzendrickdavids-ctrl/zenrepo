import {googleIdentity} from './google.js';
export const AVATARS = {owl:'🦉',fox:'🦊',cat:'🐱',panda:'🐼',robot:'🤖',rocket:'🚀'};
export const SEX_OPTIONS = ['Prefer not to say','Female','Male','Intersex'];
export function profileDefaults(user, completed=false) {
  return {display_name:(user.user_metadata?.display_name || user.user_metadata?.full_name || user.name || 'Player').slice(0,30),sex:'Prefer not to say',age:null,avatar:'owl',onboarding_complete:completed};
}
export function validateProfile(input) {
  const display_name=String(input.display_name||'').trim() || 'Player';
  if(display_name.length>30) throw Error('Keep your in-game name to 30 characters or fewer.');
  const age=input.age==='' || input.age==null ? null : Number(input.age);
  if(age!==null && (!Number.isInteger(age)||age<1||age>120)) throw Error('Enter a whole-number age from 1 to 120, or leave it blank.');
  if(!SEX_OPTIONS.includes(input.sex)) throw Error('Choose one of the sex options.');
  if(!Object.hasOwn(AVATARS,input.avatar)&&input.avatar!=='google') throw Error('Choose an available avatar.');
  return {display_name,age,sex:input.sex,avatar:input.avatar,onboarding_complete:true};
}
export function googlePhoto(user) {
  const data=googleIdentity(user)?.identity_data;
  const raw=data?.avatar_url || data?.picture;
  if(typeof raw!=='string') return null;
  try {const url=new URL(raw);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
