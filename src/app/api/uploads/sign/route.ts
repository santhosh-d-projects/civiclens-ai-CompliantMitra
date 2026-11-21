import { z } from "zod";
import { currentProfile } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
export async function POST(req: Request) {
  const parsed = z.object({ bucket: z.enum(["complaint-photos", "department-docs"]), filename: z.string().min(1), content_type: z.string().optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", "bucket and filename required", 422);
  const profile = await currentProfile();
  const owner = profile?.id ?? "public";
  if (parsed.data.bucket === "department-docs" && profile && profile.role !== "admin") return apiError("FORBIDDEN", "Only applicants via the apply flow or admins can upload department documents", 403);
  const ext = parsed.data.filename.split(".").pop()?.toLowerCase() ?? "bin";
  if (!["jpg", "jpeg", "png", "webp", "pdf"].includes(ext)) return apiError("FILE_TYPE", "Only JPG, PNG, WEBP or PDF files are allowed", 422);
  const path = `${owner}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const admin = supabaseAdmin();
  const { data, error } = await admin.storage.from(parsed.data.bucket).createSignedUploadUrl(path);
  if (error) return apiError("STORAGE", error.message, 500);
  return Response.json({ path, signedUrl: data.signedUrl, token: data.token });
}
