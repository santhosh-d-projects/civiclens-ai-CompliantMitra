import { z } from "zod";
import crypto from "crypto";
import { requireRole, clientMeta } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, fromDbError } from "@/lib/errors";
import { signAuditRows } from "@/lib/audit";

const ACTIONS: Record<string, string> = { approve: "approved", reject: "rejected", "request-changes": "changes_requested", activate: "active", deactivate: "deactivated", reactivate: "active" };
export async function POST(req: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  const { id, action } = await params;
  const r = await requireRole("admin");
  if ("error" in r) return r.error;
  const parsed = z.object({ reason: z.string().optional(), confirm: z.string().optional(), target_department_id: z.string().uuid().optional() }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("VALIDATION", parsed.error.issues[0].message, 422);
  const b = parsed.data;
  const admin = supabaseAdmin();
  const meta = clientMeta(req);
  if (action === "suspend") {
    const { data, error } = await admin.rpc("suspend_department", { p_dept: id, p_actor: r.profile.id, p_reason: b.reason ?? null, p_target: b.target_department_id ?? null, p_ip: meta.ip, p_device: meta.device });
    if (error) return fromDbError(error);
    const { data: officers } = await admin.from("department_officers").select("profile_id").eq("department_id", id).not("profile_id", "is", null);
    for (const o of officers ?? []) if (o.profile_id) await admin.auth.admin.signOut(o.profile_id, "global").catch(() => {});
    await signAuditRows();
    return Response.json({ ok: true, transferred: data });
  }
  const to = ACTIONS[action];
  if (!to) return apiError("UNKNOWN_ACTION", `Unknown action ${action}`, 404);
  if (action === "activate" && b.confirm !== "ACTIVATE") return apiError("CONFIRM_REQUIRED", "Type ACTIVATE to confirm activation", 422);
  const { data, error } = await admin.rpc("transition_department", { p_dept: id, p_to: to, p_actor: r.profile.id, p_reason: b.reason ?? null, p_ip: meta.ip, p_device: meta.device });
  if (error) return fromDbError(error);
  let invites: { email: string; link: string }[] = [];
  if (action === "activate") {
    const { data: officers } = await admin.from("department_officers").select("*").eq("department_id", id).is("invite_used_at", null);
    for (const o of officers ?? []) {
      if (o.profile_id) continue;
      const token = crypto.randomBytes(32).toString("hex");
      const hash = crypto.createHash("sha256").update(token).digest("hex");
      await admin.from("department_officers").update({ invite_token_hash: hash, invite_expires_at: new Date(Date.now() + 48 * 3600e3).toISOString() }).eq("id", o.id);
      const link = `${process.env.APP_URL || ""}/officer/accept-invite?token=${token}`;
      invites.push({ email: o.email, link });
      console.log(`[email-dev] Officer invite for ${o.email}: ${link}`);
      await admin.rpc("write_audit", { p_actor: r.profile.id, p_role: "admin", p_action: "OFFICER_INVITED", p_etype: "department", p_entity: id, p_old: null, p_new: null, p_reason: null, p_ip: meta.ip, p_device: meta.device, p_meta: { officer_email: o.email } });
    }
  }
  if (action === "deactivate") {
    const { data: officers } = await admin.from("department_officers").select("profile_id").eq("department_id", id).not("profile_id", "is", null);
    for (const o of officers ?? []) if (o.profile_id) await admin.auth.admin.signOut(o.profile_id, "global").catch(() => {});
  }
  await signAuditRows();
  return Response.json({ department: data, invites });
}
