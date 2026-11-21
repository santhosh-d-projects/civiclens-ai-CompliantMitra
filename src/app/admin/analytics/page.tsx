"use client";
import { useEffect, useState } from "react";
function Bars({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]); const max = Math.max(1, ...entries.map(([, v]) => v));
  return <div className="glass rounded-2xl p-6"><h3 className="font-bold mb-4">{title}</h3>
    {entries.length === 0 ? <p className="text-sm text-slate-400">No data yet.</p> : entries.map(([k, v]) => (
      <div key={k} className="flex items-center gap-3 mb-2 text-sm"><span className="w-44 truncate">{k}</span><div className="flex-1 h-4 bg-slate-100 rounded-full"><div className="h-4 bg-teal-700 rounded-full" style={{ width: `${(v / max) * 100}%` }} /></div><b>{v}</b></div>))}</div>;
}
export default function Analytics() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { fetch("/api/admin/analytics").then((r) => r.json()).then(setD); }, []);
  if (!d) return <p className="text-slate-400">Loading analytics…</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-4"><div className="text-2xl font-bold">{d.total}</div><div className="text-xs text-slate-500">TOTAL COMPLAINTS</div></div>
        <div className="glass rounded-2xl p-4"><div className="text-2xl font-bold">{d.avg_resolution_hours ? d.avg_resolution_hours.toFixed(1) + "h" : "—"}</div><div className="text-xs text-slate-500">AVG RESOLUTION TIME</div></div>
        <div className="glass rounded-2xl p-4"><div className="text-2xl font-bold">{d.by_status?.resolved ?? 0}</div><div className="text-xs text-slate-500">RESOLVED</div></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Bars title="📂 By category" data={d.by_category} /><Bars title="🏛️ By department" data={d.by_department} />
        <Bars title="🎚️ By severity" data={d.by_severity} /><Bars title="📊 By status" data={d.by_status} />
      </div>
    </div>
  );
}
