"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export default function AdminDashboard() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { fetch("/api/admin/dashboard").then((r) => r.json()).then(setD); }, []);
  if (!d) return <p className="text-slate-400">Loading dashboard…</p>;
  const max = Math.max(1, ...d.trend.map((t: any) => t.count));
  const tiles = [["🧾 Total complaints", d.totals.complaints], ["📬 Open", d.totals.open], ["🔴 Critical open", d.totals.critical_open], ["🟠 High open", d.totals.high_open], ["✅ Resolved", d.totals.resolved], ["🏛️ Active departments", d.departments.active], ["⏳ Pending applications", d.departments.pending]];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">{tiles.map(([l, v]: any) => <div key={l} className="glass rounded-2xl p-4"><div className="text-2xl font-bold">{v}</div><div className="text-xs text-slate-500">{l}</div></div>)}</div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-bold mb-4">📈 Complaints — last 14 days</h3>
          <div className="flex items-end gap-1 h-32">{d.trend.map((t: any) => <div key={t.date} className="flex-1 flex flex-col items-center gap-1"><div className="w-full bg-teal-700 rounded-t" style={{ height: `${Math.max(4, (t.count / max) * 100)}%` }} title={`${t.date}: ${t.count}`} /><span className="text-[9px] text-slate-400">{t.date.slice(5)}</span></div>)}</div>
          <h3 className="font-bold mt-8 mb-3">🏛️ Department performance</h3>
          <table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th className="py-1">Department</th><th>Status</th><th>Open</th><th>Total</th></tr></thead>
            <tbody>{d.per_department.map((x: any) => <tr key={x.id} className="border-t"><td className="py-2 font-medium">{x.name}</td><td>{x.status}</td><td>{x.open}</td><td>{x.total}</td></tr>)}</tbody></table>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="font-bold mb-3">🕘 Recent admin activity</h3>
          {d.recent_activity.length === 0 ? <p className="text-sm text-slate-400">No activity yet.</p> : d.recent_activity.map((a: any) => (
            <div key={a.seq} className="py-2 border-b last:border-0 text-sm"><p className="font-medium">{a.action.replace(/_/g, " ")}</p><p className="text-xs text-slate-500">{a.actor_role} · {new Date(a.ts).toLocaleString("en-IN")}{a.reason ? ` · ${a.reason}` : ""}</p></div>))}
          <Link href="/admin/audit" className="text-sm text-teal-800 font-medium">Open the forensic audit log →</Link>
        </div>
      </div>
    </div>
  );
}
