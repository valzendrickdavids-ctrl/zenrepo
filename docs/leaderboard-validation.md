# Leaderboard score validation

Apply `supabase/migrations/202611010003_verified_scores.sql` to an existing
project, or use the consolidated `supabase.sql`. Deploy the matching client files
at the same time. No player records are deleted during installation.

New score uploads use `submit_verified_score(p_run)`. The database identifies the
player from their authenticated session, checks the complete difficulty-specific
clue order, and replays exact answers and timeouts using private official answers.
It calculates speed rewards and 100-point wrong-answer penalties itself, including
the zero-point floor, then compares the result and correct-answer count with the
submission. Beginner's maximum is 100,000, Moderate's is 112,500, and Expert's is
100,000. Millisecond arithmetic keeps rounding consistent with the browser.

Each account/run has an immutable accepted history prefix and fixed difficulty,
clue order, and starting baseline. New snapshots can extend that history; a retry
of an identical older prefix is also safe. Server-generated snapshot identifiers
prevent duplicate rows for the same score. Rankings continue to use each player's
best score, rather than adding snapshots together.

Authenticated clients cannot insert or update score rows directly. Private answer
keys and verification ledgers have no client access. The narrowly scoped database
function uses an empty search path and derives ownership from `auth.uid()`.
See [Supabase database function security](https://supabase.com/docs/guides/database/functions)
and [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

Answer histories are saved with local/cloud progress and pending uploads, so
offline quitting and later retries retain the proof. Pausing retains fractional
seconds to avoid gaining time through repeated resumes. Reset removes only the
requesting player's scores, saves, and private verification ledger.

Existing leaderboard entries remain. Installation freezes compatible old cloud
saves once as starting baselines; those starting points were not retroactively
verified. A local-only old save with no matching baseline remains playable, but
its unrecorded points cannot be newly verified. Starting a fresh run supplies a
complete answer history.

## Protection boundary

This is server-side consistency validation, not complete anti-cheat. Answers and
elapsed times still originate in the browser, and the game's existing catalog is
bundled with the client. A fabricated but internally consistent history or an
automated player can still pass. Preventing that requires server-issued rounds,
server-measured timing and additional abuse controls, which would change offline
play. Do not describe this feature as proving that a human earned every point.

## Verification

`npm test` includes answer-history, snapshot, offline-queue and fractional-pause
checks. `supabase/tests/verified_scores.sql` exercises authenticated/anonymous
permissions, every difficulty, exact matching, forged totals, timer bounds,
duplicate submissions, immutable histories, completion, old saves and reset.
Run that SQL inside a transaction after the migration and **ROLLBACK** afterward;
the tests create only synthetic accounts within that transaction.
