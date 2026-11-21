# Complaint Sathi — Prompt Log

**Event:** Prompt to Product (Agentic AI Hackathon) · **Team:** CompliantMitra — Santhosh Dubari & Vaishnavi
**Product:** Complaint Sathi — AI Triage for Citizen Complaints (CivicLens) · **Live:** https://complaint-sathi.vercel.app
**AI tool used for the build:** Muse (Muse Spark) via the Muse agent environment; Stitch used for UI reference screens.
**Format:** per the Participant Guide — tool, prompt, purpose and outcome for each key prompt, in chronological order (IST, 2026-11-21).
The complete, unedited AI chat history is submitted separately as its own item, as required.

## 1. 10:27 IST — Prompting-skills setup for the event
**Tool:** Muse (Muse Spark)
**Prompt:** Context: The Prompt to Product event scores prompt strategy explicitly. Task: install a curated set of prompting and planning skills (prompt-master; grill-me, grilling and handoff; the superpowers planning set). Constraints: markdown files only — never execute scripts from third-party repos, never copy .git folders; install via git clone and verify every SKILL.md exists.
**Purpose:** Equip the build with structured prompting, planning and verification workflows before the problem statement arrives.
**Outcome:** All skills installed and verified; the workflow (scope → plan → build → verify) was used for the rest of the event.

## 2. 10:43 IST — Problem statement intake and MVP scoping
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt (problem statement supplied by the organisers): 'CivicLens — AI Triage for Citizen Complaints. Build an AI-powered system that turns an unstructured complaint (text, a photo, or both) into a structured, prioritised, correctly routed ticket: accept free text in English or a regional language with an optional photo; classify the issue; assign severity Low/Medium/High/Critical with a one-line reason; route to the correct department; provide a dashboard listing tickets sorted by priority.' Follow-up instruction: scope the smallest end-to-end MVP that satisfies all five requirements and list the build order.
**Purpose:** Convert the problem statement into a concrete, buildable scope within the 4-hour window.
**Outcome:** MVP scoped; build order fixed (intake → triage → routing → dashboard); event repository and task list created.

## 3. 10:44 IST — Repository and collaboration decision
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'Use the team-created GitHub repository (civiclens-ai-CompliantMitra) as the single source of truth for all code. All work is committed there; no parallel repositories.'
**Purpose:** Keep one canonical, public repository whose commit history shows work done inside the event window.
**Outcome:** Team repo adopted for all pushes; commit history spans the full build window.

## 4. 10:46–10:55 IST — Rapid prototype: triage engine proof of concept
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'Build a zero-build static prototype of the CivicLens flow: (1) citizen form — free text in English or regional languages, optional photo, location; (2) a triage engine — multilingual keyword classifier across the issue categories with English plus Hindi/Kannada/Tamil/Telugu/Marathi keywords including native script, hazard-signal severity rules that output a one-line reason, a department routing map, a 0–100 priority score, token-overlap duplicate detection, and an optional hosted-model path with strict JSON output and a local fallback; (3) an officer dashboard — statistics, filters, tickets sorted by priority, status workflow; local persistence with seeded demo tickets.'
**Purpose:** Prove the core AI triage idea end-to-end within minutes, before committing to the full stack.
**Outcome:** Prototype built and syntax-checked; triage concept validated. This draft was later superseded by the full product (entry 6) but de-risked the classifier design.

## 5. ~11:15 IST — Verification and iteration of the triage engine
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'Test the triage engine against 10 realistic complaints (a live wire over a footpath, a Hindi garbage complaint, a Kannada water leak, a pothole near a school, an open manhole, a fallen tree, a no-water report, and others). Report every misclassification with its cause, then fix the classifier and re-run the full set.'
**Purpose:** Critically review AI output instead of accepting the first version — a scored behaviour in this event.
**Outcome:** Two failures found (hanging wire and fallen tree both misread as Roads). Fixed with strong-phrase weighting and additional Critical hazard signals. Re-test: 11/11 correct.

