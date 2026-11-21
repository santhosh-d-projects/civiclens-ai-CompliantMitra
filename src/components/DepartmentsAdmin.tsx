"use client";
import { useCallback, useEffect, useState } from "react";
import { inputCls, btnPrimary, btnGhost, Pill, DEPT_STATUS_STYLE, EmptyState } from "@/components/ui";

export default function DepartmentsAdmin() {
  const [tab, setTab] = useState("pending");
  const [chip, setChip] = useState("All");
  const [rows, setRows] = useState<any[]>([]);
  const [all, setAll] = useState<any[]>([]);
  const [sel, setSel] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/departments"); const j = await r.json();
    setAll(j.departments ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let list = all;
    if (tab === "pending") list = all.filter((d) => ["pending", "changes_requested"].includes(d.status));
    else if (tab === "approved") { list = all.filter((d) => ["approved", "active", "suspended"].includes(d.status)); if (chip !== "All") list = list.filter((d) => d.status === chip.toLowerCase()); }
    else if (tab === "rejected") list = all.filter((d) => d.status === "rejected");
    else if (tab === "deactivated") list = all.filter((d) => d.status === "deactivated");
    setRows(list);
  }, [all, tab, chip]);

  async function openDrawer(id: string) {
    const r = await fetch(`/api/admin/departments/${id}`); const j = await r.json();
    setSel(j); setReason(""); setConfirmText(""); setMsg("");
  }
  async function act(action: string, extra: any = {}) {
    if (!sel) return;
    setBusy(true); setMsg("");
    const r = await fetch(`/api/admin/departments/${sel.department.id}/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: reason || undefined, confirm: confirmText || undefined, ...extra }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setMsg(j.error?.message ?? "Action failed"); return; }
    if (action === "activate" && j.invites?.length) setMsg(`Activated. Officer invite link(s) generated (also logged on the server): ${j.invites.map((i: any) => i.link).join("  ·  ")}`);
    else if (action === "suspend") { setMsg(`Suspended. ${j.transferred ?? 0} open complaint(s) transferred.`); setSuspendOpen(false); }
    else setMsg("Done.");
    await load(); openDrawer(sel.department.id);
  }
  async function verifyDoc(docId: string, verified: boolean) {
    if (!sel) return;
    await fetch(`/api/admin/departments/${sel.department.id}/documents/${docId}/verify`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verified }) });
    openDrawer(sel.department.id);
  }
  const d = sel?.department;
  const eligibleTargets = all.filter((x) => x.status === "active" && x.id !== d?.id);
  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 mb-4">
        {[["pending", "⏳ Pending"], ["approved", "✅ Approved"], ["rejected", "❌ Rejected"], ["deactivated", "🔒 Deactivated"], ["all", "All"]].map(([k, l]) => (
          <button key={k} data-testid={`dept-tab-${k}`} onClick={() => setTab(k)} className={`px-4 py-2 rounded-xl font-medium ${tab === k ? "bg-teal-800 text-white" : "bg-white shadow"}`}>{l}</button>))}
        {tab === "approved" && ["All", "Active", "Suspended"].map((c) => (
          <button key={c} onClick={() => setChip(c)} className={`px-3 py-2 rounded-full text-sm ${chip === c ? "bg-[#17324d] text-white" : "bg-slate-100"}`}>{c}</button>))}
        <a href="/admin/departments/new" className="ml-auto bg-teal-800 text-white px-4 py-2 rounded-xl font-medium">+ Create department</a>
      </div>
      <div className="glass rounded-2xl overflow-x-auto">
        {rows.length === 0 ? <EmptyState icon="🏛️" title="No departments in this view" /> : (
          <table className="w-full text-sm min-w-[820px]">
            <thead><tr className="text-left text-slate-400 border-b"><th className="p-3">Department</th><th>Applicant</th><th>Service area</th><th>Contact</th><th>Submitted</th><th>Source</th><th>Status</th></tr></thead>
            <tbody>{rows.map((x) => (
              <tr key={x.id} data-testid="dept-row" className="border-b last:border-0 hover:bg-teal-50 cursor-pointer" onClick={() => openDrawer(x.id)}>
                <td className="p-3 font-medium">{x.name}</td><td>{x.applicant_name ?? "—"}</td>
                <td>{x.department_officers?.length ? `${x.department_officers.length} officer(s)` : "—"}</td>
                <td>{x.official_email}<br /><span className="text-xs text-slate-400">{x.official_phone ?? ""}</span></td>
                <td className="text-xs">{new Date(x.created_at).toLocaleDateString("en-IN")}</td>
                <td>{x.source === "applied" ? "Applied online" : "Admin created"}</td>
                <td><Pill text={x.status} style={DEPT_STATUS_STYLE[x.status] ?? "bg-slate-100"} /></td>
              </tr>))}</tbody>
          </table>)}
      </div>

      {sel && d && (
        <div className="fixed inset-0 z-20 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSel(null)} />
          <aside className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl p-6" data-testid="review-drawer">
            <div className="flex items-start gap-2"><h3 className="text-xl font-bold flex-1">{d.name}</h3><Pill text={d.status} style={DEPT_STATUS_STYLE[d.status] ?? "bg-slate-100"} /><button className="text-slate-400 text-xl" onClick={() => setSel(null)}>✕</button></div>
            <p className="text-sm text-slate-500">{d.description}</p>
            {sel.duplicates?.length > 0 && <p className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-3 mt-3">⚠️ Duplicate warning: another department record uses this official email ({sel.duplicates.map((x: any) => `${x.name} — ${x.status}`).join("; ")}).</p>}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
              <div><dt className="text-slate-400">Applicant</dt><dd className="font-medium">{d.applicant_name ?? "—"}</dd></div>
              <div><dt className="text-slate-400">Source</dt><dd className="font-medium">{d.source === "applied" ? "Applied online" : "Admin created"}</dd></div>
              <div><dt className="text-slate-400">Official email</dt><dd className="font-medium">{d.official_email}</dd></div>
              <div><dt className="text-slate-400">Phone</dt><dd className="font-medium">{d.official_phone ?? "—"}</dd></div>
              <div><dt className="text-slate-400">Wards</dt><dd className="font-medium">{sel.wards.map((w: any) => w.wards?.name).join(", ") || "—"}</dd></div>
              <div><dt className="text-slate-400">Categories</dt><dd className="font-medium">{sel.categories.map((c: any) => c.categories?.name).join(", ") || "—"}</dd></div>
            </dl>
            <h4 className="font-bold mt-6 mb-2">👤 Officer</h4>
            {sel.officers.map((o: any) => <p key={o.id} className="text-sm py-1 border-b last:border-0">{o.name} — {o.email} {o.invite_used_at ? <span className="text-emerald-700">(invite accepted)</span> : o.invite_token_hash ? <span className="text-amber-700">(invite sent)</span> : ""}</p>)}
            <h4 className="font-bold mt-6 mb-2">📄 Documents — verify each one</h4>
            {sel.documents.length === 0 && <p className="text-sm text-slate-400">No documents uploaded.</p>}
            {sel.documents.map((doc: any) => (
              <label key={doc.id} className="flex items-center gap-3 text-sm py-2 border-b last:border-0">
                <input type="checkbox" data-testid="doc-verify" checked={!!doc.verified_at} onChange={(e) => verifyDoc(doc.id, e.target.checked)} className="w-5 h-5 accent-teal-800" />
                <span className="flex-1">{doc.name} {doc.verified_at && <span className="text-emerald-700 text-xs">verified {new Date(doc.verified_at).toLocaleDateString("en-IN")}</span>}</span>
                {doc.signed_url && <a className="text-teal-800 font-medium" href={doc.signed_url} target="_blank" rel="noreferrer">View</a>}
              </label>))}
            <h4 className="font-bold mt-6 mb-2">🕘 History</h4>
            <ul className="text-sm space-y-1">{sel.history.map((h: any) => <li key={h.seq} className="text-slate-600">#{h.seq} {h.action.replace(/_/g, " ")} {h.old_status ? `${h.old_status} → ${h.new_status}` : ""} — {new Date(h.ts).toLocaleString("en-IN")}{h.reason ? ` — ${h.reason}` : ""}</li>)}</ul>
            <div className="mt-6 space-y-3 border-t pt-4">
              <textarea className={inputCls} rows={2} placeholder="Reason (required for reject, request changes, suspend, deactivate)" value={reason} onChange={(e) => setReason(e.target.value)} />
              {msg && <p className="text-sm bg-slate-50 border rounded-xl p-3 break-all">{msg}</p>}
              <div className="flex flex-wrap gap-2">
                {["pending", "changes_requested"].includes(d.status) && <>
                  <button data-testid="dept-approve" className={btnPrimary} disabled={busy} onClick={() => act("approve")}>Approve</button>
                  <button data-testid="dept-changes" className={btnGhost} disabled={busy} onClick={() => act("request-changes")}>Request changes</button>
                  <button data-testid="dept-reject" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50" disabled={busy} onClick={() => act("reject")}>Reject</button>
                </>}
                {d.status === "approved" && <>
                  <input data-testid="activate-confirm" className="border rounded-xl p-2.5 flex-1 min-w-[160px]" placeholder="Type ACTIVATE to enable" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
                  <button data-testid="dept-activate" className={btnPrimary} disabled={busy || confirmText !== "ACTIVATE"} onClick={() => act("activate")}>Activate + invite officer</button>
                </>}
                {d.status === "active" && <>
                  <button data-testid="dept-suspend" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl" onClick={() => setSuspendOpen(true)}>Suspend…</button>
                  <button data-testid="dept-deactivate" className={btnGhost} disabled={busy} onClick={() => act("deactivate")}>Deactivate</button>
                </>}
                {d.status === "suspended" && <>
                  <button data-testid="dept-reactivate" className={btnPrimary} disabled={busy} onClick={() => act("reactivate")}>Reactivate</button>
                  <button className={btnGhost} disabled={busy} onClick={() => act("deactivate")}>Deactivate</button>
                </>}
              </div>
            </div>
          </aside>
        </div>
      )}

      {suspendOpen && d && (
        <div className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center px-4" onClick={() => setSuspendOpen(false)}>
          <div className="glass rounded-2xl-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Suspend {d.name}</h3>
            <p className="text-sm text-slate-500 mt-1">Officers are signed out immediately. If the department has open complaints, choose an ACTIVE department that covers the same wards and categories — the move is atomic.</p>
            <label className="block text-sm font-medium mt-4">Reason *</label>
            <textarea className={inputCls} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            <label className="block text-sm font-medium mt-3">Move open complaints to</label>
            <select data-testid="suspend-target" className={inputCls} value={suspendTarget} onChange={(e) => setSuspendTarget(e.target.value)}>
              <option value="">Select an active department</option>
              {eligibleTargets.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {msg && <p className="text-sm text-red-600 mt-2">{msg}</p>}
            <div className="flex gap-2 mt-5">
              <button className={btnGhost} onClick={() => setSuspendOpen(false)}>Cancel</button>
              <button data-testid="suspend-confirm" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl flex-1 disabled:opacity-50" disabled={busy || !reason} onClick={() => act("suspend", { target_department_id: suspendTarget || undefined })}>Suspend department</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
