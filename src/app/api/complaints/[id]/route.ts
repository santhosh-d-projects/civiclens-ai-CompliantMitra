import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await requireRole("citizen");
  if ("error" in r) return r.error;
  const admin = supabaseAdmin();
  const { data } = await admin.from("complaints").select("*, departments!complaints_department_id_fkey(name), categories!complaints_category_id_fkey(name,slug), wards(name)").eq("id", id).eq("citizen_id", r.profile.id).single();
  if (!data) return apiError("NOT_FOUND", "Complaint not found", 404);
  const { data: events } = await admin.from("complaint_events").select("*").eq("complaint_id", id).order("created_at", { ascending: true });
  let signedPhotos: string[] = [];
  if (data.photo_paths?.length) {
    const { data: signed } = await admin.storage.from("complaint-photos").createSignedUrls(data.photo_paths, 3600);
    signedPhotos = (signed ?? []).map((s: any) => s.signedUrl).filter(Boolean);
  }
  return Response.json({ complaint: data, events: events ?? [], signedPhotos });
}
