import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function Home() {
  let deptCount = 0, cats: any[] = [];
  try {
    const admin = supabaseAdmin();
    const d = await admin.from("departments").select("id", { count: "exact", head: true }).eq("status", "active");
    deptCount = d.count ?? 0;
    const c = await admin.from("categories").select("name,slug").order("id");
    cats = c.data ?? [];
  } catch {}
  return (
    <main className="min-h-screen">
      <header className="bg-[#04241A]/90 backdrop-blur-md text-white sticky top-0 z-20 shadow-lg shadow-emerald-950/30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <span className="text-3xl">🛡️</span>
          <div className="flex-1"><span className="font-display font-bold text-lg leading-none">Complaint Sathi</span><p className="text-emerald-200/90 text-xs mt-0.5">Bengaluru civic complaints — AI suggests, you confirm.</p></div>
          <nav className="flex gap-2 text-sm">
            <Link className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/25 hover:text-emerald-100" href="/apply-department">Apply as a Department</Link>
            <Link className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-lime-400 font-semibold shadow-lg shadow-emerald-950/40" href="/login">Sign in</Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <img src="/images/vidhana-soudha.jpg" alt="Vidhana Soudha, Bengaluru" className="absolute inset-0 w-full h-full object-cover blur-[1.5px] scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/70 to-emerald-900/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase bg-white/15 text-emerald-50 border border-white/25 backdrop-blur px-3 py-1.5 rounded-full">✦ Bengaluru Civic Complaints</span>
          <h1 className="text-white font-display font-extrabold text-5xl md:text-6xl leading-[1.05] mt-5 drop-shadow-lg">Complaint Sathi</h1>
          <p className="font-display font-bold text-3xl md:text-4xl mt-2"><span className="text-white drop-shadow">Your Voice. </span><span className="bg-gradient-to-r from-emerald-300 via-green-300 to-lime-300 bg-clip-text text-transparent">Our Priority.</span></p>
          <p className="text-emerald-50/95 text-lg mt-5 max-w-xl drop-shadow">Raise complaints, track progress and help build a better Bengaluru. Describe the problem in your own language — our AI suggests the category, severity and department. <b className="text-white">You confirm</b> before anything is submitted. Nothing is auto-routed.</p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link href="/login" className="bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-lime-400 text-white font-semibold px-6 py-3 rounded-xl shadow-xl shadow-emerald-950/40 transition">📝 Report an issue</Link>
            <Link href="/apply-department" className="bg-white/15 hover:bg-white/30 text-white border border-white/35 backdrop-blur font-medium px-6 py-3 rounded-xl transition">🏛️ Department onboarding</Link>
          </div>
          <div className="flex flex-wrap gap-3 mt-9">
            <div className="bg-white/12 border border-white/25 backdrop-blur rounded-2xl px-5 py-3.5 text-white"><span className="text-2xl font-bold font-display">{deptCount}+</span><span className="block text-[11px] uppercase tracking-wide text-emerald-100/90">Active departments</span></div>
            <div className="bg-white/12 border border-white/25 backdrop-blur rounded-2xl px-5 py-3.5 text-white"><span className="text-2xl font-bold font-display">12+</span><span className="block text-[11px] uppercase tracking-wide text-emerald-100/90">Wards covered</span></div>
            <div className="bg-white/12 border border-white/25 backdrop-blur rounded-2xl px-5 py-3.5 text-white"><span className="text-2xl font-bold font-display">{cats.length}+</span><span className="block text-[11px] uppercase tracking-wide text-emerald-100/90">Issue categories</span></div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 items-start">
        <div className="glass lift rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-3">How it works</h3>
          <ol className="space-y-3 text-[15px]">
            <li>✍️ <b>Describe</b> — free text in English, Kannada, Hindi or any language, with photos.</li>
            <li>🤖 <b>AI suggests</b> — category, severity with a plain reason, and the departments that can take it.</li>
            <li>✅ <b>You confirm</b> — change the department if you disagree, then submit.</li>
            <li>📍 <b>Track</b> — follow the ticket timeline, the officer's notes and the after-work photo until it is resolved.</li>
          </ol>
          <div className="flex flex-wrap gap-1.5 mt-5">{cats.map((c) => <span key={c.slug} className="bg-emerald-50/80 text-emerald-900 text-xs px-2 py-1 rounded-full border border-emerald-100">{c.name}</span>)}</div>
        </div>
        <div className="glass lift rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-3">Built on trust, not just tickets</h3>
          <ul className="space-y-3 text-[15px]">
            <li>🏛️ <b>Verified departments only</b> — a department cannot log in until the Admin approves <i>and</i> activates it.</li>
            <li>🚫 <b>No duplicates</b> — filing the exact same complaint twice is rejected with the original ticket number.</li>
            <li>🔗 <b>Tamper-evident audit</b> — every approval and status change is hash-chained and signed; anyone can verify the chain.</li>
            <li>🖼️ <b>Proof of work</b> — resolution needs a note and an after-work photo that you can see.</li>
          </ul>
        </div>
      </section>
      <footer className="text-center text-xs text-slate-500 pb-8 px-4">Complaint Sathi — a Prompt to Product prototype by Team CompliantMitra. Demo data is illustrative.<br />Hero photo: Vidhana Soudha by Wilhelm Tell DCCXLVI, Wikimedia Commons (CC0).</footer>
    </main>
  );
}
