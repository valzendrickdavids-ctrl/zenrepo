# Clear & Conquer — updated game

Release: 2 November 2026. This package contains the complete editable web game,
all local game images, account functions, current database setup and tests.
No automatic publishing workflow or repository connection is included.

## Run on your computer

1. Extract the ZIP into a normal folder; do not run files from inside the ZIP.
2. Install Node.js 22 or newer if it is not already installed.
3. Keep your existing private `.env.local` when updating the same project. For a
   fresh folder, copy `.env.example` to `.env.local` and privately fill in your
   Supabase project URL and publishable/anon browser key. Credentials are not
   included in this ZIP. Never use a service-role or secret key in the frontend.
4. Open a terminal in the extracted `Clear-Conquer` folder and run:

       npm ci
       npm run dev -- --host 127.0.0.1 --port 5184 --strictPort

5. Open http://127.0.0.1:5184/. If an older game server is using that port,
   stop the older server before starting this copy.

The game uses a local web server. Opening `index.html` directly does not run the
React/Vite source. Account sign-in and shared online features require Supabase
and an internet connection. The localhost address works on your own computer.

## Database and accounts

The Supabase project connected to the current localhost game has already received
the latest feedback, avatar/photo and verified-score updates. This ZIP does not
change that database or publish a website when downloaded or extracted.

For a different Supabase project, apply the complete current `supabase.sql` and
follow `USERNAME-SETUP.md` for username account functions and `GOOGLE-SETUP.md`
for Google sign-in. Google is available on the login page; username/password
registration remains available. Do not run older dated setup scripts after the
current consolidated SQL, because they can replace newer function definitions.

The latest existing-project upgrades are:

- `supabase/migrations/202611010001_private_profile_photos.sql`
- `supabase/migrations/202611010002_more_profile_avatars.sql`
- `supabase/migrations/202611010003_verified_scores.sql`

Existing account IDs, saved runs and leaderboard entries are retained. See
`docs/leaderboard-validation.md` for old-save compatibility and verification limits.

## Included updates

- Updated start, login, tutorial, main menu, gameplay and completion layouts.
- In-game names in mobile headers, single-line menu titles/taglines, and compact,
  matching tablet difficulty and leaderboard cards with stable Resume spacing.
- Larger logo/title, compact settings with an Audio submenu, full-screen controls,
  background effects, and opening/closing animations.
- Separate saves and Resume buttons for each difficulty; safe local quitting and
  automatic retry of pending score uploads.
- Circular avatar choices, eleven presets and custom profile photos.
- Exact answer matching, capitalization/format reminders and server-side checks
  of new leaderboard submissions.
- Gold/silver/bronze medals, internal leaderboard scrolling and automatic updates
  every 10 seconds while visible and online, plus reconnect/focus refresh.
- Google or username/password login, profile autosave and feedback/report support.

## Checks and production build

    npm test
    npm run verify:images
    npm run build

The build creates `dist` using your configured browser keys. Rebuild after changing
`.env.local`. Deploy account functions separately when using a new project.
This package does not include `node_modules`, old builds, private keys, player
data, database dumps, temporary setup pages or repository history.
