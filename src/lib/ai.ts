import { z } from "zod";
import { supabaseAdmin } from "./supabase/server";
import { env } from "./env";

/* ---------- Fallback keyword classifier (Master Prompt §8.2) ---------- */
const CATS: Record<string, string[]> = {
  public_safety: ["open manhole", "manhole open", "live wire", "sparking", "electric shock", "gas smell", "gas leak", "building collapse", "tree fell on", "fallen tree on road", "exposed wire", "uncovered drain"],
  water_supply: ["water", "pipe burst", "pipeline", "leak", "tap", "no water", "drinking water", "borewell", "paani", "neeru", "thanni", "पानी", "ನೀರು", "தண்ணீர்"],
  sewerage: ["sewage", "sewer", "drain block", "blocked drain", "overflow", "gutter", "naala", "charandi", "ಚರಂಡಿ", "नाला"],
  electricity: ["electricity", "power cut", "streetlight", "street light", "transformer", "voltage", "bijli", "current", "बिजली", "ವಿದ್ಯುತ್"],
  solid_waste: ["garbage", "waste", "trash", "dustbin", "kachra", "kuppai", "chetta", "कचरा", "ಕಸ", "குப்பை"],
  drainage_flood: ["flood", "waterlogging", "water logging", "stormwater", "rain water", "drainage"],
  roads: ["pothole", "road", "footpath", "asphalt", "speed breaker", "gundi", "sadak", "ರಸ್ತೆ", "गड्ढा", "சாலை"],
  parks_trees: ["tree", "branch", "park", "garden", "overgrown", "mara", "maram", "पेड़", "ಮರ", "மரம்"],
};
const CRIT = ["live wire", "open manhole", "manhole open", "pipe burst", "burst", "gas smell", "gas leak", "collapse", "tree fell", "electrocut", "sparking wire", "flooded road", "major leak"];
const HIGH = ["no water", "sewage overflow", "overflow", "flooding", "flood", "blocked", "not collected", "for 3 days", "for three days", "24 hours", "main road", "school", "hospital"];
const LOW = ["small", "minor", "overgrown", "litter", "request", "suggestion", "please trim"];

export function detectLanguage(text: string) {
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  return "en";
}

export function fallbackClassify(text: string) {
  const t = " " + text.toLowerCase() + " ";
  let best = "other", bestScore = 0;
  for (const [slug, words] of Object.entries(CATS)) {
    let s = 0;
    for (const w of words) if (t.includes(w)) s += w.length > 5 ? 2 : 1;
    if (s > bestScore) { bestScore = s; best = slug; }
  }
  let severity = "medium";
  if (CRIT.some((w) => t.includes(w))) severity = "critical";
  else if (HIGH.some((w) => t.includes(w))) severity = "high";
  else if (LOW.some((w) => t.includes(w))) severity = "low";
  if ((severity === "high" || severity === "medium") && /(children|school|hospital|elderly)/.test(t) && /(danger|fell|wire|manhole|burst)/.test(t)) severity = severity === "medium" ? "high" : "critical";
  const confidence = bestScore === 0 ? 0.25 : Math.min(0.85, 0.45 + bestScore * 0.08);
  const reason = severity === "critical" ? "This looks like an immediate safety danger, so it is marked critical."
    : severity === "high" ? "This affects many people or a key service, so it is marked high priority."
    : severity === "low" ? "This looks minor with no safety risk, so it is marked low priority."
    : "This is a significant issue with limited risk, so it is marked medium priority.";
  return { category: best, severity, confidence, reason };
}

/* ---------- Candidates: only ACTIVE departments covering ward + category (§8.3) ---------- */
export async function candidatesFor(wardId: number, categorySlug: string) {
  const admin = supabaseAdmin();
  const { data: cat } = await admin.from("categories").select("id,slug,name").eq("slug", categorySlug).single();
  if (!cat) return { category: null as any, departments: [] as any[] };
  const { data: dc } = await admin.from("department_categories").select("department_id").eq("category_id", cat.id);
  const ids = (dc ?? []).map((r: any) => r.department_id);
  if (!ids.length) return { category: cat, departments: [] };
  const { data: dw } = await admin.from("department_wards").select("department_id").eq("ward_id", wardId).in("department_id", ids);
  const wardIds = new Set((dw ?? []).map((r: any) => r.department_id));
  const { data: depts } = await admin.from("departments").select("id,name").eq("status", "active").in("id", [...wardIds]);
  return { category: cat, departments: depts ?? [] };
}

