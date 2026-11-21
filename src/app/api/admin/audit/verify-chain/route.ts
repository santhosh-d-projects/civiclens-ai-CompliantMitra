import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
import { signAuditRows } from "@/lib/audit";
export async function GET() {
  const r = await requireRole("admin");
  if ("error" in r) return r.error;
  await signAuditRows();
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("verify_audit_chain");
  if (error) return apiError("DB_ERROR", error.message, 500);
  return Response.json({ broken_at: data, chain_ok: data === null });
}
