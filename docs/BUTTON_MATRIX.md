# Button matrix — every interactive element (Master Prompt §9)
Format: screen | element | handler | effect | success UI | error UI

## Public
- `/` Report an issue | link | → /login (or /citizen/report when signed in) | page loads | —
- `/` Apply as a Department | link | → /apply-department | page loads | —
- `/login` Sign in (password) | supabase signInWithPassword | session + role redirect via /api/me | redirect to role home | inline error message
- `/login` Email me a code / Verify | signInWithOtp / verifyOtp | session for citizens | redirect | inline error
- `/apply-department` ward/category chips | toggle state | selects coverage | chip highlights | —
- `/apply-department` Submit application | POST /api/departments/apply | pending department + officer + documents + audit DEPARTMENT_APPLIED | Submitted panel | inline error (duplicate email → 409 message)

## Citizen
- `/citizen/report` Analyse with AI | POST /api/complaints/analyze | category/severity/department suggestions | step 2 with suggestions | inline error banner
- `/citizen/report` category select | GET /api/complaints/candidates | refreshes eligible departments | list updates | —
- `/citizen/report` department radio | select state | citizen's confirmed choice | highlight | —
- `/citizen/report` Confirm and submit | POST /api/complaints | create_complaint RPC (server re-validates coverage) | success panel with ticket no | inline error (e.g. DEPARTMENT_DOES_NOT_COVER_WARD)
- `/citizen/report` photo input | POST /api/uploads/sign + storage uploadToSignedUrl | photo stored in private bucket | "photo attached" note | inline error
- `/citizen/complaints/[id]` Submit rating | POST /api/complaints/:id/feedback | complaint_events row | thanks message | inline message
- `/citizen/complaints/[id]` Reopen | POST /api/complaints/:id/reopen | status → reopened + event | page reloads | inline message

## Officer
- `/officer/complaints` Filter form | GET page with query params | filtered queue | list updates | —
- `/officer/complaints/[id]` Save update | PATCH /api/department/complaints/:id | officer_update_complaint RPC + citizen notification | page reloads with new status | inline error (resolution note required)
- All officer pages | department guard | server check on every request | — | non-active department → /officer/blocked (403 on APIs)
- `/officer/accept-invite` Set password | POST /api/officers/accept-invite | creates auth user, links profile, audits OFFICER_CREDENTIALS_ACCEPTED | success panel with sign-in link | inline error (invalid/expired token)

## Admin
- `/admin/departments` tabs/chips | filter state | filtered table | — | —
- Row click | GET /api/admin/departments/:id | review drawer (details, officer, documents, duplicates, history) | drawer opens | —
- Document verify checkbox | POST .../documents/:docId/verify | verified_by/at set | checkbox + verified date | —
- Approve / Request changes / Reject | POST .../[action] | transition_department RPC + signed audit | drawer refreshes, message | friendly mapped error (REASON_REQUIRED etc.)
- Activate (typed ACTIVATE) | POST .../activate | transition + officer invite generated | message with invite link | CONFIRM_REQUIRED / DOCUMENTS_NOT_VERIFIED / NO_OFFICER messages
- Suspend… / Suspend department | POST .../suspend | suspend_department RPC (atomic transfer) + officer sessions revoked | message with transfer count | TARGET_REQUIRED / TARGET_DOES_NOT_COVER messages
- Deactivate / Reactivate | POST .../[action] | transition_department RPC | drawer refreshes | REASON_REQUIRED message
- `/admin/departments/new` Create | POST /api/admin/departments | department in pending review | done panel | inline error
- `/admin/audit` row click | GET /api/admin/audit/:seq/verify | forensic drawer (certificate + receipt) | Chain verified / Tampered badge | —
- `/admin/audit` Re-verify whole chain | GET /api/admin/audit/verify-chain | signs unsigned rows + verify_audit_chain | ✅/❌ chain status | —
- `/admin/audit` Export JSON | GET /api/admin/audit/:seq/export | JSON file download | file saves | —
- Sign out (all portals) | supabase signOut | session cleared | redirect to / | —
