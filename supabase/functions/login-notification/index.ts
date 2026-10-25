import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {makeLoginHandler} from './handler.js';

const projectUrl=Deno.env.get('SUPABASE_URL')!;
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendKey=Deno.env.get('RESEND_API_KEY');
const sender=Deno.env.get('LOGIN_EMAIL_FROM');
const allowedOrigins=(Deno.env.get('ALLOWED_ORIGINS')||'').split(',').map(v=>v.trim()).filter(Boolean);
const admin=createClient(projectUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});

Deno.serve(makeLoginHandler({admin,allowedOrigins,sendEmail:async({email,sessionId,createdAt})=>{
  if(!resendKey||!sender)throw Error('Email service not configured');
  const time=new Date(createdAt).toISOString();
  const response=await fetch('https://api.resend.com/emails',{
    method:'POST',signal:AbortSignal.timeout(10000),
    headers:{Authorization:'Bearer '+resendKey,'Content-Type':'application/json','Idempotency-Key':'login-'+sessionId},
    body:JSON.stringify({
      from:sender,to:[email],subject:'New sign-in to Clear & Conquer',
      text:'You signed in to Clear & Conquer at '+time+' (UTC).\n\nIf this was you, no action is needed. If you do not recognize this sign-in, secure your account and contact the game owner.\n\nThis is an automatic account-security notification.'
    })
  });
  if(!response.ok)throw Error('Email delivery failed');
}}));
