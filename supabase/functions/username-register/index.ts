import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {makeRegistrationHandler} from './handler.js';

const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{
  auth:{persistSession:false,autoRefreshToken:false}
});
const allowedOrigins=(Deno.env.get('ALLOWED_ORIGINS')||'').split(',').map(v=>v.trim()).filter(Boolean);
async function hash(value:string){
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))))
    .map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
Deno.serve(makeRegistrationHandler({
  allowedOrigins,
  allowAttempt:async(username:string,request:Request)=>{
    const address=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
    const {data,error}=await admin.rpc('allow_username_registration',{
      p_name_hash:await hash(username),p_ip_hash:await hash(address)
    });
    return !error&&data===true;
  },
  createAccount:async(username:string,password:string)=>{
    // Supabase's password engine requires an internal email identifier. This
    // random reserved-domain identifier is not a mailbox and receives no mail.
    // admin.createUser confirms it internally without sending verification mail.
    return await admin.auth.admin.createUser({
      email:`${crypto.randomUUID()}@players.invalid`,password,email_confirm:true,
      user_metadata:{username,display_name:username},app_metadata:{account_type:'username'}
    });
  }
}));
