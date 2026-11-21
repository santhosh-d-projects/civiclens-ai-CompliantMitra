# Screen map — Stitch screen → route → role → data

| Stitch screen | Route | Role | Data |
|---|---|---|---|
| complaint_sathi_public_portal | `/` | public | active departments count, categories, wards |
| apply_as_a_department_public_onboarding | `/apply-department` | public | wards, categories → POST /api/departments/apply |
| (login, from spec §4) | `/login` | public | Supabase Auth email OTP + password (officers/admin) |
| department_officer_first_time_invite_password_setup | `/officer/accept-invite` | officer (invite) | token → set password |
| citizen_home_ai_complaint_intake | `/citizen` | citizen | own complaint summary |
| report_an_issue_with_ai_triage | `/citizen/report` | citizen | wards, categories, POST /api/complaints/analyze, POST /api/complaints |
| live_complaint_tracker_progress_timeline | `/citizen/complaints/[id]` | citizen | complaint + complaint_events timeline |
| (citizen list, from tracker) | `/citizen/complaints` | citizen | own complaints |
| department_officer_operations_queue | `/officer`, `/officer/complaints` | officer (active dept) | department complaints |
| operations_command_priority_queue | `/officer/complaints` (priority sort) + detail `/officer/complaints/[id]` | officer | complaint detail, status update |
| (blocked screens, spec §4.5) | `/officer/blocked` | officer (non-active dept) | department status + transfer details if suspended |
| department_governance_approvals | `/admin/departments` | admin | departments by tab, review drawer, activate step |
| create_department_admin_form | `/admin/departments/new` | admin | wards, categories → POST /api/admin/departments |
| (admin command dashboard) | `/admin` | admin | GET /api/admin/dashboard |
| (admin complaints, read-only) | `/admin/complaints` | admin | all complaints, no actions |
| admin_audit_log_system_events | `/admin/audit` | admin | audit_log + forensic drawer (verify + export) |
| civic_precision / civic_dignity DESIGN.md | design tokens | — | teal design system, type scale |

Wording fixes applied per spec §4.4: "AI suggests, you confirm" everywhere; no Ombudsman/Aadhaar/statutory references; one city (Bengaluru); officer UI has no admin navigation.
