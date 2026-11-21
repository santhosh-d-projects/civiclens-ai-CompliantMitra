import AuditAdmin from "@/components/AuditAdmin";
export default function AuditPage() {
  return (<div><h2 className="text-2xl font-bold mb-1">Audit log — system events</h2>
    <p className="text-slate-500 mb-5">Append-only, hash-chained and Ed25519-signed. Click any record for its forensic detail. The Admin can read this log but never edit it — the database itself rejects updates and deletes.</p>
    <AuditAdmin /></div>);
}
