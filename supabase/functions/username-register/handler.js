const failure={error:'Account could not be created. Try another username or try again later.'};

export function makeRegistrationHandler({allowedOrigins,allowAttempt,createAccount}) {
  return async request=>{
    const origin=request.headers.get('Origin');
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
    if(!origin||!allowedOrigins.includes(origin))return Response.json(failure,{status:403,headers});
    Object.assign(headers,{'Access-Control-Allow-Origin':origin,
      'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods':'POST, OPTIONS'});
    const reply=(status,data)=>Response.json(data,{status,headers});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return reply(405,failure);
    try {
      if(Number(request.headers.get('content-length')||0)>4096)return reply(400,failure);
      const text=await request.text();
      if(text.length>4096)return reply(400,failure);
      const body=JSON.parse(text);
      const username=typeof body.username==='string'?body.username.trim().toLowerCase():'';
      if(!/^[a-z][a-z0-9_]{2,23}$/.test(username)||typeof body.password!=='string'||body.password.length<8||body.password.length>128)
        return reply(400,failure);
      if(!await allowAttempt(username,request))return reply(429,failure);
      // The trusted adapter supplies the internal identity and metadata. Never
      // accept user IDs, roles, addresses or confirmation flags from the browser.
      const {error}=await createAccount(username,body.password);
      if(error)return reply(400,failure);
      return reply(201,{created:true});
    }catch{return reply(400,failure);}
  };
}
