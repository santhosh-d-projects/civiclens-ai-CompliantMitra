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
      <header className="bg-[#17324d] text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-3xl">🛡️</span>
          <div className="flex-1"><h1 className="text-2xl font-bold">Complaint Sathi</h1><p className="text-teal-200 text-sm">Bengaluru civic complaints — AI suggests, you confirm.</p></div>
          <nav className="flex gap-2 text-sm">
            <Link className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20" href="/apply-department">Apply as a Department</Link>
            <Link className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold" href="/login">Sign in</Link>
          </nav>
        </div>
      </header>
      <section className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-4xl font-bold leading-tight">Report a civic issue.<br />Get it to the right department, fast.</h2>
          <p className="text-slate-600 mt-4 text-lg">Potholes, water leaks, garbage, fallen trees — describe the problem in your own language. Our AI suggests the category, severity and department. <b>You confirm</b> before anything is submitted. Nothing is auto-routed.</p>
          <div className="flex gap-3 mt-6">
            <Link href="/login" className="bg-teal-800 hover:bg-teal-900 text-white font-semibold px-6 py-3 rounded-xl">📝 Report an issue</Link>
            <Link href="/apply-department" className="border border-slate-300 hover:bg-white font-medium px-6 py-3 rounded-xl">🏛️ Department onboarding</Link>
          </div>
          <div className="flex gap-6 mt-8 text-center">
            <div><div className="text-3xl font-bold text-teal-800">{deptCount}</div><div className="text-xs text-slate-500">ACTIVE DEPARTMENTS</div></div>
            <div><div className="text-3xl font-bold text-teal-800">12</div><div className="text-xs text-slate-500">WARDS COVERED</div></div>
            <div><div className="text-3xl font-bold text-teal-800">{cats.length}</div><div className="text-xs text-slate-500">ISSUE CATEGORIES</div></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-bold mb-3">How it works</h3>
          <ol className="space-y-3 text-[15px]">
            <li>✍️ <b>Describe</b> — free text in English, Kannada, Hindi or any language, with photos.</li>
            <li>🤖 <b>AI suggests</b> — category, severity with a plain reason, and the departments that can take it.</li>
            <li>✅ <b>You confirm</b> — change the department if you disagree, then submit.</li>
            <li>📍 <b>Track</b> — follow the ticket timeline until the officer resolves it.</li>
          </ol>
          <div className="flex flex-wrap gap-1.5 mt-5">{cats.map((c) => <span key={c.slug} className="bg-teal-50 text-teal-900 text-xs px-2 py-1 rounded-full border border-teal-100">{c.name}</span>)}</div>
        </div>
      </section>
      <footer className="text-center text-xs text-slate-400 pb-8">Complaint Sathi — a Prompt to Product prototype by Team CompliantMitra. Demo data is illustrative.</footer>
    </main>
  );
}