## 6. 11:45 IST — Pivot: adopt the Complaint Sathi master prompt as the spec of record
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'Read Complaint-Sathi_Agent_Master_Prompt.md and 01_supabase_schema.sql and follow them completely. Use all installed skills. Do not stop until every acceptance test passes locally and on Vercel. Keep a timestamped log of prompts as the build proceeds.' The master prompt defines the full product: three portals (Citizen, Department Officer, Admin), a database-enforced department approval and activation state machine, AI that may only suggest while the citizen confirms, and a signed, hash-chained audit log.
**Purpose:** Replace the throwaway prototype with a production-shaped product built to an explicit, testable specification.
**Outcome:** Direction changed to Complaint Sathi (Next.js + Supabase). Master prompt and schema stored in the project as the spec of record.

## 7. 11:50–11:57 IST — Backend foundation
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'Create a fresh Supabase project (Mumbai region) through the Management API and apply the supplied schema unchanged. Scaffold the Next.js application (App Router, TypeScript, Tailwind) by hand for speed. Before writing feature code, produce the planning documents from the master prompt: PLAN.md, SCREEN_MAP.md and DECISIONS.md.'
**Purpose:** Establish the database, project skeleton and written plan before feature work, so later prompts build on fixed contracts.
**Outcome:** Project live and healthy; schema applied cleanly including seed departments and the audit chain; scaffold and planning documents written.

## 8. 11:57–12:45 IST — Full application build, one prompt per area
**Tool:** Muse (Muse Spark)
**Prompt:** Prompts (sequence): (a) 'Write the library layer: Supabase server/admin clients, Ed25519 audit signing and verification, the AI analyse function (multilingual fallback classifier plus candidate-only department ranking plus duplicate hint), and role/department guards that read status from the database on every call; map SQL exceptions to HTTP errors.' (b) 'Write all API routes: department apply/resubmit, complaint analyse/create/list/detail, candidates, officer queue and update, signed uploads, invite acceptance, admin dashboard/departments/actions/documents, audit list/verify/verify-chain/export, current-user.' (c) 'Build every page from the screen map: public landing, login, citizen home/report wizard/complaints/timeline, officer dashboard/queue/detail/profile, admin dashboard/department review with typed ACTIVATE confirmation, suspend-with-transfer, audit with forensic drawer, analytics, and the department application wizard — applying the master prompt's exact UI wording rules.' (d) 'Write the seed scripts: audit key, admin account, demo officers, citizens and complaints.'
**Purpose:** Implement the complete product against the spec, area by area, with types checked continuously.
**Outcome:** All code written; type-check clean; production build green (24 API routes, all portals); seeded demo data live.

## 9. ~12:05 IST — Database-level acceptance tests
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'Run the acceptance checks directly against Postgres: verify the audit hash chain end-to-end, prove the audit log rejects updates (append-only), verify an individual audit row's signature, and attempt an approval with no admin actor — it must be rejected.'
**Purpose:** Prove the trust features hold at the database layer, not just in the UI.
**Outcome:** All pass: chain intact, updates raise AUDIT_APPEND_ONLY, row signature valid, unauthorised approval raises ADMIN_ONLY.

## 10. ~12:20 IST — Bug-fix iteration from live smoke tests
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'Run authenticated smoke tests against the running app (analyse → create → citizen list → officer queue and update → admin analytics → audit verify). Fix every failure at its root cause and re-run the full suite.'
**Purpose:** Find and fix integration defects that unit-level checks cannot see.
**Outcome:** Found a PostgREST embed ambiguity (two foreign keys each to departments and categories) — fixed all queries with explicit FK hints; fixed error-message extraction; a test approval made during testing was reverted with a compensating, signed audit entry so the history stays honest. Full suite green; ticket CS-1015 created end-to-end.

## 11. 12:21 IST — Scope decision: optional Firebase email verification
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'A revised master prompt proposes Firebase phone-OTP as the citizen login. Assess it against the current build without stopping work.' Decision recorded after review: 'Implement email verification instead, and only as an option: new citizens register with email, password and confirm-password; the existing email-and-password login flow must not be disturbed; the Firebase step activates only when its configuration is present.'
**Purpose:** Evaluate a late spec change critically and adopt only the part that fits the product and the clock.
**Outcome:** Registration page shipped (Supabase sign-up); Firebase verification added as an env-gated, optional checkbox; login flow untouched. Recorded as decision D7.

