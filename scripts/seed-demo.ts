/** Seed demo officers for the 5 active demo departments, 3 citizens and ~15 complaints (§5.6).
 *  Passwords are printed to the console ONLY — never commit them. */
import { createClient } from "@supabase/supabase-js";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const PW = process.env.DEMO_PASSWORD; if (!PW) throw new Error("Set DEMO_PASSWORD in env");
async function ensureUser(email: string, name: string) {
  const { data: list } = await admin.auth.admin.listUsers();
  let u = list.users.find((x) => x.email === email);
  if (!u) {
    const { data, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true, user_metadata: { full_name: name } });
    if (error) throw error;
    u = data.user;
  }
  return u;
}
async function main() {
  const { data: depts } = await admin.from("departments").select("*").eq("status", "active");
  const officers: Record<string, string> = {};
  for (const d of depts ?? []) {
    const slug = d.name.replace("Demo ", "").split(" ")[0].toLowerCase();
    const email = `officer.${slug}@demo.complaintsathi.test`;
    const u = await ensureUser(email, `${d.name} Officer`);
    await admin.from("profiles").update({ role: "department_officer", department_id: d.id, full_name: `${d.name} Officer` }).eq("id", u.id);
    const { data: off } = await admin.from("department_officers").select("id").eq("department_id", d.id).limit(1);
    if (!off?.length) await admin.from("department_officers").insert({ department_id: d.id, name: `${d.name} Officer`, email, profile_id: u.id, invite_used_at: new Date().toISOString() });
    else await admin.from("department_officers").update({ profile_id: u.id, invite_used_at: new Date().toISOString() }).eq("id", off[0].id);
    officers[d.name] = email;
  }
  const citizens: string[] = [];
  for (const [email, name] of [["priya@demo.complaintsathi.test", "Priya Sharma"], ["rahul@demo.complaintsathi.test", "Rahul Verma"], ["ananya@demo.complaintsathi.test", "Ananya Iyer"]] as const) {
    const u = await ensureUser(email, name); citizens.push(u.id);
  }
  const { data: wards } = await admin.from("wards").select("id,name");
  const { data: cats } = await admin.from("categories").select("id,slug");
  const catId = (s: string) => cats!.find((c) => c.slug === s)!.id;
  const wardId = (n: string) => wards!.find((w) => w.name === n)!.id;
  const deptByName = (frag: string) => (depts ?? []).find((d) => d.name.includes(frag))!;
  const samples: [string, string, string, string, string, number][] = [
    // description, category, severity, dept fragment, ward, citizen idx
    ["Main water pipe burst near the bus stop, whole road is flooded", "water_supply", "critical", "Water", "Koramangala", 0],
    ["No water supply for two days in our apartment block", "water_supply", "high", "Water", "HSR Layout", 1],
    ["Sewage overflowing onto the footpath near the market", "sewerage", "high", "Water", "Jayanagar", 2],
    ["Loose electric wire hanging low over the footpath", "public_safety", "critical", "Electricity", "Malleshwaram", 0],
    ["Street lights not working on the main road for a week", "electricity", "high", "Electricity", "Indiranagar", 1],
    ["Power cuts every evening for 3 hours", "electricity", "medium", "Electricity", "Whitefield", 2],
    ["Garbage not collected for 3 days, terrible smell", "solid_waste", "high", "Waste", "BTM Layout", 0],
    ["Dustbin overflowing near the park gate", "solid_waste", "medium", "Waste", "Hebbal", 1],
    ["Big pothole in front of the school gate, children crossing daily", "roads", "high", "Roads", "Rajajinagar", 2],
    ["Footpath tiles broken near the metro station", "roads", "medium", "Roads", "Yelahanka", 0],
    ["Open manhole near City Market circle, cover stolen", "public_safety", "critical", "Roads", "Bellandur", 1],
    ["Storm drain blocked, street floods with every rain", "drainage_flood", "high", "Drainage", "Marathahalli", 2],
    ["Drainage water entering homes in our lane", "drainage_flood", "critical", "Drainage", "Koramangala", 1],
    ["Fallen tree branch blocking half the road", "roads", "high", "Roads", "Jayanagar", 0],
    ["Small litter pile near the lake entrance", "solid_waste", "low", "Waste", "Bellandur", 2],
  ];
  let made = 0;
  for (const [desc, slug, sev, frag, ward, ci] of samples) {
    const dept = deptByName(frag);
    const { error } = await admin.rpc("create_complaint", {
      p_citizen: citizens[ci], p_title: desc.slice(0, 80), p_description: desc, p_language: "en",
      p_category: catId(slug), p_severity: sev, p_ai_category: catId(slug), p_ai_severity: sev,
      p_ai_conf: 0.9, p_ai_reason: "Seeded demo complaint", p_ai_dept: dept.id, p_department: dept.id,
      p_ward: wardId(ward), p_address: `${ward}, Bengaluru`, p_lat: null, p_lng: null, p_photos: [],
    });
    if (!error) made++;
    else console.error("complaint failed:", desc.slice(0, 40), error.message);
  }
  console.log(`Seeded ${made} complaints.`);
  console.log("DEMO LOGINS (console only):");
  console.log("  Admin:    use ADMIN_EMAIL / ADMIN_PASSWORD from env");
  Object.entries(officers).forEach(([d, e]) => console.log(`  Officer (${d}): ${e} / ${PW}`));
  console.log(`  Citizens: priya@ / rahul@ / ananya@demo.complaintsathi.test / ${PW}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
