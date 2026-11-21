import { signAuditRows } from "../src/lib/audit";
async function main() { console.log("sign:", await signAuditRows()); }
main().catch((e) => { console.error(e); process.exit(1); });
