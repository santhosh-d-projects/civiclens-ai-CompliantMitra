import { redirect } from "next/navigation";
import { requirePageRole, officerDept } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
const COPY: Record<string, { icon: string; title: string; body: string }> = {
  pending: { icon: "⏳", title: "Application under review", body: "Your department's application is with the Admin. You will be able to sign in and work once the Admin approves and activates the department." },
  changes_requested: { icon: "📝", title: "Changes requested", body: "The Admin asked for changes to your application. Update the details and resubmit from the application page." },
  approved: { icon: "✅", title: "Approved — activation pending", body: "Your department is approved but not yet activated. The Admin completes activation as a separate step; your invite arrives then." },
  suspended: { icon: "⛔", title: "Department suspended", body: "The Admin has suspended this department. Open complaints were moved to another active department (see below). Contact the Admin for reinstatement." },
  deactivated: { icon: "🔒", title: "Department deactivated", body: "This department has been deactivated by the Admin and can no longer receive or work complaints." },
  rejected: { icon: "❌", title: "Application rejected", body: "This department's application was rejected by the Admin. You may apply again with a new application." },
  draft: { icon: "📄", title: "Application not submitted", body: "This department's application has not been submitted for review yet." },
};
export default async function Blocked() {
  const p = await requirePageRole("department_officer");
  const dept = await officerDept(p);
  if (dept?.status === "active") redirect("/officer");
  const copy = COPY[dept?.status ?? "pending"] ?? COPY.pending;
  let transfers: any[] = [];
  if (dept?.status === "suspended") {
    const admin = supabaseAdmin();
    const { data } = await admin.from("complaint_transfers").select("*, departments:to_department_id(name)").eq("from_department_id", dept.id).order("created_at", { ascending: false }).limit(20);
    transfers = data ?? [];
  }
  return (
    <div className="max-w-2xl mx-auto glass rounded-2xl p-8 text-center">
      <div className="text-6xl mb-3">{copy.icon}</div>
      <h2 className="text-2xl font-bold">{copy.title}</h2>
      {dept && <p className="text-slate-500 mt-1">{dept.name}{dept.status_reason ? ` — Reason: ${dept.status_reason}` : ""}</p>}
      <p className="text-slate-600 mt-3">{copy.body}</p>
      {transfers.length > 0 && <div className="text-left mt-6 bg-slate-50 rounded-xl p-4"><h3 className="font-semibold mb-2">Complaints transferred on suspension</h3>
        <ul className="text-sm space-y-1">{transfers.map((t: any) => <li key={t.id}>• Complaint moved to <b>{t.departments?.name}</b> — {new Date(t.created_at).toLocaleString("en-IN")} — {t.reason}</li>)}</ul></div>}
    </div>
  );
}
