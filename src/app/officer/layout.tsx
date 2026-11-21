import Link from "next/link";
import SignOut from "@/components/SignOut";
import { requirePageRole, officerDept } from "@/lib/session";
export default async function OfficerLayout({ children }: { children: React.ReactNode }) {
  const p = await requirePageRole("department_officer");
  const dept = await officerDept(p);
  return (
    <div className="min-h-screen">
      <header className="bg-[#111B45]/90 backdrop-blur-md shadow-lg shadow-indigo-950/20 text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/officer" className="font-bold text-lg">🛡️ Complaint Sathi</Link>
          <span className="text-teal-200 text-sm hidden sm:inline">{dept?.name ?? "Department"}</span>
          <nav className="flex gap-1 text-sm ml-2">
            <Link className="px-3 py-1.5 rounded-lg hover:bg-white/10" href="/officer">Dashboard</Link>
            <Link className="px-3 py-1.5 rounded-lg hover:bg-white/10" href="/officer/complaints">My Complaints</Link>
            <Link className="px-3 py-1.5 rounded-lg hover:bg-white/10" href="/officer/profile">Department Profile</Link>
          </nav>
          <div className="ml-auto"><SignOut /></div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
