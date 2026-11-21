"use client";
import { useState } from "react";
import { inputCls, btnPrimary } from "@/components/ui";

export default function DepartmentForm({ wards, categories, endpoint, submitLabel, doneText }: { wards: any[]; categories: any[]; endpoint: string; submitLabel: string; doneText: string }) {
  const [f, setF] = useState({ name: "", description: "", official_email: "", official_phone: "", applicant_name: "", officer_name: "", officer_email: "", officer_phone: "", documents: "" });
  const [wardIds, setWardIds] = useState<number[]>([]); const [catIds, setCatIds] = useState<number[]>([]);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const toggle = (list: number[], setList: any, v: number) => setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const docs = f.documents.split("\n").map((s) => s.trim()).filter(Boolean).map((name, i) => ({ name, file_path: `applications/${Date.now()}-${i}-${name.replace(/\W+/g, "_")}` }));
    const r = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      name: f.name, description: f.description, official_email: f.official_email, official_phone: f.official_phone, applicant_name: f.applicant_name,
      ward_ids: wardIds, category_ids: catIds, officer: { name: f.officer_name, email: f.officer_email, phone: f.officer_phone }, documents: docs }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setMsg(j.error?.message ?? "Submission failed"); return; }
    setDone(true);
  }
  if (done) return <div className="bg-white rounded-2xl shadow p-8 text-center"><div className="text-5xl mb-2">📨</div><h3 className="text-xl font-bold">Submitted</h3><p className="text-slate-500 mt-2">{doneText}</p></div>;
  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow p-6 space-y-5">
      <div><h3 className="font-bold mb-2">🏛️ Department details</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input data-testid="dept-name" className={inputCls} required placeholder="Department name *" value={f.name} onChange={set("name")} />
          <input className={inputCls} required placeholder="Applicant name *" value={f.applicant_name} onChange={set("applicant_name")} />
          <input className={inputCls} required type="email" placeholder="Official email *" value={f.official_email} onChange={set("official_email")} />
          <input className={inputCls} placeholder="Official phone" value={f.official_phone} onChange={set("official_phone")} />
        </div>
        <textarea className={`${inputCls} mt-3`} rows={2} placeholder="What does this department do?" value={f.description} onChange={set("description")} /></div>
      <div><h3 className="font-bold mb-2">📍 Wards served *</h3>
        <div className="flex flex-wrap gap-2">{wards.map((w) => <button type="button" key={w.id} onClick={() => toggle(wardIds, setWardIds, w.id)} className={`px-3 py-1.5 rounded-full text-sm border ${wardIds.includes(w.id) ? "bg-teal-800 text-white border-teal-800" : "bg-white"}`}>{w.name}</button>)}</div></div>
      <div><h3 className="font-bold mb-2">📂 Categories handled *</h3>
        <div className="flex flex-wrap gap-2">{categories.map((c) => <button type="button" key={c.id} onClick={() => toggle(catIds, setCatIds, c.id)} className={`px-3 py-1.5 rounded-full text-sm border ${catIds.includes(c.id) ? "bg-teal-800 text-white border-teal-800" : "bg-white"}`}>{c.name}</button>)}</div></div>
      <div><h3 className="font-bold mb-2">👤 First officer</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <input className={inputCls} required placeholder="Officer name *" value={f.officer_name} onChange={set("officer_name")} />
          <input className={inputCls} required type="email" placeholder="Officer email *" value={f.officer_email} onChange={set("officer_email")} />
          <input className={inputCls} placeholder="Officer phone" value={f.officer_phone} onChange={set("officer_phone")} />
        </div></div>
      <div><h3 className="font-bold mb-2">📄 Documents</h3>
        <textarea className={inputCls} rows={2} placeholder={"One document name per line, e.g.\nGovernment order / registration\nAuthorisation letter"} value={f.documents} onChange={set("documents")} />
        <p className="text-xs text-slate-400 mt-1">The Admin verifies each document in the review drawer before activation is possible.</p></div>
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <button data-testid="dept-submit" className={`${btnPrimary} w-full`} disabled={busy || !wardIds.length || !catIds.length}>{busy ? "Submitting…" : submitLabel}</button>
    </form>
  );
}
