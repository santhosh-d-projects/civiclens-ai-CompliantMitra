import { requireRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
export async function GET(req: Request) {
  const r = await requireRole("citizen");
  if ("error" in r) return r.error;
  const url = new URL(req.url);
  const ward = parseInt(url.searchParams.get("ward_id") || ""), catId = parseInt(url.searchParams.get("category_id") || "");
  if (!ward || !catId) return apiError("VALIDATION", "ward_id and category_id required", 422);
  const admin = supabaseAdmin();
  const { data: dc } = await admin.from("department_categories").select("department_id").eq("category_id", catId);
  const ids = (dc ?? []).map((x: any) => x.department_id);
  const { data: dw } = await admin.from("department_wards").select("department_id").eq("ward_id", ward).in("department_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const ok = new Set((dw ?? []).map((x: any) => x.department_id));
  const { data: depts } = await admin.from("departments").select("id,name").eq("status", "active").in("id", [...ok]);
  return Response.json({ departments: depts ?? [] });
}