## 12. ~12:35 IST — Ship: repository and production deployment
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'Push all code to the team GitHub repository, create the Vercel project, set the production environment variables, deploy, and smoke-test the live URL (analyse, complaint creation, officer update, admin analytics, audit chain verification).'
**Purpose:** Deliver the mandatory publicly accessible live URL and public repository.
**Outcome:** Live at complaint-sathi.vercel.app; all smoke tests pass on production; repository public with the full commit history.

## 13. ~12:47 IST — Registration and Firebase add-on deployed
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'Deploy the registration and optional-verification build to production and re-verify: public signup creates a citizen profile, the login page is unchanged, and the verification option stays hidden without Firebase configuration.'
**Purpose:** Ship the entry-11 decision and prove it did not regress the existing auth flow.
**Outcome:** Verified live via the production API; test account removed after verification.

## 14. 12:51 IST — Redesign plus two product rules
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'Redesign the entire application UI/UX into a premium glassmorphism civic-tech platform using the supplied Stitch reference export: frosted-glass surfaces, indigo/violet/midnight-navy palette with subtle teal, modern typography, reusable design tokens across every page. Constraints: do not change business logic, authentication, database operations or routing; every existing workflow must keep working. Additionally: (1) an exact duplicate complaint from the same citizen must be rejected with an error naming the original ticket and must not generate a new complaint ID; (2) the resolution workflow must be visible to the citizen — department staff add a resolution note and an after-work photo and update the status, and the citizen sees all three.'
**Purpose:** Raise the UI/UX score (20% of the rubric in the earlier brief) and close two real product gaps the judges' problem statement calls out — duplicates and proof of resolution.
**Outcome:** Glass design system applied to all portals; duplicate guard returns 409 with the original ticket number; resolution now requires note + photo and renders both on the citizen's tracking page. All flows re-tested before redeploy.

## 15. 13:02 IST — Green redesign and Participant Guide cross-check
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'Using the frontend design skills, change the palette to green and its gradients throughout; add the Bengaluru Vidhana Soudha photograph (CC0) as a blurred landing-page background with a dark overlay so all text stays fully readable; add load animations and hover colour/lift effects in the style of our earlier Jarvis pages. Then read the Prompt to Product Participant Guide and cross-check every requirement against what has been built.'
**Purpose:** Align the design with the team's chosen identity and audit the submission against the official rubric before the form opens.
**Outcome:** Green glass system live with the Vidhana Soudha hero; cross-check confirmed all five required features working, public repo, live URL, and the document set (write-up, slides, prompt log).

## 16. 13:12 IST — Submission pack preparation
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'Prepare everything the final submission form requires: rebuild the slide deck to the form's maximum of 5 slides following the guide's presentation structure; verify the write-up fits 1–2 pages and correct any stale claims; produce a form-answers sheet with every section pre-written for copy-paste, marking only personal details as [FILL]; upload all PDFs and verify every link is publicly accessible.'
**Purpose:** Make the 30-minute submission window a copy-paste exercise with no last-minute document work.
**Outcome:** Pack completed and verified: 5-slide deck, corrected 2-page write-up, prompt log, form-answers sheet; live site and repo both return 200 publicly.

## 17. 13:16 IST — Prompt log structured for submission
**Tool:** Muse (Muse Spark)
**Prompt:** Prompt: 'Restructure the prompt log into the submission format the guide specifies — for each key prompt: the tool used, the prompt, its purpose and its outcome — professionally worded, in the same chronological order and with the same timestamps as the working log. Keep the complete, unedited AI chat history as the separate submission item it is.'
**Purpose:** Present the prompting process the way the rubric scores it: clear context, constraints, iteration and verification, without changing the underlying record.
**Outcome:** This document. The full unedited chat history is submitted separately via the team's share links.
