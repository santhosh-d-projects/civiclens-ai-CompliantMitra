import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
export async function GET(_req: Request, { params }: { params: Promise<{ seq: string }> }) {
  const { seq } = await params;
  const r = await requireRole("admin");
  if ("error" in r) return r.error;
  const admin = supabaseAdmin();
  const { data: row } = await admin.from("audit_log").select("*").eq("seq", parseInt(seq)).single();
  if (!row) return apiError("NOT_FOUND", "Audit row not found", 404);
  const { data: sig } = await admin.from("audit_signatures").select("*, audit_keys(fingerprint,algorithm,valid_from,valid_to)").eq("audit_seq", parseInt(seq)).single();
  const { data: v } = await admin.rpc("verify_audit", { p_seq: parseInt(seq) });
  const payload = { audit: row, signature: sig ?? null, verification: v, exported_at: new Date().toISOString() };
  return new Response(JSON.stringify(payload, null, 2), { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="audit-${seq}.json"` } });
}
