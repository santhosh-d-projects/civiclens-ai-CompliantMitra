import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
export async function GET(req: Request) {
  const r = await requireRole("admin");
  if ("error" in r) return r.error;
  const url = new URL(req.url);
  const admin = supabaseAdmin();
  let q = admin.from("audit_log").select("*, audit_signatures(signature,key_id,signed_at)").order("seq", { ascending: false }).limit(200);
  if (url.searchParams.get("action")) q = q.eq("action", url.searchParams.get("action")!);
  if (url.searchParams.get("entity_type")) q = q.eq("entity_type", url.searchParams.get("entity_type")!);
  if (url.searchParams.get("entity_id")) q = q.eq("entity_id", url.searchParams.get("entity_id")!);
  const { data } = await q;
  return Response.json({ audit: data ?? [] });
}
