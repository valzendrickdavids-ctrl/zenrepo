// Retired: deploy this stub so older game clients cannot send sign-in emails.
Deno.serve(()=>Response.json({error:'Sign-in email notifications have been removed.'},{status:410,headers:{'Cache-Control':'no-store'}}));
