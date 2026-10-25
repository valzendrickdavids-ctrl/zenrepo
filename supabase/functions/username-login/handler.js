const failure={error:'Sign in failed. Check your details or try again later.'};
export function makeUsernameHandler({allowedOrigins,allowAttempt,findEmail,signIn}) {
  return async request=>{
    const origin=request.headers.get('Origin');
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
    if(!origin||!allowedOrigins.includes(origin))return new Response(JSON.stringify(failure),{status:403,headers});
    Object.assign(headers,{'Access-Control-Allow-Origin':origin,
      'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods':'POST, OPTIONS'});
    const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return reply(405,failure);
    try {
      if(Number(request.headers.get('content-length')||0)>4096)return reply(400,failure);
      const text=await request.text();
      if(text.length>4096)return reply(400,failure);
      const body=JSON.parse(text);
      const username=typeof body.username==='string'?body.username.trim().toLowerCase():'';
      if(!/^[a-z][a-z0-9_]{2,23}$/.test(username)||typeof body.password!=='string'||!body.password||body.password.length>1024)return reply(400,failure);
      if(!await allowAttempt(username,request))return reply(429,failure);
      const email=await findEmail(username);
      // Unknown names still perform a password request; responses never reveal
      // whether a username exists or disclose the associated email.
      const {data,error}=await signIn(email||'unknown-player@invalid.example',body.password);
      if(!email||error||!data?.session)return reply(401,failure);
      return reply(200,{session:{access_token:data.session.access_token,refresh_token:data.session.refresh_token}});
    }catch{return reply(401,failure);}
  };
}
