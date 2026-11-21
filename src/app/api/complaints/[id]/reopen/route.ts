import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await requireRole("citizen");
  if ("error" in r) return r.error;
  const admin = supabaseAdmin();
  const { data: c } = await admin.from("complaints").select("id,status").eq("id", id).eq("citizen_id", r.profile.id).single();
  if (!c) return apiError("NOT_FOUND", "Complaint not found", 404);
  if (c.status !== "resolved" && c.status !== "closed") return apiError("ILLEGAL_TRANSITION", "Only a resolved complaint can be reopened", 409);
  await admin.from("complaints").update({ status: "reopened", updated_at: new Date().toISOString() }).eq("id", id);
  await admin.from("complaint_events").insert({ complaint_id: id, event: "status_reopened", actor_id: r.profile.id, meta: {} });
  return Response.json({ ok: true });
}
