import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, fromDbError } from "@/lib/errors";
import { signAuditRows } from "@/lib/audit";
import { clientMeta } from "@/lib/guards";

const Body = z.object({
  name: z.string().min(3), description: z.string().optional(),
  official_email: z.string().email(), official_phone: z.string().optional(),
  applicant_name: z.string().min(2),
  ward_ids: z.array(z.number()).min(1), category_ids: z.array(z.number()).min(1),
  officer: z.object({ name: z.string().min(2), email: z.string().email(), phone: z.string().optional() }),
  documents: z.array(z.object({ name: z.string(), file_path: z.string() })).default([]),
  website: z.string().optional(),
});
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", parsed.error.issues[0].message, 422);
  const b = parsed.data;
  if (b.website) return apiError("SPAM", "Rejected", 400);
  const admin = supabaseAdmin();
  const { data: dup } = await admin.from("departments").select("id").ilike("official_email", b.official_email).not("status", "in", "(rejected,deactivated)").maybeSingle();
  if (dup) return apiError("DUPLICATE", "A live department application already uses this official email", 409);
  const { data: dept, error } = await admin.from("departments").insert({
    name: b.name, description: b.description, official_email: b.official_email, official_phone: b.official_phone,
    applicant_name: b.applicant_name, status: "pending", source: "applied",
  }).select().single();
  if (error) return fromDbError(error);
  await admin.from("department_wards").insert(b.ward_ids.map((w) => ({ department_id: dept.id, ward_id: w })));
  await admin.from("department_categories").insert(b.category_ids.map((c) => ({ department_id: dept.id, category_id: c })));
  await admin.from("department_officers").insert({ department_id: dept.id, name: b.officer.name, email: b.officer.email, phone: b.officer.phone });
  if (b.documents.length) await admin.from("department_documents").insert(b.documents.map((d) => ({ department_id: dept.id, name: d.name, file_path: d.file_path })));
  const meta = clientMeta(req);
  await admin.rpc("write_audit", { p_actor: null, p_role: "applicant", p_action: "DEPARTMENT_APPLIED", p_etype: "department", p_entity: dept.id, p_old: null, p_new: "pending", p_reason: null, p_ip: meta.ip, p_device: meta.device, p_meta: {} });
  await signAuditRows();
  return Response.json({ department: dept }, { status: 201 });
}
