"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { firebaseEnabled, sendFirebaseEmailVerification } from "@/lib/firebase";
import { inputCls, btnPrimary } from "@/components/ui";

export default function Register() {
  const [fullName, setFullName] = useState(""); const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [useFirebase, setUseFirebase] = useState(false);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const fb = firebaseEnabled();

  async function register(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setMsg("");
    if (password !== confirm) { setErr("Passwords do not match."); return; }
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setBusy(true);
    const { data, error } = await supabaseBrowser().auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (error) { setBusy(false); setErr(error.message); return; }
    let note = "";
    if (useFirebase && fb) {
      const r = await sendFirebaseEmailVerification(email, password);
      note = r === "sent" ? " A Firebase verification email was also sent — please click the link in it to verify your email." : " (Firebase verification email could not be sent; your account is still created.)";
    }
    setBusy(false);
    if (data.session) { window.location.href = "/citizen"; return; }
    setMsg("Account created." + note + " You can now sign in with your email and password.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <div className="text-center mb-6"><div className="text-5xl">🛡️</div><h1 className="text-2xl font-bold mt-2">Create your citizen account</h1><p className="text-slate-500 text-sm">Register with your email and a password</p></div>
        <form onSubmit={register} className="space-y-3">
          <input data-testid="register-name" className={inputCls} required placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input data-testid="register-email" className={inputCls} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input data-testid="register-password" className={inputCls} type="password" required placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input data-testid="register-confirm" className={inputCls} type="password" required placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {fb && (
            <label className="flex items-start gap-2 text-sm text-slate-600 bg-teal-50 border border-teal-100 rounded-lg p-3">
              <input data-testid="register-firebase" type="checkbox" className="mt-0.5" checked={useFirebase} onChange={(e) => setUseFirebase(e.target.checked)} />
              <span><b>Optional:</b> also verify my email with Firebase — Google will email you a verification link (free, no phone number needed).</span>
            </label>
          )}
          <button data-testid="register-submit" className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        </form>
        {err && <p className="text-sm text-center mt-4 text-red-600">{err}</p>}
        {msg && <p className="text-sm text-center mt-4 text-teal-800">{msg}</p>}
        <p className="text-sm text-slate-500 text-center mt-6">Already registered? <a className="text-teal-800 font-medium underline" href="/login">Sign in</a></p>
      </div>
    </main>
  );
}
