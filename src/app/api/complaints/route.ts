import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, fromDbError } from "@/lib/errors";

const Body = z.object({
  description: z.string().min(8), ward_id: z.number(),
  category_id: z.number(), severity: z.enum(["low", "medium", "high", "critical"]),
  department_id: z.string().uuid(), address: z.string().optional(),
  lat: z.number().optional(), lng: z.number().optional(), photo_paths: z.array(z.string()).default([]),
  language: z.string().optional(),
  ai: z.object({ category_id: z.number().nullable().optional(), severity: z.enum(["low", "medium", "high", "critical"]).nullable().optional(),
    confidence: z.number().nullable().optional(), reason: z.string().nullable().optional(), department_id: z.string().uuid().nullable().optional() }).optional(),
});
export async function POST(req: Request) {
  const r = await requireRole("citizen");
  if ("error" in r) return r.error;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", parsed.error.issues[0].message, 422);
  const b = parsed.data;
  const admin = supabaseAdmin();
  const title = b.description.trim().slice(0, 80);
  const { data, error } = await admin.rpc("create_complaint", {
    p_citizen: r.profile.id, p_title: title, p_description: b.description, p_language: b.language ?? "en",
    p_category: b.category_id, p_severity: b.severity,
    p_ai_category: b.ai?.category_id ?? null, p_ai_severity: b.ai?.severity ?? null,
    p_ai_conf: b.ai?.confidence ?? null, p_ai_reason: b.ai?.reason ?? null, p_ai_dept: b.ai?.department_id ?? null,
    p_department: b.department_id, p_ward: b.ward_id, p_address: b.address ?? null,
    p_lat: b.lat ?? null, p_lng: b.lng ?? null, p_photos: b.photo_paths,
  });
  if (error) return fromDbError(error);
  await admin.from("notifications").insert({ user_id: r.profile.id, kind: "complaint_submitted", title: `Complaint ${data.ticket_no} submitted`, body: "Your complaint was submitted to the department you confirmed.", entity_id: data.id });
  console.log(`[email-dev] To citizen ${r.profile.email}: complaint ${data.ticket_no} submitted`);
  return Response.json({ complaint: data }, { status: 201 });
}
export async function GET() {
  const r = await requireRole("citizen");
  if ("error" in r) return r.error;
  const admin = supabaseAdmin();
  const { data } = await admin.from("complaints").select("*, departments!complaints_department_id_fkey(name), categories!complaints_category_id_fkey(name,slug), wards(name)").eq("citizen_id", r.profile.id).order("created_at", { ascending: false });
  return Response.json({ complaints: data ?? [] });
}
