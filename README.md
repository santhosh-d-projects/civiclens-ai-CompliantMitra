# Complaint Sathi — AI Triage for Citizen Complaints

**Team CompliantMitra** — Santhosh Dubari & Vaishnavi V · Prompt to Product, 21 Nov 2026 (10:30 AM – 2:30 PM IST)

Citizens report civic issues in their own language; the AI **suggests** a category, severity and department — the **citizen confirms**. Officers work a priority queue. Departments can only operate after the Admin **approves and separately activates** them. Every governance action is written to a tamper-evident, hash-chained, Ed25519-signed audit log.

## Problem statement
Citizens report potholes, overflowing garbage, broken streetlights, water leaks and fallen trees every day. Municipal bodies receive thousands of these reports — many vague, many duplicates, many sent to the wrong department — so urgent issues get buried. Build an AI-powered system that takes an unstructured complaint (text, photo, or both) and turns it into a structured, prioritised and correctly routed ticket a municipal officer can act on right away.

## What is built
- **Citizen portal** — report (text in English/Kannada/Hindi/any language + photos), AI analysis step (category, severity + plain reason, department suggestions with confidence, duplicate hint), citizen confirms or changes the department, ticket page with progress timeline, rating + reopen.
- **Officer portal** — priority queue (severity first), complaint detail, status updates with resolution notes, department profile, and blocked screens for pending / suspended (with transfer details) / deactivated departments. Officers see only their own department, and only while it is active — enforced server-side on every API call.
- **Admin portal** — dashboard (totals, critical/high, 14-day trend, department performance), department governance (tabs, review drawer with document verification, duplicate warning, history; approve / request changes / reject; separate activation with typed `ACTIVATE`; suspend with atomic complaint transfer to an eligible active department; deactivate / reactivate), read-only complaints monitor, analytics, and the **forensic audit log** (hash chain + Ed25519 signature certificate + verification receipt + JSON export).
- **AI** — `POST /api/complaints/analyze`: language detection, Gemini 2.5 Flash (or Anthropic) under a strict JSON contract when a key is configured, with a multilingual keyword fallback classifier otherwise. The model may only rank departments the server has verified as active and covering the ward + category; the server rejects anything else.
- **Database** — the supplied `01_supabase_schema.sql` is the source of truth (state machine, `transition_department`, atomic `suspend_department`, `create_complaint` re-validation, append-only hash-chained audit). Migration 02 adds `ai_analysis_log` and `notifications`.

## Tech stack
Next.js 15 (App Router) + TypeScript + Tailwind · Supabase (Postgres, Auth, Storage, RLS) · zod validation · Ed25519 audit signatures (node crypto) · Vercel deployment · GitHub.

## Setup
1. Create a Supabase project; run `supabase/migrations/01_schema.sql`, then `02_ai_log_notifications.sql`.
2. Copy `.env.example` to `.env.local` and fill in the values (see the table in `.env.example`; keys live only in env, never in git).
3. `npm install && npm run dev`
4. Seed: `npm run gen:audit-key` (prints the private key for env, inserts the public key), `npm run seed:admin` (ADMIN_EMAIL/ADMIN_PASSWORD from env), `npm run seed:demo` (demo officers/citizens/complaints; credentials printed to console only).

## Demo logins
Printed by the seed scripts to the console only — never committed. Admin: the ADMIN_EMAIL you seeded. Officers: `officer.<dept>@demo.complaintsathi.test`. Citizens: `priya@ / rahul@ / ananya@demo.complaintsathi.test`. Demo password is printed by `seed:demo`.

## Key rotation
- Supabase keys: Dashboard → Settings → API → reset; update `.env.local` and Vercel env.
- Audit key: run `npm run gen:audit-key` with a new `AUDIT_KEY_ID`, update `AUDIT_SIGNING_PRIVATE_KEY`; old signatures keep verifying against the stored public keys.
- AI key: replace `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` in env.

## Adding a new department
A department applies at `/apply-department` (or an Admin creates it at `/admin/departments/new`) → Admin reviews at `/admin/departments` → verifies documents → Approves → types `ACTIVATE` to activate → the officer receives an invite link to set a password. No department can sign in before activation.

## Docs
`docs/MASTER_PROMPT.md` (the build spec) · `docs/PLAN.md` · `docs/SCREEN_MAP.md` · `docs/DECISIONS.md` · `docs/BUTTON_MATRIX.md` · `docs/KNOWN_ISSUES.md` · Prompt history: `PROMPT_HISTORY.md`.
