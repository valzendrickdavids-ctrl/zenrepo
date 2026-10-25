# Clear & Conquer
**Latest update:** read START-HERE-UPDATE.md first. It covers the new start screen,
tutorial, completion trophies, confirmation dialogs and feedback database setup.
The older Facebook notes below are historical and do not describe this release.
Username login update: follow **USERNAME-SETUP.md** before using username/password
sign-in. Existing players can sign in with email once and set a unique username
in Profile. Google login is unchanged.
Google login update: start with **GOOGLE-SETUP.md**. Facebook login/sharing have been
removed. Google provider setup, the included database migration, and server-side
email configuration are required for online Google sign-in and login emails.
Start with START-HERE.md for this download's setup and verification status.
One wipe, more guess — less stress, more success.

A complete rebuilt React + Vite educational scratch-and-guess game for IT students.
Includes 225 SVG visual clues: 100 Beginner, 75 Moderate, and 50 Expert. No image downloads or credentials are needed for the local demo.
This is a reconstruction based on the earlier requirements, not a recovered copy of the unavailable original source.
Each mode has its own complete clue pool. Open image-library.html to browse the images and answers without running the game.

## Start on Windows
1. Install Node.js 22 or newer.
2. Extract this ZIP completely.
3. Open a terminal inside the extracted clear-and-conquer folder (the folder containing package.json).
4. Run `npm install`.
5. Run `npm run dev -- --host 127.0.0.1 --port 5178 --strictPort`.
6. Open http://127.0.0.1:5178/ (stop any older copy using that port first).
7. Click **Try the local demo first**, select a mode, then start.

Do not double-click index.html; JSX requires the development server or a built bundle.

## Optional online accounts and scores
Google sign-in replaces Facebook. Follow GOOGLE-SETUP.md and USERNAME-SETUP.md for online setup. Google credentials belong only in the Supabase provider settings, never in game files. Facebook login and score sharing are not included.

1. Create/open your Supabase project.
2. Run supabase.sql in its SQL Editor. It is repeatable and supports the earlier starter tables.
3. Copy .env.example to .env.local next to package.json. Keep .env.local private.
4. Set VITE_SUPABASE_URL to the Project URL from the project's Connect panel.
5. Set VITE_SUPABASE_ANON_KEY to a browser-safe publishable key or legacy anon key from the same project.
6. Do not include brackets, markdown link syntax, a dashboard URL, or a database connection string.
7. Restart the development server after changing environment variables.
8. Enable email/password authentication. Configure the Site URL and allowed redirects for your local and deployed origins in Supabase Auth.
9. Create an account. If email confirmation is enabled, confirm your email before signing in.

No populated .env.local is shipped. Configuration is validated before the client is created.
Invalid configuration shows a useful setup message and leaves the local demo accessible.
VITE_ values are included in the browser bundle: never place a secret or service-role key there.
The online leaderboard is available to authenticated players. Signed-out visitors see the device demo leaderboard.

## How to play
- The home leaderboard changes when a difficulty button is clicked, tapped, or keyboard-focused. Each mode uses its own highlight color and best saved score per player. Signed-out/demo players see device scores; authenticated players see online scores.
- Run the updated supabase.sql to add difficulty-specific online leaderboards. Older scores without a difficulty are preserved but excluded from these boards; no difficulty is guessed for historical results.
- Beginner: 60 seconds, 8 brush attempts, 1× multiplier.
- Moderate: 40 seconds, 6 brush attempts, 1.5× multiplier.
- Expert: 25 seconds, 5 brush attempts, 2× multiplier.
- Beginner runs contain 100 distinct clues, Moderate runs 75, and Expert runs 50. Each pool is shuffled without repetition.
- Every stroke reveals at most 7% of the canvas. A stroke consumes one attempt on accepted pointer-down.
- At the cap, further movement erases nothing; release ends the stroke.
- On release, the HUD instantly reads 0%. The brushed area stays fully visible for 2,000 milliseconds, then is covered instantly with no fade.
- Smaller brush diameters on the 600×400 canvas: Beginner 48px, Moderate 36px, Expert 24px.
- During recovery all brushing is ignored without consuming attempts. At zero attempts no brushing is allowed.
- Keyboard users can hold and release Space for one random patch. Repeated keydown events do not consume extra attempts.
- The timer continues during recovery. Guesses are allowed during recovery and after attempts run out.
- Score per correct answer: round((1000 × (1 − cumulativeUniqueRevealed/100) + secondsRemaining × 5) × multiplier).
- The cumulative union of revealed cells is used for scoring; resetting the visible HUD cannot restore the reveal bonus.
- Wrong guesses subtract 100 points, floored at zero. Timeout awards no points for that clue.
- Read the fact card and continue. At the end, press **Save leaderboard score**.
- Settings includes sound effects, background music, appearance, progress reset, and **Save & quit to home**.
- Sound effects control scratch noise, last-five-second warnings, and guess/timeout tones. Music plays only during gameplay.
- Audio starts after a user gesture, as required by browser autoplay rules. Defaults: sound on, music off.
- Reset requires confirmation and clears the current player's saved run and scores, returning to Level 1 with zero points.
- Online reset requires the updated supabase.sql (including reset_my_game). Other users' saves and scores are unaffected.
- Save & quit pauses the timer. There are no switches for disabling core mechanics.
- Visiting Home by the logo, refreshing, closing the browser, or opening settings does not pause the timer.

