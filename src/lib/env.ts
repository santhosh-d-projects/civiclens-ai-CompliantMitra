export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  aiProvider: process.env.AI_PROVIDER || "gemini",
  aiModel: process.env.AI_MODEL || "gemini-2.5-flash",
  geminiKey: process.env.GEMINI_API_KEY || "",
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  auditPrivateKey: process.env.AUDIT_SIGNING_PRIVATE_KEY || "",
  auditKeyId: process.env.AUDIT_KEY_ID || "audit-2026-01",
  appUrl: process.env.APP_URL || "http://localhost:3000",
};
