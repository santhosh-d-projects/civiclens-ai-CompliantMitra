import { supabaseAdmin } from "@/lib/supabase/server";
import { activeOfficerOrBlocked } from "@/lib/officer-guard";
import OfficerQueue from "@/components/OfficerQueue";
export const dynamic = "force-dynamic";
export default async function OfficerDashboard({ searchParams }: { searchParams: Promise<any> }) {
  const sp = await searchParams;
  const { dept } = await activeOfficerOrBlocked();
  const admin = supabaseAdmin();
  const { data } = await admin.from("complaints").select("severity,status").eq("department_id", dept.id);
  const rows = data ?? [];
  const open = rows.filter((c: any) => !["resolved", "closed"].includes(c.status));
  const tiles = [["🧾 Total", rows.length], ["📬 Open", open.length], ["🔴 Critical open", open.filter((c: any) => c.severity === "critical").length], ["🟠 High open", open.filter((c: any) => c.severity === "high").length], ["✅ Resolved", rows.filter((c: any) => c.status === "resolved").length]];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{tiles.map(([l, v]) => <div key={l as string} className="bg-white rounded-2xl shadow p-4"><div className="text-2xl font-bold">{v as number}</div><div className="text-sm text-slate-500">{l as string}</div></div>)}</div>
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="font-bold mb-2">⚡ Priority queue — highest severity first</h3>
        <OfficerQueue departmentId={dept.id} searchParams={sp} />
      </div>
    </div>
  );
}
