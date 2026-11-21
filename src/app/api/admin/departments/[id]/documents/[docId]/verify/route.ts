import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
export async function POST(req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  const r = await requireRole("admin");
  if ("error" in r) return r.error;
  const parsed = z.object({ verified: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", "verified boolean required", 422);
  const admin = supabaseAdmin();
  const { error } = await admin.from("department_documents").update({ verified_by: parsed.data.verified ? r.profile.id : null, verified_at: parsed.data.verified ? new Date().toISOString() : null }).eq("id", docId).eq("department_id", id);
  if (error) return apiError("DB_ERROR", error.message, 500);
  return Response.json({ ok: true });
}
