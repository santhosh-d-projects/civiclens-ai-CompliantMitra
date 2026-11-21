import { z } from "zod";
import { requireActiveOfficer } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, fromDbError } from "@/lib/errors";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await requireActiveOfficer();
  if ("error" in r) return r.error;
  const admin = supabaseAdmin();
  const { data } = await admin.from("complaints").select("*, categories!complaints_category_id_fkey(name,slug), wards(name), profiles:citizen_id(full_name,email)").eq("id", id).eq("department_id", r.departmentId).single();
  if (!data) return apiError("NOT_FOUND", "Complaint not found", 404);
  const { data: events } = await admin.from("complaint_events").select("*").eq("complaint_id", id).order("created_at", { ascending: true });
  let signedPhotos: string[] = [];
  if (data.photo_paths?.length) { const { data: s } = await admin.storage.from("complaint-photos").createSignedUrls(data.photo_paths, 3600); signedPhotos = (s ?? []).map((x: any) => x.signedUrl).filter(Boolean); }
  return Response.json({ complaint: data, events: events ?? [], signedPhotos });
}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await requireActiveOfficer();
  if ("error" in r) return r.error;
  const parsed = z.object({ status: z.enum(["received", "in_progress", "resolved", "closed"]), note: z.string().optional(), photo_paths: z.array(z.string()).optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", parsed.error.issues[0].message, 422);
  const admin = supabaseAdmin();
  if (parsed.data.status === "resolved") {
    let photos = parsed.data.photo_paths ?? [];
    if (!photos.length) { const { data: ex } = await admin.from("complaints").select("resolution_photo_paths").eq("id", id).single(); photos = ex?.resolution_photo_paths ?? []; }
    if (!photos.length) return apiError("RESOLUTION_PHOTO_REQUIRED", "Add at least one after-work photo to mark this resolved \u2014 the citizen sees it as proof of the work.", 422);
  }
  const { data, error } = await admin.rpc("officer_update_complaint", { p_officer: r.profile.id, p_complaint: id, p_status: parsed.data.status, p_note: parsed.data.note ?? null, p_photos: parsed.data.photo_paths ?? null });
  if (error) return fromDbError(error);
  if (data?.citizen_id) {
    await admin.from("notifications").insert({ user_id: data.citizen_id, kind: "status_change", title: `Complaint ${data.ticket_no} is now ${data.status.replace("_", " ")}`, body: parsed.data.note ?? null, entity_id: data.id });
    console.log(`[email-dev] To citizen of ${data.ticket_no}: status -> ${data.status}`);
  }
  return Response.json({ complaint: data });
}
