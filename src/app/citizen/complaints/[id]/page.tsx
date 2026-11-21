import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/session";
import { SevBadge, Pill, STATUS_STYLE } from "@/components/ui";
import CitizenActions from "@/components/CitizenActions";
export const dynamic = "force-dynamic";
export default async function ComplaintDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await requirePageRole("citizen");
  const admin = supabaseAdmin();
  const { data: c } = await admin.from("complaints").select("*, departments!complaints_department_id_fkey(name), categories!complaints_category_id_fkey(name), wards(name)").eq("id", id).eq("citizen_id", p.id).single();
  if (!c) notFound();
  const { data: events } = await admin.from("complaint_events").select("*").eq("complaint_id", id).order("created_at", { ascending: true });
  let photos: string[] = [];
  if (c.photo_paths?.length) { const { data: s } = await admin.storage.from("complaint-photos").createSignedUrls(c.photo_paths, 3600); photos = (s ?? []).map((x: any) => x.signedUrl).filter(Boolean); }
  let resPhotos: string[] = [];
  if (c.resolution_photo_paths?.length) { const { data: s2 } = await admin.storage.from("complaint-photos").createSignedUrls(c.resolution_photo_paths, 3600); resPhotos = (s2 ?? []).map((x: any) => x.signedUrl).filter(Boolean); }
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 glass rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{c.ticket_no}</h2><SevBadge sev={c.severity} /><Pill text={c.status} style={STATUS_STYLE[c.status] ?? "bg-slate-100"} /></div>
        <p className="mt-3">{c.description}</p>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mt-4">
          <div><dt className="text-slate-400">Category</dt><dd className="font-medium">{c.categories?.name}</dd></div>
          <div><dt className="text-slate-400">Department (confirmed by you)</dt><dd className="font-medium">{c.departments?.name}</dd></div>
          <div><dt className="text-slate-400">Ward</dt><dd className="font-medium">{c.wards?.name}</dd></div>
          <div><dt className="text-slate-400">Address</dt><dd className="font-medium">{c.address ?? "—"}</dd></div>
          <div><dt className="text-slate-400">Submitted</dt><dd className="font-medium">{new Date(c.created_at).toLocaleString("en-IN")}</dd></div>
          <div><dt className="text-slate-400">Target resolution by</dt><dd className="font-medium">{c.sla_due_at ? new Date(c.sla_due_at).toLocaleString("en-IN") : "—"}</dd></div>
          {c.ai_reason && <div className="sm:col-span-2"><dt className="text-slate-400">AI assessment</dt><dd className="font-medium">{c.ai_reason} {c.citizen_changed_suggestion && <span className="text-amber-700">(you changed the AI's suggested department)</span>}</dd></div>}
          {c.resolution_note && <div className="sm:col-span-2"><dt className="text-slate-400">Resolution note</dt><dd className="font-medium">{c.resolution_note}</dd></div>}
        </dl>
        {photos.length > 0 && <div className="mt-5"><h4 className="text-sm font-semibold text-slate-500 mb-2">Photos you attached</h4><div className="flex gap-2 flex-wrap">{photos.map((u) => <img key={u} src={u} alt="Complaint photo" className="w-28 h-28 object-cover rounded-xl border" />)}</div></div>}
        {resPhotos.length > 0 && <div className="mt-5"><h4 className="text-sm font-semibold text-teal-800 mb-2">✅ After-work photos from the department</h4><div className="flex gap-2 flex-wrap">{resPhotos.map((u) => <img key={u} src={u} alt="Resolution proof" className="w-28 h-28 object-cover rounded-xl border-2 border-emerald-200" />)}</div></div>}
        <div className="mt-6"><CitizenActions id={c.id} status={c.status} /></div>
      </div>
      <div className="glass rounded-2xl p-6">
        <h3 className="font-bold mb-4">📍 Progress timeline</h3>
        <ol className="relative border-l-2 border-teal-100 ml-2 space-y-4">
          {(events ?? []).map((e: any) => (
            <li key={e.id} className="ml-4"><span className="absolute -left-[7px] w-3 h-3 bg-teal-700 rounded-full" style={{ position: "absolute" }} />
              <p className="text-sm font-medium capitalize">{e.event.replace(/_/g, " ")}</p>
              <p className="text-xs text-slate-400">{new Date(e.created_at).toLocaleString("en-IN")}</p>
              {e.meta?.note && <p className="text-sm text-slate-600">{e.meta.note}</p>}
            </li>))}
        </ol>
      </div>
    </div>
  );
}
