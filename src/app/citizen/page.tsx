import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/session";
import { SevBadge, Pill, STATUS_STYLE, EmptyState } from "@/components/ui";
export const dynamic = "force-dynamic";
export default async function CitizenHome() {
  const p = await requirePageRole("citizen");
  const admin = supabaseAdmin();
  const { data: complaints } = await admin.from("complaints").select("*, departments!complaints_department_id_fkey(name), categories!complaints_category_id_fkey(name)").eq("citizen_id", p.id).order("created_at", { ascending: false }).limit(5);
  const { data: notifs } = await admin.from("notifications").select("*").eq("user_id", p.id).order("created_at", { ascending: false }).limit(5);
  const rows = complaints ?? [];
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow p-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px]"><h2 className="text-2xl font-bold">Namaste{p.full_name ? `, ${p.full_name.split(" ")[0]}` : ""} 👋</h2><p className="text-slate-500">Report an issue and track it to resolution. AI suggests — you confirm.</p></div>
        <Link href="/citizen/report" className="bg-teal-800 hover:bg-teal-900 text-white font-semibold px-6 py-3 rounded-xl">📝 Report an issue</Link>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl shadow p-6">
          <div className="flex items-center mb-4"><h3 className="font-bold">Recent complaints</h3><Link href="/citizen/complaints" className="ml-auto text-sm text-teal-800 font-medium">View all →</Link></div>
          {rows.length === 0 ? <EmptyState icon="🧾" title="No complaints yet" body="Your reported issues will appear here." /> : rows.map((c: any) => (
            <Link key={c.id} href={`/citizen/complaints/${c.id}`} className="flex items-center gap-3 py-3 border-b last:border-0 hover:bg-slate-50 rounded-lg px-2">
              <SevBadge sev={c.severity} />
              <div className="flex-1 min-w-0"><p className="font-medium truncate">{c.title}</p><p className="text-xs text-slate-500">{c.ticket_no} · {c.departments?.name ?? ""}</p></div>
              <Pill text={c.status} style={STATUS_STYLE[c.status] ?? "bg-slate-100"} />
            </Link>))}
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-bold mb-4">🔔 Notifications</h3>
          {(notifs ?? []).length === 0 ? <p className="text-sm text-slate-400">Nothing yet.</p> : (notifs ?? []).map((n: any) => (
            <div key={n.id} className="py-2 border-b last:border-0"><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-slate-500">{n.body}</p></div>))}
        </div>
      </div>
    </div>
  );
}
