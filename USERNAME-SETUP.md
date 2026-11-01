# Username/password accounts

The game now uses a username and password for registration and sign-in. The
registration screen also asks players to confirm their password. It does not ask
for an email address. Google sign-in is also available; see GOOGLE-SETUP.md.
Demo play is removed.

## Activate on the existing Supabase project

1. For a new or older project, apply the complete current `supabase.sql`. It
   includes current accounts, profiles, custom photos, avatar choices, verified
   leaderboard uploads and feedback. Existing account IDs, game progress,
   in-game names and scores are retained. The current localhost project's
   database is already updated; see `START-HERE.md`. Do not run the historical
   `202610270001_username_only.sql` after newer migrations: it can overwrite
   newer profile functions.
2. Under Edge Functions > Secrets, set `ALLOWED_ORIGINS` to the exact website
   origins, separated by commas. For the current preview include
   `http://127.0.0.1:5184`. Add the production HTTPS origin when publishing.
3. Deploy `username-login` and `username-register`. Both are public entry points:
   their legacy gateway JWT check must be off because a player is not signed in
   yet. The functions enforce password validation and database-backed rate limits.
   From this folder, an authenticated Supabase CLI can run:

       supabase functions deploy username-login --project-ref YOUR_PROJECT_REF
       supabase functions deploy username-register --project-ref YOUR_PROJECT_REF

4. Deploy the included `login-notification` retirement stub. It returns HTTP 410
   and sends no email, including when an older browser client calls it:

       supabase functions deploy login-notification --project-ref YOUR_PROJECT_REF

5. Enable Google using GOOGLE-SETUP.md. Keep password-based
   authentication enabled: the username service uses Supabase's password engine.
   Optionally delete the unused Gmail/email-service secrets after retiring the old
   notification endpoint. Do not remove `ALLOWED_ORIGINS` or built-in Supabase keys.
6. Keep the private `.env.local` with the project URL and publishable/anon browser
   key in your local project. Run `npm run build` when preparing a production site.

The server creates a random internal identifier on the reserved `players.invalid`
domain because Supabase's password engine expects an email-shaped identifier.
It is not a real mailbox, is never requested from players, is not shown in the UI,
and receives no verification or sign-in email. Creation and password hashing occur
in Supabase; no password is stored in a game table or browser-created account list.
The service-role key is used only by the server functions, never by the frontend.
Official API reference: https://supabase.com/docs/reference/javascript/auth-admin-createuser

## Existing players

Accounts that already have a username and password can continue to use them.
Players with an existing signed-in session can open Profile > Settings > Accounts,
choose a username if needed, and set a password before signing out. This retains the same user ID and
all its progress and scores. Existing signed-out accounts without password
credentials require an owner-assisted account recovery/migration; creating a new
account does not move old scores. This update never deletes an account to replace it.

There is no email-based password recovery. Keep the chosen credentials safe.
Password changes are available in Settings > Accounts under Set / change password.

## Expected behavior after setup

- Loading start screen -> Sign in / Create account -> Tutorial -> Difficulty selection -> Game.
- New accounts enter with a username and password, without an inbox step.
- Each difficulty retains its own shared online leaderboard.
- Profile shows the player identity, eleven circular preset avatars and custom photos.
- Signed-out visitors cannot bypass authentication through demo play.
- Google login appears on the login page when its provider is configured. There
  are no email entry fields, provider profile photos or sign-in email calls.
- Private age/sex details, cloud progress, feedback and confirmation dialogs remain.
- Account registration and online features need a working internet connection.

## Activation status

The username services were configured and verified on 27 October 2026.
Both username services are deployed; the retired login-notification service
returns HTTP 410. Later updates restore the Google login option; configure it
with `GOOGLE-SETUP.md` when using another project. Historical live checks passed for account
creation, password sign-in, profile saving, cloud progress, separate difficulty
leaderboards, private-data access and sign-out. The temporary verification account
was removed, and pre-existing account, score and run counts were preserved.

For another project, use the setup steps above. Single-file dashboard-ready copies
of the account functions and retirement stub remain in the setup bundle.

Profile edits now save automatically and the header name previews immediately.
Closing the profile waits for pending saves. Password controls are in Settings >
Accounts. No additional database migration is needed for this profile interface update.
