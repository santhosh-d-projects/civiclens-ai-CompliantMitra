import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await requireRole("admin");
  if ("error" in r) return r.error;
  const admin = supabaseAdmin();
  const { data: dept } = await admin.from("departments").select("*").eq("id", id).single();
  if (!dept) return apiError("NOT_FOUND", "Department not found", 404);
  const [officers, docs, wards, cats, history, dup] = await Promise.all([
    admin.from("department_officers").select("*").eq("department_id", id),
    admin.from("department_documents").select("*").eq("department_id", id),
    admin.from("department_wards").select("ward_id, wards(name,zone)").eq("department_id", id),
    admin.from("department_categories").select("category_id, categories(name,slug)").eq("department_id", id),
    admin.from("audit_log").select("seq,ts,actor_role,action,old_status,new_status,reason").eq("entity_id", id).order("seq", { ascending: false }),
    admin.from("departments").select("id,name,status").ilike("official_email", dept.official_email).neq("id", id),
  ]);
  let docUrls: Record<string, string> = {};
  for (const d of docs.data ?? []) { const { data: s } = await admin.storage.from("department-docs").createSignedUrl(d.file_path, 3600); if (s) docUrls[d.id] = s.signedUrl; }
  return Response.json({ department: dept, officers: officers.data ?? [], documents: (docs.data ?? []).map((d: any) => ({ ...d, signed_url: docUrls[d.id] ?? null })), wards: wards.data ?? [], categories: cats.data ?? [], history: history.data ?? [], duplicates: dup.data ?? [] });
}
