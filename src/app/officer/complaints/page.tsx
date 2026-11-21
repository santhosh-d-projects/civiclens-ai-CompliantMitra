import { activeOfficerOrBlocked } from "@/lib/officer-guard";
import OfficerQueue from "@/components/OfficerQueue";
export const dynamic = "force-dynamic";
export default async function OfficerComplaints({ searchParams }: { searchParams: Promise<any> }) {
  const sp = await searchParams;
  const { dept } = await activeOfficerOrBlocked();
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4">My department's complaints</h2>
      <form className="flex flex-wrap gap-2 mb-4" method="get">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search title or ticket no" className="border rounded-xl p-2.5 text-sm flex-1 min-w-[180px]" />
        <select name="status" defaultValue={sp.status ?? ""} className="border rounded-xl p-2.5 text-sm"><option value="">All statuses</option>{["submitted", "received", "in_progress", "resolved", "closed", "reopened"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>
        <select name="severity" defaultValue={sp.severity ?? ""} className="border rounded-xl p-2.5 text-sm"><option value="">All severities</option>{["critical", "high", "medium", "low"].map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <button className="bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-medium">Filter</button>
      </form>
      <OfficerQueue departmentId={dept.id} searchParams={sp} />
    </div>
  );
}
