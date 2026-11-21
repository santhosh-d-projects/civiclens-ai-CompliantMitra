import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { apiError } from "@/lib/errors";
import { analyzeComplaint } from "@/lib/ai";
export async function POST(req: Request) {
  const r = await requireRole("citizen");
  if ("error" in r) return r.error;
  const parsed = z.object({ description: z.string().min(8), ward_id: z.number() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", "Describe the issue (min 8 characters) and choose a ward", 422);
  const out = await analyzeComplaint(parsed.data.description, parsed.data.ward_id, r.profile.id);
  return Response.json(out);
}
