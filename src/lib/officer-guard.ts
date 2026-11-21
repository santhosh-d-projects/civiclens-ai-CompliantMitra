import { redirect } from "next/navigation";
import { requirePageRole, officerDept } from "./session";
export async function activeOfficerOrBlocked() {
  const p = await requirePageRole("department_officer");
  const dept = await officerDept(p);
  if (!dept || dept.status !== "active") redirect("/officer/blocked");
  return { profile: p, dept };
}
