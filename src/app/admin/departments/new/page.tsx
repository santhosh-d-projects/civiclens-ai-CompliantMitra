import { supabaseAdmin } from "@/lib/supabase/server";
import DepartmentForm from "@/components/DepartmentForm";
export const dynamic = "force-dynamic";
export default async function NewDepartment() {
  const admin = supabaseAdmin();
  const [w, c] = await Promise.all([admin.from("wards").select("*").order("name"), admin.from("categories").select("*").order("id")]);
  return (<div className="max-w-3xl"><h2 className="text-2xl font-bold mb-1">Create a department</h2>
    <p className="text-slate-500 mb-5">Admin-created departments go through the same review: approve, verify documents, then activate with typed confirmation.</p>
    <DepartmentForm wards={w.data ?? []} categories={c.data ?? []} endpoint="/api/admin/departments" submitLabel="Create department (enters review)" doneText="The department was created and is now in Pending review. Approve it, verify its documents, then activate it from the Departments page." /></div>);
}
