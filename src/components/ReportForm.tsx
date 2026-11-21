"use client";
import { useState } from "react";
import Link from "next/link";
import { inputCls, btnPrimary, btnGhost, SevBadge } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ReportForm({ wards, categories }: { wards: any[]; categories: any[] }) {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState(""); const [wardId, setWardId] = useState<number | "">("");
  const [address, setAddress] = useState(""); const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<any>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">(""); const [severity, setSeverity] = useState("medium");
  const [deptId, setDeptId] = useState(""); const [deptOptions, setDeptOptions] = useState<any[]>([]);
  const [done, setDone] = useState<any>(null);
  const [listening, setListening] = useState(false); const [vlang, setVlang] = useState("en-IN");

  async function uploadPhoto(file: File) {
    const r = await fetch("/api/uploads/sign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bucket: "complaint-photos", filename: file.name }) });
    const j = await r.json(); if (!r.ok) { setErr(j.error?.message ?? "Upload failed"); return; }
    const { error } = await supabaseBrowser().storage.from("complaint-photos").uploadToSignedUrl(j.path, j.token, file);
    if (error) { setErr(error.message); return; }
    setPhotoPaths((p) => [...p, j.path]);
  }
  async function analyze(text?: string) {
    const desc = (text ?? description).trim();
    setBusy(true); setErr("");
    const r = await fetch("/api/complaints/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ description: desc, ward_id: wardId }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setErr(j.error?.message ?? "Analysis failed"); return; }
    setAnalysis(j); setCategoryId(j.category_id ?? ""); setSeverity(j.severity); setDeptOptions(j.departments); setDeptId(j.default_department_id ?? "");
    setStep(2);
  }
  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setErr("Voice input is not supported in this browser — please use Google Chrome, or type your complaint instead."); return; }
    const rec = new SR();
    rec.lang = vlang; rec.interimResults = true; rec.continuous = false;
    setErr(""); setListening(true);
    rec.onresult = (e: any) => {
      let finalText = ""; let interim = "";
      for (let i = 0; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript; }
      setDescription(finalText || interim);
      if (finalText.trim().length >= 8) { setListening(false); if (wardId) { analyze(finalText.trim()); } }
    };
    rec.onerror = (e: any) => { setListening(false); if (e.error === "not-allowed") setErr("Microphone permission was blocked — allow the mic in your browser and try again, or type instead."); };
    rec.onend = () => setListening(false);
    try { rec.start(); } catch { setListening(false); }
  }
  async function changeCategory(id: number) {
    setCategoryId(id);
    const r = await fetch(`/api/complaints/candidates?ward_id=${wardId}&category_id=${id}`);
    const j = await r.json(); setDeptOptions(j.departments ?? []); setDeptId("");
  }
  async function submit() {
    setBusy(true); setErr("");
    const r = await fetch("/api/complaints", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      description, ward_id: wardId, category_id: categoryId, severity, department_id: deptId, address, photo_paths: photoPaths,
      language: analysis?.language,
      ai: { category_id: analysis?.category_id, severity: analysis?.severity, confidence: analysis?.confidence, reason: analysis?.reason, department_id: analysis?.default_department_id },
    }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setErr(j.error?.message ?? "Submission failed"); return; }
    setDone(j.complaint);
  }
  if (done) return (
    <div className="glass rounded-2xl p-8 text-center">
      <div className="text-6xl mb-3">✅</div><h2 className="text-2xl font-bold">Complaint submitted</h2>
      <p className="text-slate-500 mt-2">Your ticket number is <b className="text-emerald-800 text-xl">{done.ticket_no}</b>. The department you confirmed has received it.</p>
      <Link href={`/citizen/complaints/${done.id}`} className={`${btnPrimary} inline-block mt-6`}>Track my complaint →</Link>
    </div>
  );
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex gap-2 mb-6 text-sm font-medium">
        {["1 · Describe", "2 · AI suggests, you confirm", "3 · Submit"].map((s, i) => (
          <span key={s} className={`px-3 py-1.5 rounded-full ${step === i + 1 ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-500"}`}>{s}</span>))}
      </div>
      {err && <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">{err}</p>}
      {step === 1 && (
        <div className="space-y-4">
          <div><label className="text-sm font-medium">What is the problem? *</label>
            <textarea data-testid="report-description" className={inputCls} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Main water pipe burst near the bus stop, road is flooded. Write in any language — or tap the mic and speak." /></div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button type="button" data-testid="report-voice" onClick={startVoice} disabled={listening} className={`px-4 py-2.5 rounded-xl font-semibold text-white shadow transition ${listening ? "bg-red-500 animate-pulse" : "bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-lime-500"}`}>{listening ? "🔴 Listening… speak now" : "🎤 Speak your complaint"}</button>
            <select aria-label="Voice language" className="border border-emerald-200 rounded-xl px-3 py-2.5 bg-white/80 text-sm" value={vlang} onChange={(e) => setVlang(e.target.value)}>
              <option value="en-IN">English</option><option value="kn-IN">ಕನ್ನಡ (Kannada)</option><option value="hi-IN">हिन्दी (Hindi)</option>
            </select>
            <span className="text-xs text-slate-500">Speak in your language — we fill the form and the AI fills the rest. Pick your ward first, then speak.</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium">Ward *</label>
              <select data-testid="report-ward" className={inputCls} value={wardId} onChange={(e) => setWardId(Number(e.target.value))}><option value="">Choose your ward</option>{wards.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.zone})</option>)}</select></div>
            <div><label className="text-sm font-medium">Address / landmark</label>
              <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 5th Cross, near bus stop" /></div>
          </div>
          <div><label className="text-sm font-medium">Photos (optional, up to 10MB each)</label>
            <input type="file" accept="image/*" multiple className="block mt-1 text-sm" onChange={(e) => { [...(e.target.files ?? [])].forEach(uploadPhoto); }} />
            {photoPaths.length > 0 && <p className="text-xs text-emerald-700 mt-1">📷 {photoPaths.length} photo(s) attached</p>}</div>
          <button data-testid="report-analyze" className={`${btnPrimary} w-full`} disabled={busy || description.trim().length < 8 || !wardId} onClick={() => analyze()}>{busy ? "Analysing…" : "🤖 Analyse with AI"}</button>
        </div>
      )}
      {step === 2 && analysis && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm">
            <p>🤖 <b>AI analysis</b> ({analysis.source === "fallback" ? "built-in engine" : analysis.source}) — confidence {Math.round((analysis.confidence ?? 0) * 100)}%</p>
            <p className="mt-1">{analysis.reason}</p>
            {analysis.translated_text && analysis.language !== "en" && <p className="mt-1 text-slate-500">Translation for the department: “{analysis.translated_text}”</p>}
            {analysis.similar_ticket && <p className="mt-1 text-amber-700">⚠️ A similar report exists ({analysis.similar_ticket}). You can still submit — duplicates are never auto-merged.</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium">Category (you can change it)</label>
              <select data-testid="report-category" className={inputCls} value={categoryId} onChange={(e) => changeCategory(Number(e.target.value))}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="text-sm font-medium">Severity</label>
              <select data-testid="report-severity" className={inputCls} value={severity} onChange={(e) => setSeverity(e.target.value)}>{["low", "medium", "high", "critical"].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></div>
          </div>
          <div>
            <label className="text-sm font-medium">Department — AI suggests, <b>you confirm</b></label>
            {deptOptions.length === 0 ? <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-1">No active department covers this ward and category yet. Try another category, or check back later.</p> :
              <div className="space-y-2 mt-2">{deptOptions.map((d: any) => (
                <label key={d.id} className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer ${deptId === d.id ? "border-emerald-700 bg-emerald-50" : ""}`}>
                  <input data-testid="report-department" type="radio" name="dept" checked={deptId === d.id} onChange={() => setDeptId(d.id)} />
                  <span className="flex-1"><b>{d.name}</b>{d.reason && <span className="block text-xs text-slate-500">{d.reason}</span>}</span>
                  {d.confidence != null && <span className="text-xs font-semibold text-emerald-800">{Math.round(d.confidence * 100)}% match</span>}
                </label>))}</div>}
          </div>
          <div className="flex gap-3">
            <button className={btnGhost} onClick={() => setStep(1)}>← Back</button>
            <button data-testid="report-submit" className={`${btnPrimary} flex-1`} disabled={busy || !deptId || !categoryId} onClick={submit}>{busy ? "Submitting…" : "✅ Confirm and submit complaint"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
