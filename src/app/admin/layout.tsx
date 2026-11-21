import Link from "next/link";
import SignOut from "@/components/SignOut";
import { requirePageRole } from "@/lib/session";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole("admin");
  return (
    <div className="min-h-screen">
      <header className="bg-[#17324d] text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="font-bold text-lg">🛡️ Complaint Sathi · Admin</Link>
          <nav className="flex gap-1 text-sm ml-2 flex-wrap">
            <Link className="px-3 py-1.5 rounded-lg hover:bg-white/10" href="/admin">Dashboard</Link>
            <Link className="px-3 py-1.5 rounded-lg hover:bg-white/10" href="/admin/departments">Departments</Link>
            <Link className="px-3 py-1.5 rounded-lg hover:bg-white/10" href="/admin/departments/new">Create Department</Link>
            <Link className="px-3 py-1.5 rounded-lg hover:bg-white/10" href="/admin/complaints">Complaints</Link>
            <Link className="px-3 py-1.5 rounded-lg hover:bg-white/10" href="/admin/audit">Audit Log</Link>
            <Link className="px-3 py-1.5 rounded-lg hover:bg-white/10" href="/admin/analytics">Analytics</Link>
          </nav>
          <div className="ml-auto"><SignOut /></div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
