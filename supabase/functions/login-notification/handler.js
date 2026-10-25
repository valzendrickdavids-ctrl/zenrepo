export function makeLoginHandler({admin,sendEmail,allowedOrigins}) {
  return async function handle(request) {
    const origin=request.headers.get('Origin');
    const allowed=origin&&allowedOrigins.includes(origin);
    const headers={'Content-Type':'application/json','Vary':'Origin',
      ...(allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})};
    const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
    if(!allowed)return reply(403,{error:'Origin not allowed'});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return reply(405,{error:'Method not allowed'});
    const bearer=request.headers.get('Authorization')||'';
    if(!bearer.startsWith('Bearer '))return reply(401,{error:'Sign in required'});
    try {
      const token=bearer.slice(7);
      // Both checks use Supabase. Never trust locally decoded, unsigned claims.
      const [{data:account,error:userError},{data:verified,error:claimsError}]=await Promise.all([
        admin.auth.getUser(token),admin.auth.getClaims(token)
      ]);
      const user=account?.user,claims=verified?.claims;
      if(userError||claimsError||!user||claims?.sub!==user.id||!claims?.session_id)
        return reply(401,{error:'Invalid session'});
      if(!user.email||!user.email_confirmed_at)return reply(200,{status:'skipped'});
      // Recipient and sign-in time come only from trusted server-side records.
      const {data:createdAt,error:claimError}=await admin.rpc('claim_login_notification',{
        p_user:user.id,p_session:claims.session_id
      });
      if(claimError)return reply(503,{error:'Notification unavailable'});
      if(!createdAt)return reply(200,{status:'skipped'});
      await sendEmail({email:user.email,sessionId:claims.session_id,createdAt});
      const {error:saveError}=await admin.from('login_notifications').update({sent_at:new Date().toISOString()})
        .eq('session_id',claims.session_id).eq('user_id',user.id);
      if(saveError)return reply(503,{error:'Notification unavailable'});
      return reply(200,{status:'sent'});
    } catch {
      // Do not disclose provider responses, recipient addresses, or credentials.
      return reply(503,{error:'Notification unavailable'});
    }
  };
}
