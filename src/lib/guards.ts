import { supabaseServer, supabaseAdmin } from "./supabase/server";
import { apiError } from "./errors";
import type { NextResponse } from "next/server";

export type Profile = { id: string; role: "citizen" | "department_officer" | "admin"; full_name: string | null; email: string | null; department_id: string | null };

export async function currentUser() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}
export async function currentProfile(): Promise<Profile | null> {
  const user = await currentUser();
  if (!user) return null;
  const admin = supabaseAdmin();
  const { data } = await admin.from("profiles").select("id,role,full_name,email,department_id").eq("id", user.id).single();
  return (data as Profile) ?? null;
}
export type RoleGuard = { profile: Profile } | { error: NextResponse };
export async function requireRole(role: Profile["role"]): Promise<RoleGuard> {
  const profile = await currentProfile();
  if (!profile) return { error: apiError("UNAUTHENTICATED", "Sign in required", 401) };
  if (profile.role !== role) return { error: apiError("FORBIDDEN", `Requires role ${role}`, 403) };
  return { profile };
}
/** Department guard (Master Prompt §6): status is read from the DB on every call, never from the JWT. */
export type OfficerGuard = { profile: Profile; departmentId: string } | { error: NextResponse; deptStatus?: string | null };
export async function requireActiveOfficer(): Promise<OfficerGuard> {
  const r = await requireRole("department_officer");
  if ("error" in r) return { error: r.error };
  const admin = supabaseAdmin();
  const { data: dept } = await admin.from("departments").select("id,status").eq("id", r.profile.department_id ?? "").single();
  if (!dept || dept.status !== "active") return { error: apiError("DEPARTMENT_NOT_ACTIVE", "Your department is not active", 403), deptStatus: dept?.status ?? null };
  return { profile: r.profile, departmentId: dept.id as string };
}
export function clientMeta(req: Request) {
  return { ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null, device: req.headers.get("user-agent") ?? null };
}
