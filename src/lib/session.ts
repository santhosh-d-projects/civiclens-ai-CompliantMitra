import { redirect } from "next/navigation";
import { currentProfile } from "./guards";
import { supabaseAdmin } from "./supabase/server";
export async function profileOrLogin() {
  const p = await currentProfile();
  if (!p) redirect("/login");
  return p;
}
export async function requirePageRole(role: "citizen" | "department_officer" | "admin") {
  const p = await profileOrLogin();
  if (p.role !== role) redirect(p.role === "admin" ? "/admin" : p.role === "department_officer" ? "/officer" : "/citizen");
  return p;
}
export async function officerDept(profile: { department_id: string | null }) {
  if (!profile.department_id) return null;
  const admin = supabaseAdmin();
  const { data } = await admin.from("departments").select("*").eq("id", profile.department_id).single();
  return data;
}
