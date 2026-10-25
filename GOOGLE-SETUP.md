# Google sign-in and login-notification email

The source now uses Google instead of Facebook. Email/password and the local demo remain.
No Facebook sharing button remains. Existing accounts/scores are not deleted or migrated
between providers. Use the same verified email when appropriate; do not assume every
old Facebook-only account will automatically link to Google.

## 1. Enable Google (required before Google sign-in works)

In Google Cloud / Google Auth Platform, configure your consent screen, support email
and audience. Create a Web application OAuth client. While in Testing, add your testers.
Use your own project credentials; do not paste secrets in chat or frontend files.

Authorized redirect URI:
YOUR_SUPABASE_PROJECT_URL/auth/v1/callback

In the matching Supabase project, Authentication → Sign In / Providers → Google:
enable Google and save the Google Client ID and Client Secret there.
The game asks only for openid, email and profile, and shows the account chooser.
Do not enable skip-nonce or unverified-email options.

In Authentication → URL Configuration, allow your exact game return URL:
http://127.0.0.1:5178/
Add your real production HTTPS URL when deployed. localhost and 127.0.0.1 differ.
Use an ordinary Chrome/Edge tab for the sign-in test.
Facebook has been removed from this website, but its remote provider/app was not
disabled or deleted. Disable the old provider only after arranging access for old players.

## 2. Apply the database change

On an existing game database, run:
supabase/migrations/202610240001_google_login.sql

For a fresh project run supabase.sql first, then that migration.
This adds the Google avatar option, replaces retired avatar choices with the owl,
and creates a private notification ledger. It does not delete players or scores.
The email address is never added to public profiles or leaderboards.

## 3. Enable actual login emails

This implementation uses Resend from a Supabase Edge Function. Set up a verified
sending domain and a sending API key in your own Resend account. Delivery to real
players requires a verified sender, not a restricted test sender.
The service receives the player's account email to deliver the security message;
include this processor/use in your privacy notice.

Set these as Supabase Edge Function secrets, NEVER VITE_* variables:
- RESEND_API_KEY: your sending key
- LOGIN_EMAIL_FROM: Clear & Conquer <security@your-verified-domain>
- ALLOWED_ORIGINS: http://127.0.0.1:5178 (comma-separated exact origins for production)

SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are supplied by the hosted function runtime.
Deploy the login-notification function from this folder using the Supabase CLI:

    supabase functions deploy login-notification --project-ref kvelkknbefmcmagjipdj

supabase/config.toml turns off the gateway legacy JWT check for this function only.
The handler itself authenticates every request via getUser AND verified getClaims,
then the database checks the real auth.sessions row. Do not remove these checks.

After a successful sign-in, the browser requests a notification to the authenticated
user's confirmed email. It cannot choose the recipient. No message is sent for demo
play, failed sign-in, or an old restored session (over 10 minutes).
The database deduplicates sessions and caps notifications at five per user per hour.
Retries are limited to three attempts per session and separated by 60 seconds;
Resend's idempotency key is the session ID. A reload within 10 minutes can retry a
failed delivery. Token refreshes are not treated as new logins.
This is a best-effort, client-triggered security notice, not a guaranteed audit
pipeline: a browser closed immediately after login or offline may never request it.
For guaranteed delivery use a durable server-side auth-event queue.
The UI reports failure honestly; email delivery does not block gameplay.

## 4. Verify

Run npm test and npm run build. Start npm run preview -- --host 127.0.0.1 --port 5178 --strictPort.
Stop any older preview first; do not run the wrong project on this port.
Test Google account selection, cancellation, callback, logout, and login again.
Open Profile and verify the Google email appears BELOW the avatar. Select
"Use my Google profile picture" to use Google's photo instead of a preset avatar.
Verify the email inbox and Resend delivery log; refreshing/focusing the tab should
not send duplicates. Email/password sign-ins also receive the same security notice.

No Google credentials, Resend credentials, remote SQL changes or live email deliveries
have been configured by the source update alone.

Official references:
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/reference/javascript/auth-getclaims
- https://resend.com/docs/api-reference/emails/send-email
