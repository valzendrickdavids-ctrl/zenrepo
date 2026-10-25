# Clear & Conquer — player experience update

## What changed
- First screen: centered large logo, title and Start playing. The old header logo/text are removed. The profile button remains in its original top-right position.
- The logo has a dark border in light mode and a light border in dark mode.
- Start → sign in/create account (Google or game username/password) → five-step tutorial → difficulty selection. Google callback also enters the tutorial. Returning users who already finished the tutorial on this device can continue from the start screen.
- Tutorials can be replayed from Profile → Settings when not in an active round.
- Profile customization remains optional and appears after the tutorial for new users.
- Settings → Feedback & reports. Signed-in reports are privately stored after installing the SQL update below. Demo/guest reports download as JSON and are explicitly NOT sent.
- Beginner: Discovery Cup with a sprout emblem; Moderate: Challenger Trophy with a flame; Expert: Conqueror Crown. Each has a distinct color, appreciation message and score-saving action. Completing all clues earns the category trophy; it does not imply all guesses were correct.
- Save & quit and Sign out now ask for confirmation, preserve progress and pause the round on confirmation. Cancel keeps the player in the game. Leaving an unfinished round through in-app history also prompts. Browser close/reload uses the browser's generic warning when supported; it does not pause the timer.

## Run
Extract the ZIP, install Node.js 22+, open a terminal in this folder and run:

    npm ci
    npm run preview -- --host 127.0.0.1 --port 5178 --strictPort

The included dist is a credential-free demo build. Stop any previous server on the
chosen port first. For editing use npm run dev with the same host and port flags.

## Online accounts
Copy .env.example to .env.local and restore your own Supabase URL and browser-safe
publishable/anon key privately. Run npm run build and restart the preview. Never put
Google secrets or service-role keys in frontend files. The game account form uses
Supabase username/password authentication; it is not an offline password database.
The local demo needs no account. Google and username setup requirements from
GOOGLE-SETUP.md and USERNAME-SETUP.md still apply. Register the exact return URL in
Supabase if using a different port or deployed domain.

## Enable online feedback
After the existing schema/migrations, run:

    supabase/migrations/202610240003_player_feedback.sql

This file is included but has NOT been applied to the live project automatically.
Reports are stored in public.player_feedback. The game owner can review them in
the Supabase Table Editor. Ordinary players can read only their own reports and
cannot select another account as the author. Server-side validation permits
10–2,000 characters and limits each user to five reports per hour. No email is
automatically sent to the owner. No new administrator UI is included.

Existing username and login-notification functions still require deployment.
This update does not deploy them or configure an email sender.

## Verification
47 unit tests pass; 225 images verified; production build succeeds. Local UI tests
exercise start/auth/demo/tutorial, light/dark logo placement, quit/resume/cancel,
sign-out confirmation, feedback download, and category completion fixtures.
Actual Google account consent and online feedback submission require your private
configuration and live SQL setup; they are not claimed as end-to-end tested here.
