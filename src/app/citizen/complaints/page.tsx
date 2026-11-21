import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/session";
import { SevBadge, Pill, STATUS_STYLE, EmptyState } from "@/components/ui";
export const dynamic = "force-dynamic";
export default async function MyComplaints() {
  const p = await requirePageRole("citizen");
  const admin = supabaseAdmin();
  const { data } = await admin.from("complaints").select("*, departments!complaints_department_id_fkey(name), categories!complaints_category_id_fkey(name), wards(name)").eq("citizen_id", p.id).order("created_at", { ascending: false });
  const rows = data ?? [];
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4">My complaints</h2>
      {rows.length === 0 ? <EmptyState icon="🧾" title="No complaints yet" /> : rows.map((c: any) => (
        <Link key={c.id} href={`/citizen/complaints/${c.id}`} className="flex flex-wrap items-center gap-3 py-3 border-b last:border-0 hover:bg-slate-50 rounded-lg px-2">
          <SevBadge sev={c.severity} />
          <div className="flex-1 min-w-[200px]"><p className="font-medium">{c.title}</p><p className="text-xs text-slate-500">{c.ticket_no} · {c.categories?.name} · {c.wards?.name} · {c.departments?.name}</p></div>
          <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString("en-IN")}</span>
          <Pill text={c.status} style={STATUS_STYLE[c.status] ?? "bg-slate-100"} />
        </Link>))}
    </div>
  );
}
