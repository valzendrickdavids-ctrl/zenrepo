# Google sign-in alongside username accounts

Continue with Google appears on the sign-in page. Registration uses a username
and password. The game does not
ask for an email address, send login emails, or require Google players to choose
a sign-in username/password. Optional in-game names and preset avatars remain.
Google supplies its verified identity, including email, internally to Supabase.

1. Supabase > Authentication > Sign In / Providers > Google: enable the existing
   provider using your Google OAuth web client ID and secret. Keep the secret in
   Supabase only. Do not enable Skip nonce checks.
2. In that Google Cloud OAuth client's Authorized redirect URIs, retain:
   `https://kvelkknbefmcmagjipdj.supabase.co/auth/v1/callback`
3. Supabase > Authentication > URL Configuration > Redirect URLs must include
   `http://127.0.0.1:5184/` for this preview. If published later, allow the exact
   production root including any subdirectory and trailing slash. Set Site URL
   to the production root then. Do not publish merely to test sign-in.
4. Keep Supabase's password provider enabled for the existing username functions.
   No SQL migration is required: the profile trigger already supports Google names.
5. Reload the game, choose Continue with Google, select your account and finish
   Google's consent. New players proceed to onboarding/tutorial; returning
   players retain progress under their Supabase account ID.

The app uses PKCE and exchanges the returned code before starting its hash router.
It removes callback parameters and gives a safe retry message on cancellation or
failure. Callback URLs preserve deployment subdirectories. No Gmail scopes or
mail sending functions are requested. Username and Google accounts are separate
unless already linked in Supabase; the game never merges scores by display name.

Reference: https://supabase.com/docs/guides/auth/social-sign-in/auth-google
