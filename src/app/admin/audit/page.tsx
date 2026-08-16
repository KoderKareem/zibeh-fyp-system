import { createClient } from "@/lib/supabase/server";

const ACTION_LABEL: Record<string, string> = {
  "auth.login": "Logged in",
  "submission_package.approved": "Approved a package",
  "submission_package.rejected": "Rejected a package",
  "repository_project.document_downloaded": "Downloaded a document",
  "repository_project.approved": "Approved a final project",
  "repository_project.rejected": "Rejected a final project",
};

type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export default async function AdminAuditPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<AuditLog[]>();

  const rows = logs ?? [];
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((id): id is string => !!id))];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] as { id: string; full_name: string }[] };
  const actorNameById = new Map((actors ?? []).map((a) => [a.id, a.full_name]));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-navy/70">
        The most recent {rows.length} action(s) — logins, package decisions, and document
        downloads.
      </p>

      <div className="rounded-card bg-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/50">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/60">
                  No activity logged yet.
                </td>
              </tr>
            ) : (
              rows.map((log) => (
                <tr key={log.id} className="border-b border-navy/5 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-navy/60">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-navy">
                    {log.actor_id ? actorNameById.get(log.actor_id) ?? "—" : "Anonymous"}
                  </td>
                  <td className="px-4 py-3 text-navy">{ACTION_LABEL[log.action] ?? log.action}</td>
                  <td className="px-4 py-3 text-navy/60">
                    {typeof log.metadata?.title === "string"
                      ? log.metadata.title
                      : `${log.entity_type}${log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}`}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
