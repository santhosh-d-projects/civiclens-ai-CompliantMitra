import { z } from "zod";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
import { signAuditRows } from "@/lib/audit";
import { clientMeta } from "@/lib/guards";
export async function POST(req: Request) {
  const parsed = z.object({ token: z.string().min(10), password: z.string().min(8), full_name: z.string().min(2) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", "Token, name and a password of 8+ characters are required", 422);
  const hash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const admin = supabaseAdmin();
  const { data: officer } = await admin.from("department_officers").select("*, departments(status)").eq("invite_token_hash", hash).single();
  if (!officer || officer.invite_used_at) return apiError("INVALID_TOKEN", "This invite link is invalid or already used", 400);
  if (officer.invite_expires_at && new Date(officer.invite_expires_at) < new Date()) return apiError("TOKEN_EXPIRED", "This invite has expired — ask the admin to resend it", 400);
  const { data: created, error } = await admin.auth.admin.createUser({ email: officer.email, password: parsed.data.password, email_confirm: true, user_metadata: { full_name: parsed.data.full_name } });
  if (error || !created.user) return apiError("CREATE_FAILED", error?.message ?? "Could not create the account", 500);
  await admin.from("profiles").update({ role: "department_officer", department_id: officer.department_id, full_name: parsed.data.full_name }).eq("id", created.user.id);
  await admin.from("department_officers").update({ profile_id: created.user.id, invite_used_at: new Date().toISOString() }).eq("id", officer.id);
  const meta = clientMeta(req);
  await admin.rpc("write_audit", { p_actor: created.user.id, p_role: "department_officer", p_action: "OFFICER_CREDENTIALS_ACCEPTED", p_etype: "department", p_entity: officer.department_id, p_old: null, p_new: null, p_reason: null, p_ip: meta.ip, p_device: meta.device, p_meta: {} });
  await signAuditRows();
  return Response.json({ ok: true, email: officer.email });
}
