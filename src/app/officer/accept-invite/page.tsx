"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { inputCls, btnPrimary } from "@/components/ui";
function Form() {
  const token = useSearchParams().get("token") ?? "";
  const [name, setName] = useState(""); const [password, setPassword] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const r = await fetch("/api/officers/accept-invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password, full_name: name }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setMsg(j.error?.message ?? "Could not accept the invite"); return; }
    setDone(true);
  }
  if (done) return <div className="text-center"><div className="text-5xl mb-3">🎉</div><h2 className="text-xl font-bold">Password set</h2><p className="text-slate-500 mt-2">Your officer account is ready. <a className="text-teal-800 font-semibold" href="/login">Sign in →</a></p></div>;
  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="text-xl font-bold text-center">Set up your officer account</h2>
      <p className="text-sm text-slate-500 text-center">You were invited as a department officer. Choose a password to finish.</p>
      <input className={inputCls} required placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={inputCls} required type="password" minLength={8} placeholder="New password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className={`${btnPrimary} w-full`} disabled={busy || !token}>{busy ? "Setting up…" : "Set password and activate my account"}</button>
      {msg && <p className="text-sm text-red-600 text-center">{msg}</p>}
      {!token && <p className="text-sm text-amber-600 text-center">This page needs an invite link with a token.</p>}
    </form>
  );
}
export default function AcceptInvite() {
  return <main className="min-h-screen flex items-center justify-center px-4"><div className="glass rounded-2xl p-8 w-full max-w-md"><Suspense><Form /></Suspense></div></main>;
}
