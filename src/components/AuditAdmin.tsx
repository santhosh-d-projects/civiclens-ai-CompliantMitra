"use client";
import { useCallback, useEffect, useState } from "react";
import { btnGhost, EmptyState } from "@/components/ui";

export default function AuditAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [action, setAction] = useState("");
  const [sel, setSel] = useState<any>(null);
  const [verify, setVerify] = useState<any>(null);
  const [chain, setChain] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const q = action ? `?action=${encodeURIComponent(action)}` : "";
    const r = await fetch(`/api/admin/audit${q}`); const j = await r.json();
    setRows(j.audit ?? []);
  }, [action]);
  useEffect(() => { load(); }, [load]);

  async function openForensic(row: any) {
    setSel(row); setVerify(null);
    const r = await fetch(`/api/admin/audit/${row.seq}/verify`); const j = await r.json();
    setVerify(j);
  }
  async function reverifyChain() {
    setBusy(true);
    const r = await fetch("/api/admin/audit/verify-chain"); const j = await r.json();
    setChain(j); setBusy(false);
    if (sel) openForensic(sel);
  }
  const ok = verify && verify.verify?.hash_ok && verify.verify?.prev_ok && verify.signature_ok !== false;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input className="border rounded-xl p-2.5 text-sm flex-1 min-w-[200px]" placeholder="Filter by action, e.g. DEPARTMENT_ACTIVE" value={action} onChange={(e) => setAction(e.target.value)} />
        <button data-testid="audit-reverify" className={btnGhost} disabled={busy} onClick={reverifyChain}>{busy ? "Verifying…" : "🔗 Re-verify whole chain"}</button>
        {chain && <span className={`text-sm font-semibold ${chain.chain_ok ? "text-emerald-700" : "text-red-600"}`}>{chain.chain_ok ? "✅ Chain verified end to end" : `❌ Chain broken at record #${chain.broken_at}`}</span>}
      </div>
      <div className="glass rounded-2xl overflow-x-auto">
        {rows.length === 0 ? <EmptyState icon="🧾" title="No audit events" /> : (
          <table className="w-full text-sm min-w-[820px]">
            <thead><tr className="text-left text-slate-400 border-b"><th className="p-3">#</th><th>Time (UTC)</th><th>Action</th><th>Actor</th><th>Entity</th><th>Change</th><th>Signed</th></tr></thead>
            <tbody>{rows.map((a) => (
              <tr key={a.seq} data-testid="audit-row" className="border-b last:border-0 hover:bg-emerald-50 cursor-pointer" onClick={() => openForensic(a)}>
                <td className="p-3 font-mono text-xs">{a.seq}</td><td className="text-xs">{new Date(a.ts).toISOString().replace("T", " ").slice(0, 19)}Z</td>
                <td className="font-medium">{a.action.replace(/_/g, " ")}</td><td>{a.actor_role ?? "system"}</td>
                <td className="text-xs">{a.entity_type}</td><td className="text-xs">{a.old_status ? `${a.old_status} → ${a.new_status}` : a.new_status ?? "—"}</td>
                <td>{a.audit_signatures ? "✍️" : "—"}</td>
              </tr>))}</tbody>
          </table>)}
      </div>

      {sel && (
        <div className="fixed inset-0 z-20 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSel(null)} />
          <aside className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl p-6" data-testid="forensic-drawer">
            <div className="flex items-start gap-2"><h3 className="text-xl font-bold flex-1">🔍 Forensic detail — record #{sel.seq}</h3><button className="text-slate-400 text-xl" onClick={() => setSel(null)}>✕</button></div>
            {verify ? (
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold ${ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>{ok ? "✅ Chain verified" : "❌ Tampered / broken"}</span>
            ) : <p className="text-sm text-slate-400 mt-2">Verifying…</p>}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
              <div><dt className="text-slate-400">Event ID</dt><dd className="font-mono text-xs break-all">{sel.event_id}</dd></div>
              <div><dt className="text-slate-400">Time (UTC)</dt><dd className="font-medium">{new Date(sel.ts).toISOString()}</dd></div>
              <div><dt className="text-slate-400">Actor</dt><dd className="font-medium">{sel.actor_role ?? "system"} {sel.actor_id ? `(${sel.actor_id.slice(0, 8)}…)` : ""}</dd></div>
              <div><dt className="text-slate-400">IP / device</dt><dd className="font-medium text-xs break-all">{sel.ip ?? "—"} · {sel.device ?? "—"}</dd></div>
              <div><dt className="text-slate-400">Entity</dt><dd className="font-medium">{sel.entity_type}</dd></div>
              <div><dt className="text-slate-400">Change</dt><dd className="font-medium">{sel.old_status ?? "—"} → {sel.new_status ?? "—"}</dd></div>
              <div className="col-span-2"><dt className="text-slate-400">Justification</dt><dd className="font-medium">{sel.reason ?? "—"}</dd></div>
            </dl>
            <h4 className="font-bold mt-6 mb-2">✍️ Signature certificate</h4>
            {verify?.signature ? (
              <dl className="text-sm space-y-1.5">
                <div className="flex gap-2"><dt className="text-slate-400 w-28">Signer</dt><dd>Platform Audit Signer</dd></div>
                <div className="flex gap-2"><dt className="text-slate-400 w-28">Algorithm</dt><dd>{verify.signature.algorithm ?? "Ed25519"}</dd></div>
                <div className="flex gap-2"><dt className="text-slate-400 w-28">Key ID</dt><dd className="font-mono text-xs">{verify.signature.key_id}</dd></div>
                <div className="flex gap-2"><dt className="text-slate-400 w-28">Fingerprint</dt><dd className="font-mono text-xs break-all">{verify.signature.fingerprint}</dd></div>
                <div className="flex gap-2"><dt className="text-slate-400 w-28">Validity</dt><dd className="text-xs">{verify.signature.valid_from ? new Date(verify.signature.valid_from).toLocaleDateString("en-IN") : "—"} → {verify.signature.valid_to ? new Date(verify.signature.valid_to).toLocaleDateString("en-IN") : "no expiry set"}</dd></div>
                <div className="flex gap-2"><dt className="text-slate-400 w-28">Signature</dt><dd className="font-mono text-[10px] break-all">{verify.signature.signature}</dd></div>
                <div className="flex gap-2"><dt className="text-slate-400 w-28">Signature check</dt><dd className="font-semibold">{verify.signature_ok ? "✅ Valid" : "❌ Invalid"}</dd></div>
              </dl>
            ) : <p className="text-sm text-slate-400">This record has no signature yet — use Re-verify to backfill signatures.</p>}
            <h4 className="font-bold mt-6 mb-2">🧾 Verification receipt</h4>
            {verify && (
              <dl className="text-sm space-y-1.5">
                <div className="flex gap-2"><dt className="text-slate-400 w-28">Record hash</dt><dd className="font-mono text-[10px] break-all">{sel.record_hash}</dd></div>
                <div className="flex gap-2"><dt className="text-slate-400 w-28">Previous hash</dt><dd className="font-mono text-[10px] break-all">{sel.prev_hash}</dd></div>
                <div className="flex gap-2"><dt className="text-slate-400 w-28">Hash check</dt><dd className="font-semibold">{verify.verify?.hash_ok ? "✅ Recomputed hash matches" : "❌ Hash mismatch"}</dd></div>
                <div className="flex gap-2"><dt className="text-slate-400 w-28">Chain position</dt><dd>{verify.chain_position}</dd></div>
              </dl>
            )}
            <div className="flex gap-2 mt-6">
              <button className={btnGhost} onClick={() => openForensic(sel)}>↻ Re-verify</button>
              <a className={btnGhost} href={`/api/admin/audit/${sel.seq}/export`} download>⬇ Export JSON</a>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
