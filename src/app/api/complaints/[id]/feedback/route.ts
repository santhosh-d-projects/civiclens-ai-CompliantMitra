import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await requireRole("citizen");
  if ("error" in r) return r.error;
  const parsed = z.object({ rating: z.number().min(1).max(5), comment: z.string().optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", "Rating 1-5 required", 422);
  const admin = supabaseAdmin();
  const { data: c } = await admin.from("complaints").select("id").eq("id", id).eq("citizen_id", r.profile.id).single();
  if (!c) return apiError("NOT_FOUND", "Complaint not found", 404);
  await admin.from("complaint_events").insert({ complaint_id: id, event: "citizen_feedback", actor_id: r.profile.id, meta: { rating: parsed.data.rating, comment: parsed.data.comment ?? null } });
  return Response.json({ ok: true });
}
