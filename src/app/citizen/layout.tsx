import Link from "next/link";
import SignOut from "@/components/SignOut";
import { requirePageRole } from "@/lib/session";
export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole("citizen");
  return (
    <div className="min-h-screen">
      <header className="bg-[#04241A]/90 backdrop-blur-md shadow-lg shadow-emerald-950/20 text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/citizen" className="font-bold text-lg">🛡️ Complaint Sathi</Link>
          <nav className="flex gap-1 text-sm ml-2">
            <Link className="px-3 py-1.5 rounded-lg hover:bg-white/10" href="/citizen">Home</Link>
            <Link className="px-3 py-1.5 rounded-lg hover:bg-white/10" href="/citizen/report">Report an issue</Link>
            <Link className="px-3 py-1.5 rounded-lg hover:bg-white/10" href="/citizen/complaints">My complaints</Link>
          </nav>
          <div className="ml-auto"><SignOut /></div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
