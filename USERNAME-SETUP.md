# Username and password sign-in

The default form now asks for Username and Password. A username is unique,
case-insensitive, 3–24 letters/numbers/underscores, and must start with a letter.
It is separate from the changeable in-game display name. Google sign-in remains.

## Required server setup — frontend changes alone are not enough

1. Apply the base supabase.sql and Google migration if not already installed.
2. Run supabase/migrations/202610240002_usernames.sql on the SAME Supabase project.
   Do not rerun older SQL files afterward. Existing accounts/scores are preserved.
3. Set Edge Function secret ALLOWED_ORIGINS to exact allowed origins, for example
   http://127.0.0.1:5178 (add production HTTPS origins comma-separated).
4. Deploy from this project folder:

       supabase functions deploy username-login --project-ref kvelkknbefmcmagjipdj

   supabase/config.toml disables the gateway JWT requirement only for this login
   endpoint, since the caller is not signed in yet. Do not remove its password
   authentication, input validation, or database-backed rate limiting.
   SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY come from the
   hosted runtime. Never put a service-role key into VITE_* variables.
5. Test a new email/password signup with a username, confirm its email, then log
   in using the username. Confirm mixed-case usernames work and wrong passwords
   do not. Check the same-name signup race is rejected by the unique constraint.

## Existing accounts

Use "Existing account without a username? Use email", then open Profile and
set a username. Google users may also set a username, but this does not create
a password: Google-only players should continue using Google unless they have
separately set a password through Supabase's secure account recovery flow.
Username assignment is permanent in this version; display names can still change.
The compatibility email option prevents existing players from being locked out.

## Security and deployment notes

Email is still required on email/password signup for confirmation, recovery and
login notifications. Keep Supabase email confirmation enabled. Public clients
cannot list usernames or resolve other players' emails. The Edge Function looks
up the username privately and authenticates the password with Supabase.
Only successful authentication returns session tokens; these must travel over
HTTPS in production. Passwords and service credentials must never be logged.

Rate limits are eight attempts per username, 40 per forwarded IP and 2,000
globally per 15-minute window (including failures and unknown names). IP headers
are defense-in-depth; username/global limits do not depend on their authenticity.
Tune limits and configure additional platform abuse protection for production.
Unknown usernames and wrong passwords return the same message; exact response
timing cannot be guaranteed identical by this implementation.

Run npm test and npm run build locally. Live migrations and deployment are NOT
performed by copying this source. Until deployed, username login will fail safely;
the email compatibility option and Google configuration remain available.
For Google and notification email setup, see GOOGLE-SETUP.md.
