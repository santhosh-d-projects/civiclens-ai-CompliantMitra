import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { activeOfficerOrBlocked } from "@/lib/officer-guard";
import { SevBadge, Pill, STATUS_STYLE } from "@/components/ui";
import OfficerUpdate from "@/components/OfficerUpdate";
export const dynamic = "force-dynamic";
export default async function OfficerComplaintDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { dept } = await activeOfficerOrBlocked();
  const admin = supabaseAdmin();
  const { data: c } = await admin.from("complaints").select("*, categories!complaints_category_id_fkey(name), wards(name), profiles:citizen_id(full_name,email)").eq("id", id).eq("department_id", dept.id).single();
  if (!c) notFound();
  const { data: events } = await admin.from("complaint_events").select("*").eq("complaint_id", id).order("created_at", { ascending: true });
  let photos: string[] = [];
  if (c.photo_paths?.length) { const { data: s } = await admin.storage.from("complaint-photos").createSignedUrls(c.photo_paths, 3600); photos = (s ?? []).map((x: any) => x.signedUrl).filter(Boolean); }
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 glass rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{c.ticket_no}</h2><SevBadge sev={c.severity} /><Pill text={c.status} style={STATUS_STYLE[c.status] ?? "bg-slate-100"} /></div>
        <p className="mt-3">{c.description}</p>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mt-4">
          <div><dt className="text-slate-400">Citizen</dt><dd className="font-medium">{c.profiles?.full_name || "Citizen"} ({c.profiles?.email})</dd></div>
          <div><dt className="text-slate-400">Category</dt><dd className="font-medium">{c.categories?.name}</dd></div>
          <div><dt className="text-slate-400">Ward / Address</dt><dd className="font-medium">{c.wards?.name} — {c.address ?? "—"}</dd></div>
          <div><dt className="text-slate-400">SLA due</dt><dd className="font-medium">{c.sla_due_at ? new Date(c.sla_due_at).toLocaleString("en-IN") : "—"}</dd></div>
          {c.ai_reason && <div className="sm:col-span-2"><dt className="text-slate-400">AI assessment</dt><dd className="font-medium">{c.ai_reason}</dd></div>}
          {c.resolution_note && <div className="sm:col-span-2"><dt className="text-slate-400">Resolution note</dt><dd className="font-medium">{c.resolution_note}</dd></div>}
        </dl>
        {photos.length > 0 && <div className="flex gap-2 mt-4 flex-wrap">{photos.map((u) => <img key={u} src={u} alt="Complaint photo" className="w-28 h-28 object-cover rounded-xl border" />)}</div>}
        <h3 className="font-bold mt-6 mb-2">History</h3>
        <ul className="text-sm space-y-1.5">{(events ?? []).map((e: any) => <li key={e.id} className="text-slate-600">• <span className="capitalize">{e.event.replace(/_/g, " ")}</span> — {new Date(e.created_at).toLocaleString("en-IN")}{e.meta?.note ? ` — ${e.meta.note}` : ""}</li>)}</ul>
      </div>
      <div className="glass rounded-2xl p-6 h-fit"><h3 className="font-bold mb-4">🛠️ Work on this complaint</h3><OfficerUpdate id={c.id} /></div>
    </div>
  );
}
