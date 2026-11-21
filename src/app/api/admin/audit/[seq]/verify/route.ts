import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
import { verifySignature } from "@/lib/audit";
export async function GET(_req: Request, { params }: { params: Promise<{ seq: string }> }) {
  const { seq } = await params;
  const r = await requireRole("admin");
  if ("error" in r) return r.error;
  const admin = supabaseAdmin();
  const { data: v, error } = await admin.rpc("verify_audit", { p_seq: parseInt(seq) });
  if (error) return apiError("DB_ERROR", error.message, 500);
  const { data: row } = await admin.from("audit_log").select("*").eq("seq", parseInt(seq)).single();
  const { data: sig } = await admin.from("audit_signatures").select("*, audit_keys(*)").eq("audit_seq", parseInt(seq)).single();
  let signatureOk: boolean | null = null;
  if (sig?.audit_keys?.public_key) signatureOk = await verifySignature(row.record_hash, sig.signature, sig.audit_keys.public_key);
  const { count } = await admin.from("audit_log").select("seq", { count: "exact", head: true });
  return Response.json({ seq: parseInt(seq), verify: v, signature_ok: signatureOk, signature: sig ? { key_id: sig.key_id, signature: sig.signature, signed_at: sig.signed_at, fingerprint: sig.audit_keys?.fingerprint, algorithm: sig.audit_keys?.algorithm, valid_from: sig.audit_keys?.valid_from, valid_to: sig.audit_keys?.valid_to } : null, chain_position: `${seq} of ${count ?? "?"}` });
}
