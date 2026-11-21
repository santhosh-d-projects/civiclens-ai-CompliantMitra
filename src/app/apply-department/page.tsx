import { supabaseAdmin } from "@/lib/supabase/server";
import DepartmentForm from "@/components/DepartmentForm";
export const dynamic = "force-dynamic";
export default async function ApplyDepartment() {
  const admin = supabaseAdmin();
  const [w, c] = await Promise.all([admin.from("wards").select("*").order("name"), admin.from("categories").select("*").order("id")]);
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <a href="/" className="text-sm text-emerald-800 font-medium">← Back to portal</a>
      <h1 className="text-3xl font-bold mt-3 mb-1">Apply as a department</h1>
      <p className="text-slate-500 mb-6">Departments are reviewed by the platform Admin. You can sign in only after your department is <b>approved and activated</b> — approval alone is not enough. If changes are requested, you will be told what to fix.</p>
      <DepartmentForm wards={w.data ?? []} categories={c.data ?? []} endpoint="/api/departments/apply" submitLabel="Submit application for review" doneText="Your application is now Pending review. The Admin will verify your documents and officer details. Watch your official email for the officer invite after activation." />
    </main>
  );
}
