# Complaint Sathi — Plan (per Master Prompt §14)

Milestones:
- M1 Repo + Supabase + schema + seeds — Supabase project `complaint-sathi` (ref vhvgsvizhbpnfehuocnu, ap-south-1) created 2026-11-21 11:50 IST; schema applied clean (seed audit rows written). Seeds (admin/officers/citizens) pending API keys + ADMIN_EMAIL/PASSWORD.
- M2 Auth + guards (middleware, role from profiles, department guard)
- M3 Admin department workflow (list, review drawer, approve/changes/reject, activate with typed ACTIVATE, suspend+transfer, reactivate/deactivate)
- M4 Citizen flow + AI analyze (fallback classifier first; Gemini/Anthropic when a key is provided)
- M5 Officer portal (queue, detail, status updates, blocked screens)
- M6 Audit + forensic drawer (hash verify + Ed25519 signature verify, export JSON)
- M7 Polish + a11y + responsive (Stitch teal design system)
- M8 Tests (engine unit checks via node; SQL function checks via Management API queries; Playwright limited — local Chromium download is broken on this VM, noted in KNOWN_ISSUES)
- M9 Deploy to Vercel + env vars + live verification

Timebox: event deadline 14:30 IST. Priority order if time runs short: M1–M6 core flows live on Vercel > M7 polish > M8 depth.
