"use client";
import { useState } from "react";
import { inputCls, btnPrimary } from "@/components/ui";
export default function OfficerUpdate({ id }: { id: string }) {
  const [status, setStatus] = useState("in_progress"); const [note, setNote] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true); setMsg("");
    const r = await fetch(`/api/department/complaints/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, note: note || undefined }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setMsg(j.error?.message ?? "Update failed"); return; }
    window.location.reload();
  }
  return (
    <div className="space-y-3">
      <div><label className="text-sm font-medium">Update status</label>
        <select data-testid="officer-status" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="received">Received</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div>
      <div><label className="text-sm font-medium">Note {status === "resolved" && <span className="text-red-600">(required to resolve)</span>}</label>
        <textarea data-testid="officer-note" className={inputCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was done? The citizen sees this note." /></div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <button data-testid="officer-save" className={`${btnPrimary} w-full`} disabled={busy} onClick={save}>{busy ? "Saving…" : "Save update"}</button>
    </div>
  );
}
