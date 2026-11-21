import { activeOfficerOrBlocked } from "@/lib/officer-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Pill, DEPT_STATUS_STYLE } from "@/components/ui";
export const dynamic = "force-dynamic";
export default async function OfficerProfile() {
  const { profile, dept } = await activeOfficerOrBlocked();
  const admin = supabaseAdmin();
  const [w, c] = await Promise.all([
    admin.from("department_wards").select("wards(name,zone)").eq("department_id", dept.id),
    admin.from("department_categories").select("categories(name)").eq("department_id", dept.id)]);
  return (
    <div className="bg-white rounded-2xl shadow p-6 max-w-3xl">
      <div className="flex items-center gap-3"><h2 className="text-xl font-bold">{dept.name}</h2><Pill text={dept.status} style={DEPT_STATUS_STYLE[dept.status] ?? "bg-slate-100"} /></div>
      <p className="text-slate-500 mt-1">{dept.description}</p>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mt-5">
        <div><dt className="text-slate-400">Officer</dt><dd className="font-medium">{profile.full_name} ({profile.email})</dd></div>
        <div><dt className="text-slate-400">Official email</dt><dd className="font-medium">{dept.official_email}</dd></div>
        <div><dt className="text-slate-400">Wards served</dt><dd className="font-medium">{(w.data ?? []).map((x: any) => x.wards?.name).join(", ")}</dd></div>
        <div><dt className="text-slate-400">Categories handled</dt><dd className="font-medium">{(c.data ?? []).map((x: any) => x.categories?.name).join(", ")}</dd></div>
      </dl>
      <p className="text-xs text-slate-400 mt-6">Department details are managed by the platform Admin. Contact the Admin for changes to coverage.</p>
    </div>
  );
}
