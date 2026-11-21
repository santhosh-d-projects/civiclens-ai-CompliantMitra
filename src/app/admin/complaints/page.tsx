import { supabaseAdmin } from "@/lib/supabase/server";
import { SevBadge, Pill, STATUS_STYLE, EmptyState } from "@/components/ui";
export const dynamic = "force-dynamic";
export default async function AdminComplaints() {
  const admin = supabaseAdmin();
  const { data } = await admin.from("complaints").select("*, departments!complaints_department_id_fkey(name), categories!complaints_category_id_fkey(name), wards(name)").order("created_at", { ascending: false }).limit(200);
  const rows = data ?? [];
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex items-center gap-3 mb-1"><h2 className="text-xl font-bold">All complaints</h2><span className="text-xs bg-slate-100 px-2 py-1 rounded-full">Read-only — Admins never assign or route complaints</span></div>
      <p className="text-sm text-slate-500 mb-4">Routing is decided by the citizen, confirming the AI's suggestion. This page is for monitoring only.</p>
      {rows.length === 0 ? <EmptyState icon="🧾" title="No complaints yet" /> : (
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[760px]"><thead><tr className="text-left text-slate-400 border-b"><th className="py-2">Ticket</th><th>Complaint</th><th>Category</th><th>Severity</th><th>Department</th><th>Status</th><th>Filed</th></tr></thead>
          <tbody>{rows.map((c: any) => <tr key={c.id} className="border-b last:border-0"><td className="py-2 font-mono text-xs">{c.ticket_no}</td><td className="max-w-[260px] truncate">{c.title}</td><td>{c.categories?.name}</td><td><SevBadge sev={c.severity} /></td><td>{c.departments?.name}</td><td><Pill text={c.status} style={STATUS_STYLE[c.status] ?? "bg-slate-100"} /></td><td className="text-xs text-slate-500">{new Date(c.created_at).toLocaleString("en-IN")}</td></tr>)}</tbody></table></div>)}
    </div>
  );
}
