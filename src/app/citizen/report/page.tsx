import { supabaseAdmin } from "@/lib/supabase/server";
import ReportForm from "@/components/ReportForm";
export const dynamic = "force-dynamic";
export default async function ReportPage() {
  const admin = supabaseAdmin();
  const [w, c] = await Promise.all([admin.from("wards").select("*").order("name"), admin.from("categories").select("*").order("id")]);
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-1">Report an issue</h2>
      <p className="text-slate-500 mb-5">AI suggests the category, severity and department — <b>you confirm</b> before it is submitted.</p>
      <ReportForm wards={w.data ?? []} categories={c.data ?? []} />
    </div>
  );
}
