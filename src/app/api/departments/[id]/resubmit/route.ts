import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, fromDbError } from "@/lib/errors";
import { signAuditRows } from "@/lib/audit";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = z.object({ official_email: z.string().email() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", "official_email required", 422);
  const admin = supabaseAdmin();
  const { data: dept } = await admin.from("departments").select("official_email,status").eq("id", id).single();
  if (!dept || dept.official_email.toLowerCase() !== parsed.data.official_email.toLowerCase()) return apiError("NOT_FOUND", "Application not found for that email", 404);
  const { data, error } = await admin.rpc("transition_department", { p_dept: id, p_to: "pending", p_actor: null, p_reason: null });
  if (error) return fromDbError(error);
  await signAuditRows();
  return Response.json({ department: data });
}
