import crypto from "crypto";
import { supabaseAdmin } from "./supabase/server";
import { env } from "./env";

/** Sign every unsigned audit row's record_hash with Ed25519 (Master Prompt §7). */
export async function signAuditRows() {
  if (!env.auditPrivateKey) return { signed: 0, reason: "no key configured" };
  const admin = supabaseAdmin();
  const { data: rows } = await admin.from("audit_log").select("seq,record_hash").order("seq", { ascending: true });
  if (!rows?.length) return { signed: 0 };
  const { data: sigs } = await admin.from("audit_signatures").select("audit_seq");
  const done = new Set((sigs ?? []).map((s: any) => s.audit_seq));
  const key = crypto.createPrivateKey({ key: Buffer.from(env.auditPrivateKey, "base64"), format: "der", type: "pkcs8" });
  let signed = 0;
  for (const row of rows as any[]) {
    if (done.has(row.seq)) continue;
    const sig = crypto.sign(null, Buffer.from(row.record_hash, "utf8"), key).toString("base64");
    const { error } = await admin.from("audit_signatures").insert({ audit_seq: row.seq, key_id: env.auditKeyId, signature: sig });
    if (!error) signed++;
  }
  return { signed };
}

export async function verifySignature(recordHash: string, signatureB64: string, publicKeyB64: string) {
  try {
    const pub = crypto.createPublicKey({ key: Buffer.from(publicKeyB64, "base64"), format: "der", type: "spki" });
    return crypto.verify(null, Buffer.from(recordHash, "utf8"), pub, Buffer.from(signatureB64, "base64"));
  } catch { return false; }
}
