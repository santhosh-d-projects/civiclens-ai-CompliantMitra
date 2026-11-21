# Known issues / not completed (updated during the build)
- Playwright e2e suite not run: the local Chromium download is broken on this machine (documented since 15 Nov). API/DB-level acceptance checks were run directly against Postgres instead (audit chain, append-only, ADMIN_ONLY verified 21 Nov ~12:50 IST). Browser flows to be verified on the live URL after deploy.
- Resubmission after "changes requested" uses official-email matching instead of a signed token link (spec §7 asks for a signed token). The DB transition guard (pending only, actor null) still applies.
- Email delivery is console-logged in dev (no Resend/SMTP key configured); in-app notifications are real rows.
- Voice input on the report form (SpeechRecognition) not implemented.
- Officer resolution photo proof upload not wired (note is supported; photo_paths accepted by the API).
- Analytics uses CSS bars instead of recharts.
- Rate limiting on public/AI endpoints is not yet enforced (zod + honeypot are in place).
- Firebase email verification is implemented but inactive until a Firebase project's web config is added to env (NEXT_PUBLIC_FIREBASE_*). Setup: console.firebase.google.com → create project (Spark) → Authentication → enable Email/Password → Project settings → add Web app → copy the 4 config values into Vercel env + .env.local → redeploy.
