/** Generate the Ed25519 audit signing keypair (Master Prompt §5.4).
 *  Prints the private key (put it in env AUDIT_SIGNING_PRIVATE_KEY, never commit)
 *  and inserts the public key into audit_keys. */
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const pubDer = publicKey.export({ format: "der", type: "spki" });
  const privDer = privateKey.export({ format: "der", type: "pkcs8" });
  const fingerprint = crypto.createHash("sha256").update(pubDer).digest("hex");
  const keyId = process.env.AUDIT_KEY_ID || "audit-2026-01";
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await admin.from("audit_keys").upsert({ key_id: keyId, public_key: pubDer.toString("base64"), algorithm: "Ed25519", fingerprint });
  if (error) throw error;
  console.log("AUDIT_KEY_ID=" + keyId);
  console.log("FINGERPRINT=" + fingerprint);
  console.log("AUDIT_SIGNING_PRIVATE_KEY=" + privDer.toString("base64"));
}
main().catch((e) => { console.error(e); process.exit(1); });