## Progress and account behavior
The header profile button shows the signed-in player's avatar and name (avatar only on narrow screens). Open it to see account identity, edit an optional in-game name, sex and age, choose a preset avatar, or use a Google-provided photo. Settings and Sign out are inside this menu. Google photos depend on provider metadata and fall back to an avatar if unavailable. The Google account email is displayed below the avatar.

New players see an optional welcome/setup dialog once; saving, skipping, or closing it records completion. Returning players receive a welcome-back banner. Apply the updated supabase.sql before using online profiles: it marks existing accounts as returning players and creates incomplete profiles for future sign-ups. Rerunning the migration preserves profile details and completion flags. Existing local demo saves/scores are recognized as returning players. Resetting game progress does not erase the player's profile.

Online age and sex are stored in a separate owner-readable table, not the leaderboard-readable profiles table. A signed-in, owner-scoped save function updates the private details and public in-game name together. Online personal details are not cached in browser storage by this app. Demo profiles are saved only in this browser and are accessible to anyone using this browser; do not enter sensitive details on a shared demo device. Age can be cleared and sex can be reset to Prefer not to say. The app does not verify age or use it for access control.

Local demo progress and scores stay in the current browser. It is not an online authenticated account.
Online saves use the signed-in user's ID. A local copy is written after changes; cloud writes run every three seconds and are serialized.
The newer local/cloud save is selected on login. An interrupted active stroke reloads into a fresh two-second recovery window with its attempt already spent.
Version-1 and version-2 saves from the earlier 18-clue game are incompatible with the expanded pools and start a new run; historical scores remain until reset.
Cloud errors are shown and the device copy is retained. Use one active tab/device per run to avoid conflicting saves.
Scores use a unique user/run pair to avoid duplicate submissions on retry.
This classroom game uses client-generated scores and is not resistant to cheating; competitive scoring requires a trusted server.

## Project map
- src/simple-theme.css — simplified purple theme, plain background, responsive alignment, and enlarged header logo with a white border.
- public/game-artwork.png — user-provided game artwork, used unchanged for the header logo.
- src/App.jsx — home with difficulty-specific leaderboards, single-column game, auth, profiles, results, settings, routes and state coordination. Decorative previews and the in-game sidebar are removed.
- src/components/PrecisionCanvas.jsx — pointer/keyboard input, delayed instant covering, HUD updates.
- src/lib/brushEngine.js — hardcoded 7% budget, two-second lockout, attempt accounting, and coverage union.
- src/lib/audio.js — original Web Audio scratch sounds, cue tones, and ambient sequence.
- src/components/Leaderboard.jsx — local or authenticated cloud scores.
- src/components/Modal.jsx — native modal dialog and focus restoration.
- src/lib/engine.js — pure rules, scoring, matching, shuffling, saved-run checks.
- src/lib/config.js and supabase.js — safe configuration validation and client creation.
- src/lib/storage.js — per-user saves, cloud sync and idempotent score upload.
- src/data/catalog.js — 225 entries, answer aliases, educational facts, further-reading links and image-generation recipes.
- src/data/levels.js — game-facing catalog and per-mode counts.
- public/images/beginner — 100 SVG files.
- public/images/moderate — 75 SVG files.
- public/images/expert — 50 SVG files.
- image-library.html — browsable teacher catalog with downloadable images, answers and facts.
- image-catalog.json — portable machine-readable catalog.
- ASSET-LICENSES.md — image attribution and redistribution notices.
- src/index.css, tailwind.config.js — responsive styling and theme tokens.
- supabase.sql — tables, RLS policies, profile trigger/backfill and leaderboard.

State is held in the root React component and passed to route components. The run stores shuffled IDs,
current clue, score, scratch cells, timer deadline and phase. No passwords are stored by application code;
Supabase manages online authentication sessions.
Coverage uses a fixed 600×400 logical canvas and exact 2×2 erased cells. A stroke is capped before every cell erase
at 4,200 of 60,000 cells (16,800 pixels = 7%), including interpolated fast movement. Recovery uses a separate
opaque cover with a timeout and an absolute deadline, independent of scoring. The cover stays transparent until
the deadline, then becomes fully opaque without a transition. Screen updates occur at available display frames;
after a suspended tab resumes the deadline is enforced immediately.

## Checks and build
- `npm test` — game rules, saved-state checks, and safe configuration tests.
- `npm run verify:images` — asset paths, SVG dimensions and duplicate-file checks.
- `npm run generate:images` — regenerate all included SVG images from the catalog recipes.
- `npm run build` — production output in dist.
- `npm run preview` — preview the built output locally.
Deploy the dist folder to a static host. Hash-based routing avoids rewrite requirements.
Rebuild after setting production environment variables. Supabase access policies still apply.
Fonts load from Google Fonts if online, with system-font fallbacks.

## Assets and references
The Beginner clues use licensed Lucide icon artwork and custom device drawings. Moderate and Expert clues use custom diagrams and code examples.
These are 600×400 SVG illustrations, not photographs. The included license notices must accompany redistribution of the Lucide-derived images.
Some diagrams share a visual layout while showing different content. Exact file-uniqueness checks and browser decoding checks are automated;
contact sheets were visually inspected. Teachers can use the browsable catalog to judge suitability and difficulty for their class.
Each clue includes a further-reading link. These links are educational references, not image sources.
Configuration references:
- https://vite.dev/guide/env-and-mode
- https://supabase.com/docs/reference/javascript/initializing
- https://supabase.com/docs/guides/database/postgres/row-level-security

