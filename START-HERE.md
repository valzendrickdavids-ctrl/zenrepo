# Clear & Conquer — latest game download

Packaged October 24, 2026. Includes complete editable source, a prebuilt local-demo
version in dist, 225 SVG clues (100 Beginner / 75 Moderate / 50 Expert), tests,
database SQL, migrations and server function source. No credentials are included.

## Run the included demo

1. Extract the ZIP completely; install Node.js 22 or newer if needed.
2. Open a terminal in the clear-and-conquer folder containing package.json.
3. Run `npm ci`.
4. Run `npm run preview -- --host 127.0.0.1 --port 5178 --strictPort`.
5. Open http://127.0.0.1:5178/ and choose the local demo.

Stop any previous game server using port 5178 first. Keep the terminal running.
Do not double-click index.html. This is a web game, not a standalone Windows EXE.

## Restore online play privately

Copy .env.example to .env.local and enter your Supabase Project URL and browser-safe
publishable/anon key from your own Supabase dashboard. Never use a service-role key.
Do not put the Google Client Secret in this file: it is already stored in Supabase.
Then run `npm run build` and restart the preview command above. The included dist
is deliberately a demo-only build so the download contains no account credentials.

## Verified setup and remaining deployment work

- All 42 automated tests pass; all 225 clue assets pass verification.
- Google OAuth client and Supabase Google provider were configured on the existing
  project kvelkknbefmcmagjipdj. The callback matches and the local return URL is allowed.
- The configured local game's Google button reached Google's account chooser.
  Final account consent, callback completion and profile saving were not tested.
- The Google app is still in testing, not published for a public launch.
- New username-login and login-notification server functions and their SQL
  migrations are included, but their live deployment has NOT been verified or
  completed in this setup. Follow USERNAME-SETUP.md and GOOGLE-SETUP.md.
- Login emails additionally need a verified Resend sender and server-side secrets.
  They are not automatically enabled by downloading or building these files.

For a fresh database apply supabase.sql, then the migration files in filename order.
For an existing database apply only missing migrations after reviewing/backing up
the database. Do not rerun older base SQL after newer migrations.

The game uses client-generated scores; it is intended for classroom play, not
cheat-resistant competition. See README.md and ASSET-LICENSES.md for details.
