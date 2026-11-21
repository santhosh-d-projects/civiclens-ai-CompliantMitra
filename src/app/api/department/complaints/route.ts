import { requireActiveOfficer } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
export async function GET(req: Request) {
  const r = await requireActiveOfficer();
  if ("error" in r) return r.error;
  const url = new URL(req.url);
  const status = url.searchParams.get("status"), sev = url.searchParams.get("severity"), q = url.searchParams.get("q");
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1")), size = 20;
  const admin = supabaseAdmin();
  let query = admin.from("complaints").select("*, categories!complaints_category_id_fkey(name,slug), wards(name), profiles:citizen_id(full_name,email)", { count: "exact" })
    .eq("department_id", r.departmentId);
  if (status) query = query.eq("status", status);
  if (sev) query = query.eq("severity", sev);
  if (q) query = query.or(`title.ilike.%${q}%,ticket_no.ilike.%${q}%`);
  const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const { data, count } = await query.order("created_at", { ascending: false }).range((page - 1) * size, page * size - 1);
  const sorted = (data ?? []).sort((a: any, b: any) => (sevOrder[a.severity] - sevOrder[b.severity]) || (+new Date(a.created_at) - +new Date(b.created_at)));
  return Response.json({ complaints: sorted, total: count ?? 0, page });
}
