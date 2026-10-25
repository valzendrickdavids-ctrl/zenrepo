# Publish the full game on GitHub Pages

This is the latest full React game, not the black-and-white prototype. The release includes 225 clue images, tutorial, Google account profiles, difficulty leaderboards, feedback UI, completion awards and exit confirmations.

## Repository setup

1. Extract the archive. Upload the contents of the project folder to your repository's root on the `main` branch. Include the hidden `.github` directory and `.gitignore`. `package.json` should be at the repository root.
2. In GitHub, open Settings → Secrets and variables → Actions. Add repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using your existing project URL and browser publishable key (or legacy anon key).
3. Open Settings → Pages. Select **GitHub Actions** as the build source.
4. In Actions, run **Deploy Clear and Conquer**, or push a change to `main`. The workflow tests and builds the game, then publishes `dist`. Its deployment link is your website address.

The workflow computes the correct repository path automatically. Hash-based routes such as `#/home` work on Pages without a server rewrite.

## Google sign-in on the published address

In Supabase → Authentication → URL Configuration, set Site URL to the final published address and add that exact address, including the repository path and trailing slash, to Redirect URLs. Example: `https://valzendrickdavids-ctrl.github.io/zenrepo/`. Retain any local development addresses you still use.

Keep the Google OAuth callback configured to your existing Supabase project's `/auth/v1/callback` URL. The Google client secret stays in Supabase's Google provider settings. A Google OAuth app in testing may restrict who can sign in; production availability must be configured in Google Cloud for your intended audience.

## Backend readiness

GitHub Pages hosts the interface. It does not install Supabase SQL or deploy Edge Functions.

- Google profile-picture saving has been repaired in the existing live project. A repeatable repair is included in `supabase/migrations/202610250001_google_avatar_repair.sql`.
- Username/password login requires the username migration and `username-login` Edge Function described in `USERNAME-SETUP.md`. Deployment is not verified by this package.
- Email login notifications require the notification migration, `login-notification` function and configured email sender described in `GOOGLE-SETUP.md`. Delivery has not been verified.
- Feedback submission requires `supabase/migrations/202610240003_player_feedback.sql`; its live installation has not been verified.
- Add `https://valzendrickdavids-ctrl.github.io` (origin only, no repository path) to `ALLOWED_ORIGINS` for the deployed Edge Functions, retaining needed existing origins.

## Private configuration

The archive omits `.env.local`, built bundles, dependencies and credentials. Never upload service-role keys, Google client secrets or email-service secrets to frontend source. Vite embeds the Supabase browser key in the website as designed; database row-level security must protect player data. Actions secrets avoid storing the values in repository files, but do not make browser configuration secret after building.

For local use, run `npm ci`, copy `.env.example` to `.env.local` and restore your private Supabase configuration, then run `npm run dev`. With blank values, local demo mode remains available.

Workflow references: https://vite.dev/guide/static-deploy.html#github-pages and https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
