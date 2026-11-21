"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { inputCls, btnPrimary } from "@/components/ui";

export default function OfficerUpdate({ id }: { id: string }) {
  const [status, setStatus] = useState("in_progress"); const [note, setNote] = useState("");
  const [paths, setPaths] = useState<string[]>([]); const [previews, setPreviews] = useState<string[]>([]);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false);

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setMsg("");
    for (const file of Array.from(files)) {
      const r = await fetch("/api/uploads/sign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bucket: "complaint-photos", filename: file.name }) });
      const j = await r.json();
      if (!r.ok) { setMsg(j.error?.message ?? "Photo upload failed"); setUploading(false); return; }
      const { error } = await supabaseBrowser().storage.from("complaint-photos").uploadToSignedUrl(j.path, j.token, file);
      if (error) { setMsg(error.message); setUploading(false); return; }
      setPaths((p) => [...p, j.path]); setPreviews((p) => [...p, URL.createObjectURL(file)]);
    }
    setUploading(false);
  }
  async function save() {
    if (status === "resolved" && !note.trim()) { setMsg("A resolution note is required to resolve — the citizen reads it."); return; }
    if (status === "resolved" && paths.length === 0) { setMsg("Add at least one after-work photo to resolve — the citizen sees it as proof of the work."); return; }
    setBusy(true); setMsg("");
    const r = await fetch(`/api/department/complaints/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, note: note || undefined, photo_paths: paths.length ? paths : undefined }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setMsg(j.error?.message ?? "Update failed"); return; }
    window.location.reload();
  }
  return (
    <div className="space-y-3">
      <div><label className="text-sm font-medium">Update status</label>
        <select data-testid="officer-status" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="received">Received</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div>
      <div><label className="text-sm font-medium">Note {status === "resolved" && <span className="text-red-600">(required to resolve — the citizen sees this)</span>}</label>
        <textarea data-testid="officer-note" className={inputCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was done? The citizen sees this note." /></div>
      <div><label className="text-sm font-medium">After-work photo {status === "resolved" && <span className="text-red-600">(required to resolve — shown to the citizen)</span>}</label>
        <input data-testid="officer-photo" type="file" accept="image/*" multiple className="block w-full text-sm mt-1" onChange={(e) => addPhotos(e.target.files)} />
        {uploading && <p className="text-xs text-slate-500 mt-1">Uploading photo…</p>}
        {previews.length > 0 && <div className="flex gap-2 mt-2 flex-wrap">{previews.map((u) => <img key={u} src={u} alt="After-work" className="w-20 h-20 object-cover rounded-lg border" />)}</div>}
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <button data-testid="officer-save" className={`${btnPrimary} w-full`} disabled={busy || uploading} onClick={save}>{busy ? "Saving…" : "Save update"}</button>
    </div>
  );
}
