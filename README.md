# Clear & Conquer

One wipe, more guess — less stress, more success.

An educational React/Vite web game with 225 IT visual clues: 100 Beginner,
75 Moderate and 50 Expert. Players can use **Google sign-in or username and password**.
There is no email entry field, email/password sign-in, sign-in email notification,
or demo play. See GOOGLE-SETUP.md for Google provider setup.

## Start locally

1. Install Node.js 22 or newer and run `npm install` in this folder.
2. Copy `.env.example` to `.env.local` and privately add the Supabase project URL
   and publishable/anon browser key. Never put a service-role key in VITE_ values.
3. Follow **USERNAME-SETUP.md** to apply SQL and deploy the account functions.
4. Run `npm run dev -- --host 127.0.0.1 --port 5184 --strictPort`.
5. Open http://127.0.0.1:5184/. The loading screen automatically opens sign-in,
   or continues to home/tutorial when your account is already signed in.

Accounts and shared leaderboards require Supabase; missing configuration does not
provide an unauthenticated play mode. Publishing requires an explicit hosting setup.

## Player accounts

Register with a unique username (3–24 letters/numbers/underscores, beginning with
a letter), a password (8–128 characters), and password confirmation. Sign in with
username and password, or select Continue with Google. Google sign-in uses Google's
verified identity (including its email internally); players never type an email
into the game. Google account email addresses are not displayed on leaderboards.

Supabase handles password hashing, sessions and owner-scoped data access. The
server creates a random internal non-deliverable identifier; its service-role key
never enters browser code. Registration and login endpoints enforce input limits,
allowed website origins and database-backed request limits. See USERNAME-SETUP.md
for existing-account migration and activation details.

Profile includes an optional in-game name, private optional age/sex details, eleven
circular preset avatars, a custom photo option and a read-only sign-in username.
Photos can be JPG, PNG or WebP up to 5 MB. Profile edits save automatically;
the header name and avatar preview immediately. Pending writes are serialized and
finished before closing; connection failures retain the draft for retry. Password
and account controls are in Settings > Accounts. New players see a welcome
setup, returning players see a welcome-back message. Existing points/account IDs
are retained. Local demo data is no longer used; browser progress caching still
protects the signed-in player's current run when cloud synchronization fails.

## Gameplay

- Beginner: 60 seconds, 8 brush attempts, 1x points; 100 unique clues.
- Moderate: 40 seconds, 6 attempts, 1.5x points; 75 unique clues.
- Expert: 25 seconds, 5 attempts, 2x points; 50 unique clues.
- Each stroke is limited to 7% of the board, checked before erasing each cell.
- Release resets the percentage and usage bar immediately. The patch stays
  visible for two seconds, then is covered instantly. Inputs during recovery are
  ignored without spending an attempt. No brushing is allowed at zero attempts.
- Pointer/touch input and a focused-board Space-key patch are supported.
- A centered hint appears below every stage image.
- All modes keep the naming convention: accepted answers and alternatives retain
  their required spelling/capitalization. Begin an alternative or partial answer
  with a capital letter and keep acronym names uppercase (for example CPU, HDD).
- Beginner accepts catalog synonyms, partial answers, abbreviations and extra
  spaces. Moderate accepts catalog synonyms and partial answers, requires single
  spaces, and excludes abbreviation alternatives. Partial answers need at least
  three letters/digits. Expert accepts only the complete official answer exactly.
- Correct-answer points: round(1000 x remaining-time fraction x multiplier), with
  at least 1 point for a correct answer before the deadline. Maximums per clue:
  1000 / 1500 / 2000. Wrong guesses do not deduct points. Timeout
  earns zero. The round result shows earned points, total points, answer and fact.
- The timer runs during recovery/settings. Save & quit pauses after confirmation.
- Finish a category for its appreciation screen and unique trophy. Choose Save
  leaderboard score to submit. Beginner, Moderate and Expert boards stay separate.