/* ---------- Model call (Gemini or Anthropic), 8s timeout, zod-validated (§8.2) ---------- */
const ModelOut = z.object({
  language: z.string(), translated_text: z.string(),
  category: z.string(), severity: z.enum(["low", "medium", "high", "critical"]),
  confidence: z.number().min(0).max(1), reason: z.string(),
  ranked_departments: z.array(z.object({ id: z.string(), confidence: z.number(), reason: z.string() })).default([]),
});
const SYSTEM = `You are a civic complaint triage assistant for a city municipal platform.
Given a citizen complaint (any language), return ONLY JSON:
{"language":"en|hi|kn|...","translated_text":"English translation or same text","category":"<one of: roads, water_supply, sewerage, electricity, solid_waste, drainage_flood, parks_trees, public_safety, other>","severity":"low|medium|high|critical","confidence":0.0-1.0,"reason":"one short sentence a citizen can understand","ranked_departments":[{"id":"<id from the provided candidates>","confidence":0.0-1.0,"reason":"short"}]}
Severity rubric: critical = immediate danger to life/property (live wires, open manhole on a road, major pipe burst flooding roads, gas smell, collapse blocking road, fire). high = major service loss or health risk affecting many (no water 24h+, sewage overflow, streetlight outage on a main road, large flooding, blocked main drain). medium = significant nuisance, limited risk (potholes, irregular garbage, minor leaks, single streetlight out). low = minor or cosmetic. Raise severity one level if children, hospitals, schools or elderly people are in danger. Use only the candidate department ids given. If unsure, lower confidence; never invent ids.`;

async function callModel(description: string, candidates: any[]) {
  const user = `Complaint: """${description}"""\nCandidate departments (id, name): ${JSON.stringify(candidates.map((c) => ({ id: c.id, name: c.name })))}`;
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    if (env.aiProvider === "anthropic" && env.anthropicKey) {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal: ctrl.signal,
        headers: { "content-type": "application/json", "x-api-key": env.anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: env.aiModel, max_tokens: 700, temperature: 0, system: SYSTEM, messages: [{ role: "user", content: user }] }) });
      if (!r.ok) throw new Error("anthropic " + r.status);
      const j: any = await r.json();
      return ModelOut.parse(JSON.parse(j.content.map((c: any) => c.text || "").join("")));
    }
    if (env.geminiKey) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.aiModel}:generateContent?key=${env.geminiKey}`, { method: "POST", signal: ctrl.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ parts: [{ text: user }] }], generationConfig: { temperature: 0, responseMimeType: "application/json" } }) });
      if (!r.ok) throw new Error("gemini " + r.status);
      const j: any = await r.json();
      return ModelOut.parse(JSON.parse(j.candidates[0].content.parts.map((p: any) => p.text || "").join("")));
    }
    throw new Error("no AI key configured");
  } finally { clearTimeout(timer); }
}

/* ---------- Full analysis (§8) ---------- */
export async function analyzeComplaint(description: string, wardId: number, userId: string | null) {
  const language = detectLanguage(description);
  const fb = fallbackClassify(description);
  let result: any = { ...fb, translated_text: description, source: "fallback", ranked: [] as any[] };
  try {
    const { departments: pre } = await candidatesFor(wardId, fb.category);
    const m = await callModel(description, pre);
    result = { category: m.category, severity: m.severity, confidence: m.confidence, reason: m.reason, translated_text: m.translated_text, source: env.aiProvider, ranked: m.ranked_departments };
  } catch { /* fallback stays */ }
  const { category, departments } = await candidatesFor(wardId, result.category);
  const allowed = new Map(departments.map((d: any) => [d.id, d]));
  let ranked = (result.ranked ?? []).filter((r: any) => allowed.has(r.id)).map((r: any) => ({ id: r.id, name: allowed.get(r.id).name, confidence: r.confidence, reason: r.reason }));
  if (!ranked.length) ranked = departments.map((d: any, i: number) => ({ id: d.id, name: d.name, confidence: Math.max(0.3, result.confidence - i * 0.1), reason: "Active department covering your ward for this category." }));
  ranked = ranked.slice(0, 3);
  const top = ranked[0];
  const defaultId = top && Math.max(result.confidence, top.confidence) >= 0.5 ? top.id : null;

  // duplicate hint (§8.5): same ward+category in last 7 days, token similarity > 0.5
  let similar: string | null = null;
  if (category) {
    const admin = supabaseAdmin();
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const { data: recent } = await admin.from("complaints").select("ticket_no,description").eq("ward_id", wardId).eq("category_id", category.id).gte("created_at", since).limit(20);
    const toks = new Set(description.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    for (const r of recent ?? []) {
      const o = new Set((r.description as string).toLowerCase().split(/\W+/).filter((w) => w.length > 3));
      let inter = 0; toks.forEach((w) => { if (o.has(w)) inter++; });
      if (inter / Math.max(1, Math.min(toks.size, o.size)) > 0.5) { similar = r.ticket_no; break; }
    }
  }
  const admin = supabaseAdmin();
  await admin.from("ai_analysis_log").insert({ user_id: userId, ward_id: wardId, language, category_slug: result.category, severity: result.severity, confidence: result.confidence, source: result.source, candidate_count: departments.length });
  return { category: result.category, category_id: category?.id ?? null, severity: result.severity, confidence: result.confidence, reason: result.reason, translated_text: result.translated_text, language, departments: ranked, default_department_id: defaultId, source: result.source, similar_ticket: similar };
}
