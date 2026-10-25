// Server-side session validation, deduplication and rate limits are authoritative.
// Keep no tokens in storage and never accept a client-supplied email recipient.
const requests=new Map();
export async function notifyLogin(client,session) {
  if(!client||!session?.access_token||!session.user?.id)return 'skipped';
  const key=session.access_token;
  if(requests.has(key))return requests.get(key);
  const pending=(async()=>{
    try {
      const {data,error}=await client.functions.invoke('login-notification',{
        headers:{Authorization:'Bearer '+session.access_token},body:{}
      });
      if(error)return 'unavailable';
      return data?.status==='sent'?'sent':data?.status==='skipped'?'skipped':'unavailable';
    } catch { return 'unavailable'; }
  })();
  requests.set(key,pending);
  if(requests.size>8)requests.delete(requests.keys().next().value);
  return pending;
}
