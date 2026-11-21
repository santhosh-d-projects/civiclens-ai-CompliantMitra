import { currentProfile } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
export async function GET() {
  const profile = await currentProfile();
  if (!profile) return apiError("UNAUTHENTICATED", "Sign in required", 401);
  let department = null;
  if (profile.department_id) {
    const admin = supabaseAdmin();
    const { data } = await admin.from("departments").select("id,name,status,status_reason").eq("id", profile.department_id).single();
    department = data;
  }
  return Response.json({ profile, department });
}