- Leaderboards show five visible rows, with more scores available by scrolling.
  Padding is equal on all sides, the scrollbar stays hidden, and wheel/touch
  scrolling works across the whole panel. Short swipes coast farther with strong
  momentum, and wheel/trackpad scrolling has increased sensitivity. Keyboard scrolling and reduced-motion
  preferences are supported on both the main menu and completion screen.
  The top three use medals; later ranks are centered numbers. Each in-game name
  is preceded by the player's selected avatar/photo. Age and sex remain private.
- Settings includes audio, appearance, tutorial, progress reset and feedback.
  Reset, quit and sign-out have confirmations; saved scores belong to the account.

## Images

All 225 game images are local. Beginner currently includes 40 existing real photos
and 28 existing application screenshots; 157 unmatched stages retain original
SVG artwork, including all Moderate and Expert clues. Concepts, hints, answers and
facts are unchanged. Attribution appears at `public/image-credits.html` and in
ASSET-LICENSES.md. External learning/credit links require internet access.

## Build and checks

- `npm test`: game rules, config, profiles and account endpoint checks.
- `npm run verify:images`: checks all 225 local visual-clue paths.
- `npm run build`: creates `dist` for a static host.
- `npm run preview`: serves the production build locally.

Hash routing works with static hosts. Publishing requires rebuilding with the
correct browser configuration and deploying the server functions separately.
Online access policies remain in effect; publishing HTML alone does not create
online accounts or a shared database. New score uploads are replayed and checked
by the database. The remaining anti-cheat limits are documented below.

## Source map

- `src/App.jsx`: routes, play, progress, home, results and settings.
- `src/components/Auth.jsx`: username/password registration and sign-in.
- `src/lib/username.js`: account client validation and session exchange.
- `src/components/PlayerProfile.jsx` / `UsernameSettings.jsx`: profile and credentials.
- `src/components/PrecisionCanvas.jsx` / `src/lib/brushEngine.js`: scratch mechanics.
- `src/lib/storage.js`: per-account progress and online leaderboard storage.
- `src/components/Experience.jsx`: start, tutorial, completion and feedback.
- `src/data/`: 225-stage content, hints and local raster replacement metadata.
- `supabase.sql`: complete current database setup.
- `supabase/functions/username-register`: trusted username-only account creation.
- `supabase/functions/username-login`: password authentication by username.
- `supabase/functions/login-notification`: retired endpoint returning HTTP 410.
- `supabase/migrations/202610270001_username_only.sql`: existing-project upgrade.

Old dated migrations are history. For this release, apply the current consolidated
schema or the latest upgrade; do not run older provider migrations afterward.
The answer-rules upgrade is `supabase/migrations/202611020001_difficulty_answer_rules.sql`.
Apply it before publishing this frontend. Old answer-history events retain their
original strict scoring; new events use rulesVersion 2 with no wrong-answer penalty.
The leaderboard-avatar upgrade is `supabase/migrations/202611030001_leaderboard_profiles.sql`.
Apply it before publishing the avatar-enabled leaderboard. The authenticated-only
lookup returns the top 20 names/scores and selected avatars/photos for one difficulty;
it does not change direct access to private profile or photo tables.

## Latest verification

The matching Supabase project passed live username-account, progress, profile,
leaderboard and sign-out checks on 27 October 2026. Sign-in emails are retired.
This project has no automatic publishing workflow.

## Loading start screen

The entry screen shows the logo, title, tagline and a loading animation, with no
start card, play button, Settings button, header rule or footer. It stays visible
for at least five seconds and waits for session
restoration, then opens sign-in for visitors, home for returning players, or the
tutorial for players who have not completed it. Reduced-motion preferences disable the animation.
The sign-out confirmation button is labeled Sign out; progress is still saved.

## Verified leaderboard uploads

New uploads are checked against recorded answers, difficulty limits and scoring
rules in the database. Direct browser writes to scores are blocked. Existing
scores and compatible saved runs remain available. See
[leaderboard validation](docs/leaderboard-validation.md) for installation,
compatibility, tests and the remaining anti-cheat limits.

Leaderboards refresh automatically every 10 seconds while their page is visible
and online, and immediately when the tab regains focus or the connection returns.
The same behavior applies to results. Background updates retain the displayed
scores and scroll position. Failed requests show RETRY, keep the last loaded
scores, and retry automatically; only one refresh can be in flight at a time.
