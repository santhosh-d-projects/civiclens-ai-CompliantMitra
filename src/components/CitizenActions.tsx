"use client";
import { useState } from "react";
import { btnGhost } from "@/components/ui";
export default function CitizenActions({ id, status }: { id: string; status: string }) {
  const [rating, setRating] = useState(5); const [msg, setMsg] = useState("");
  async function feedback() {
    const r = await fetch(`/api/complaints/${id}/feedback`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating }) });
    setMsg(r.ok ? "Thanks for your feedback ⭐" : "Could not save feedback");
  }
  async function reopen() {
    const r = await fetch(`/api/complaints/${id}/reopen`, { method: "POST" });
    if (r.ok) window.location.reload(); else setMsg("Could not reopen this complaint");
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      {(status === "resolved" || status === "closed") && <>
        <label className="text-sm">Rate the resolution:
          <select className="border rounded-lg p-1.5 ml-2" value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} ⭐</option>)}</select></label>
        <button className={btnGhost} onClick={feedback}>Submit rating</button>
        <button className={btnGhost} onClick={reopen}>↩ Reopen complaint</button>
      </>}
      {msg && <span className="text-sm text-emerald-800">{msg}</span>}
    </div>
  );
}
