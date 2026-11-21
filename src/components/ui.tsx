export const SEV_STYLE: Record<string, string> = { critical: "bg-red-600 text-white", high: "bg-orange-500 text-white", medium: "bg-amber-400 text-slate-900", low: "bg-slate-400 text-white" };
export const STATUS_STYLE: Record<string, string> = { submitted: "bg-sky-100 text-sky-800", received: "bg-indigo-100 text-indigo-800", in_progress: "bg-amber-100 text-amber-800", resolved: "bg-emerald-100 text-emerald-800", closed: "bg-slate-200 text-slate-700", reopened: "bg-rose-100 text-rose-800" };
export const DEPT_STATUS_STYLE: Record<string, string> = { active: "bg-emerald-100 text-emerald-800", pending: "bg-amber-100 text-amber-800", changes_requested: "bg-orange-100 text-orange-800", approved: "bg-sky-100 text-sky-800", suspended: "bg-red-100 text-red-800", deactivated: "bg-slate-300 text-slate-700", rejected: "bg-rose-100 text-rose-800", draft: "bg-slate-100 text-slate-600" };
export function SevBadge({ sev }: { sev: string }) { return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${SEV_STYLE[sev] ?? "bg-slate-200"}`}>{sev}</span>; }
export function Pill({ text, style }: { text: string; style: string }) { return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${style}`}>{text.replace("_", " ")}</span>; }
export function EmptyState({ icon, title, body }: { icon: string; title: string; body?: string }) {
  return <div className="text-center py-12 text-slate-400"><div className="text-5xl mb-2">{icon}</div><p className="font-semibold text-slate-500">{title}</p>{body && <p className="text-sm mt-1">{body}</p>}</div>;
}
export const inputCls = "w-full border rounded-xl p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white";
export const btnPrimary = "bg-teal-800 hover:bg-teal-900 text-white font-semibold px-5 py-3 rounded-xl disabled:opacity-50";
export const btnGhost = "border border-slate-300 hover:bg-slate-50 font-medium px-4 py-2.5 rounded-xl disabled:opacity-50";
