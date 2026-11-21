import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
export async function GET(req: Request) {
  const r = await requireRole("admin");
  if ("error" in r) return r.error;
  const url = new URL(req.url);
  const admin = supabaseAdmin();
  let q = admin.from("complaints").select("*, departments!complaints_department_id_fkey(name), categories!complaints_category_id_fkey(name,slug), wards(name)").order("created_at", { ascending: false }).limit(200);
  if (url.searchParams.get("status")) q = q.eq("status", url.searchParams.get("status")!);
  if (url.searchParams.get("severity")) q = q.eq("severity", url.searchParams.get("severity")!);
  if (url.searchParams.get("department_id")) q = q.eq("department_id", url.searchParams.get("department_id")!);
  const { data } = await q;
  return Response.json({ complaints: data ?? [] });
}
