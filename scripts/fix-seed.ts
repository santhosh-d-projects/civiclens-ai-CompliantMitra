import { createClient } from "@supabase/supabase-js";
import { signAuditRows } from "../src/lib/audit";

async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: priya } = await admin.from("profiles").select("id").eq("email", "priya@demo.complaintsathi.test").single();
  const { data: wards } = await admin.from("wards").select("id,name");
  const { data: cats } = await admin.from("categories").select("id,slug");
  const { data: depts } = await admin.from("departments").select("id,name").eq("status", "active");
  const roads = depts!.find((d) => d.name.includes("Roads"))!;
  const roadsCat = cats!.find((c) => c.slug === "roads")!.id;
  const { error } = await admin.rpc("create_complaint", {
    p_citizen: priya!.id, p_title: "Fallen tree branch blocking half the road",
    p_description: "Fallen tree branch blocking half the road", p_language: "en",
    p_category: roadsCat, p_severity: "high", p_ai_category: roadsCat, p_ai_severity: "high",
    p_ai_conf: 0.9, p_ai_reason: "Seeded demo complaint", p_ai_dept: roads.id,
    p_department: roads.id, p_ward: wards!.find((w) => w.name === "Jayanagar")!.id,
    p_address: "Jayanagar, Bengaluru", p_lat: null, p_lng: null, p_photos: [],
  });
  console.log("tree complaint:", error ? error.message : "OK");
  console.log("signAuditRows:", await signAuditRows());
}
main().catch((e) => { console.error(e); process.exit(1); });
