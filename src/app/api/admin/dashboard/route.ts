import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
export async function GET() {
  const r = await requireRole("admin");
  if ("error" in r) return r.error;
  const admin = supabaseAdmin();
  const [cmp, depts, audit] = await Promise.all([
    admin.from("complaints").select("id,severity,status,department_id,created_at"),
    admin.from("departments").select("id,name,status"),
    admin.from("audit_log").select("seq,ts,actor_role,action,entity_type,new_status,reason").order("seq", { ascending: false }).limit(10),
  ]);
  const complaints = cmp.data ?? [], departments = depts.data ?? [];
  const open = complaints.filter((c: any) => !["resolved", "closed"].includes(c.status));
  const perDept = departments.map((d: any) => ({ id: d.id, name: d.name, status: d.status, open: open.filter((c: any) => c.department_id === d.id).length, total: complaints.filter((c: any) => c.department_id === d.id).length }));
  const trend: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5); trend[d.toISOString().slice(0, 10)] = 0; }
  complaints.forEach((c: any) => { const k = c.created_at.slice(0, 10); if (k in trend) trend[k]++; });
  return Response.json({
    totals: { complaints: complaints.length, open: open.length, critical_open: open.filter((c: any) => c.severity === "critical").length, high_open: open.filter((c: any) => c.severity === "high").length, resolved: complaints.filter((c: any) => c.status === "resolved").length },
    departments: { active: departments.filter((d: any) => d.status === "active").length, pending: departments.filter((d: any) => ["pending", "changes_requested"].includes(d.status)).length, total: departments.length },
    per_department: perDept, trend: Object.entries(trend).map(([date, count]) => ({ date, count })), recent_activity: audit.data ?? [],
  });
}
