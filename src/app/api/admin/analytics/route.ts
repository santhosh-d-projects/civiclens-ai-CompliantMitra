import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
export async function GET() {
  const r = await requireRole("admin");
  if ("error" in r) return r.error;
  const admin = supabaseAdmin();
  const { data } = await admin.from("complaints").select("severity,status,category_id,department_id,created_at,resolved_at,categories!complaints_category_id_fkey(name),departments!complaints_department_id_fkey(name)");
  const rows = data ?? [];
  const count = (fn: (x: any) => string) => { const m: Record<string, number> = {}; rows.forEach((x: any) => { const k = fn(x); m[k] = (m[k] || 0) + 1; }); return m; };
  const resolved = rows.filter((x: any) => x.resolved_at);
  const avgHrs = resolved.length ? resolved.reduce((s: number, x: any) => s + (+new Date(x.resolved_at) - +new Date(x.created_at)) / 3600e3, 0) / resolved.length : null;
  return Response.json({ by_category: count((x) => x.categories?.name ?? "Unknown"), by_severity: count((x) => x.severity), by_status: count((x) => x.status), by_department: count((x) => x.departments?.name ?? "Unknown"), avg_resolution_hours: avgHrs, total: rows.length });
}
