/** Create the single platform admin from env ADMIN_EMAIL / ADMIN_PASSWORD (§5.5). */
import { createClient } from "@supabase/supabase-js";
async function main() {
  const email = process.env.ADMIN_EMAIL, password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment");
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: existing } = await admin.auth.admin.listUsers();
  let user = existing.users.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Platform Admin" } });
    if (error) throw error;
    user = data.user;
  }
  const { error } = await admin.from("profiles").update({ role: "admin", full_name: "Platform Admin" }).eq("id", user.id);
  if (error) throw error;
  console.log("Admin ready:", email, user.id);
}
main().catch((e) => { console.error(e); process.exit(1); });
