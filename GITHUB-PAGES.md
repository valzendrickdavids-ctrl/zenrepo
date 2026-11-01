# Optional future hosting

This project has no automatic publishing workflow. Choose and configure a host
explicitly when you are ready to publish.

1. Follow START-HERE.md for the current game, account functions and database.
2. Configure the intended website origin in the username services' ALLOWED_ORIGINS.
3. Configure its exact return URL for Google sign-in as described in GOOGLE-SETUP.md.
4. Build with the Supabase project URL and publishable/anon browser key. If the
   host serves the game under a subfolder, set VITE_BASE_PATH to that folder.
5. Upload the resulting dist files using the chosen host's deployment process.
6. Test username/Google login, profiles, feedback, cloud saves and leaderboard
   uploads using the actual published address.

Hosting serves the frontend. Supabase continues to provide authentication and
data storage. Keep database access rules enabled and private environment files,
administrator credentials and OAuth secrets out of the repository and build.
