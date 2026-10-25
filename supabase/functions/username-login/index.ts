import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {makeUsernameHandler} from './handler.js';
const url=Deno.env.get('SUPABASE_URL')!;
const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const allowedOrigins=(Deno.env.get('ALLOWED_ORIGINS')||'').split(',').map(v=>v.trim()).filter(Boolean);
async function hash(value:string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))))
    .map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
Deno.serve(makeUsernameHandler({
  allowedOrigins,
  allowAttempt:async(username:string,request:Request)=>{
    const address=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
    const {data,error}=await admin.rpc('allow_username_login',{
      p_name_hash:await hash(username),p_ip_hash:await hash(address)
    });
    return !error&&data===true;
  },
  findEmail:async(username:string)=>{
    const {data,error}=await admin.from('player_usernames').select('user_id').eq('username',username).maybeSingle();
    if(error)throw Error('Lookup unavailable');
    if(!data)return null;
    const account=await admin.auth.admin.getUserById(data.user_id);
    if(account.error)throw Error('Account unavailable');
    return account.data.user?.email||null;
  },
  signIn:async(email:string,password:string)=>{
    // Per-request client: never share one player's session with another request.
    const client=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
    return await client.auth.signInWithPassword({email,password});
  }
}));
