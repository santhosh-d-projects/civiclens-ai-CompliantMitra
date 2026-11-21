import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { SevBadge, Pill, STATUS_STYLE, EmptyState } from "@/components/ui";
const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
export default async function OfficerQueue({ departmentId, searchParams }: { departmentId: string; searchParams: { status?: string; severity?: string; q?: string } }) {
  const admin = supabaseAdmin();
  let q = admin.from("complaints").select("*, categories!complaints_category_id_fkey(name), wards(name)").eq("department_id", departmentId).order("created_at", { ascending: true });
  if (searchParams.status) q = q.eq("status", searchParams.status);
  if (searchParams.severity) q = q.eq("severity", searchParams.severity);
  if (searchParams.q) q = q.or(`title.ilike.%${searchParams.q}%,ticket_no.ilike.%${searchParams.q}%`);
  const { data } = await q.limit(100);
  const rows = (data ?? []).sort((a: any, b: any) => (SEV_ORDER[a.severity] - SEV_ORDER[b.severity]) || (+new Date(a.created_at) - +new Date(b.created_at)));
  if (!rows.length) return <EmptyState icon="📭" title="No complaints in this view" body="New complaints routed to your department appear here, highest severity first." />;
  return (
    <div className="divide-y">
      {rows.map((c: any) => (
        <Link key={c.id} href={`/officer/complaints/${c.id}`} className="flex flex-wrap items-center gap-3 py-3 hover:bg-slate-50 rounded-lg px-2">
          <SevBadge sev={c.severity} />
          <div className="flex-1 min-w-[220px]"><p className="font-medium">{c.title}</p>
            <p className="text-xs text-slate-500">{c.ticket_no} · {c.categories?.name} · {c.wards?.name} · SLA {c.sla_due_at ? new Date(c.sla_due_at).toLocaleString("en-IN") : "—"}</p></div>
          <Pill text={c.status} style={STATUS_STYLE[c.status] ?? "bg-slate-100"} />
        </Link>))}
    </div>
  );
}
