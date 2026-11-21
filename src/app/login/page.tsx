"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { inputCls, btnPrimary } from "@/components/ui";

export default function Login() {
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [otpSent, setOtpSent] = useState(false);

  async function goNext() {
    const r = await fetch("/api/me"); const j = await r.json();
    if (!r.ok) { setMsg("Signed in, but no profile was found. Contact the admin."); return; }
    if (j.profile.role === "admin") window.location.href = "/admin";
    else if (j.profile.role === "department_officer") window.location.href = j.department?.status === "active" ? "/officer" : "/officer/blocked";
    else window.location.href = "/citizen";
  }
  async function passwordLogin(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMsg(error.message); else goNext();
  }
  async function sendOtp(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email });
    setBusy(false);
    if (error) setMsg(error.message); else { setOtpSent(true); setMsg("We emailed you a 6-digit code."); }
  }
  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const { error } = await supabaseBrowser().auth.verifyOtp({ email, token: otp, type: "email" });
    setBusy(false);
    if (error) setMsg(error.message); else goNext();
  }
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <div className="text-center mb-6"><div className="text-5xl">🛡️</div><h1 className="text-2xl font-bold mt-2">Complaint Sathi</h1><p className="text-slate-500 text-sm">Sign in to continue</p></div>
        <div className="flex gap-2 mb-5">
          <button onClick={() => setMode("password")} className={`flex-1 py-2 rounded-lg font-medium ${mode === "password" ? "bg-teal-800 text-white" : "bg-slate-100"}`}>Email + password</button>
          <button onClick={() => setMode("otp")} className={`flex-1 py-2 rounded-lg font-medium ${mode === "otp" ? "bg-teal-800 text-white" : "bg-slate-100"}`}>Email OTP (citizens)</button>
        </div>
        {mode === "password" ? (
          <form onSubmit={passwordLogin} className="space-y-3">
            <input data-testid="login-email" className={inputCls} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input data-testid="login-password" className={inputCls} type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button data-testid="login-submit" className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
        ) : !otpSent ? (
          <form onSubmit={sendOtp} className="space-y-3">
            <input className={inputCls} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Sending…" : "Email me a code"}</button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-3">
            <input className={inputCls} inputMode="numeric" required placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Verifying…" : "Verify and sign in"}</button>
          </form>
        )}
        {msg && <p className="text-sm text-center mt-4 text-slate-600">{msg}</p>}
        <p className="text-xs text-slate-400 text-center mt-6">Officers sign in only after the Admin approves and activates their department.</p>
      </div>
    </main>
  );
}
