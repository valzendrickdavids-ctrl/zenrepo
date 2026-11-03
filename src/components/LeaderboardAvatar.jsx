import {useState} from 'react';
import {AVATARS} from '../lib/profileRules.js';
import {validPhotoData} from '../lib/profilePhoto.js';

export default function LeaderboardAvatar({avatar='owl',image}) {
  const [failed,setFailed]=useState(null);
  const photo=avatar==='rocket'&&validPhotoData(image)&&failed!==image?image:null;
  return <span className="leaderboard-avatar" aria-hidden="true">{photo
    ? <img src={photo} alt="" onError={()=>setFailed(photo)}/>
    : (Object.hasOwn(AVATARS,avatar)?AVATARS[avatar]:AVATARS.owl)}</span>;
}
