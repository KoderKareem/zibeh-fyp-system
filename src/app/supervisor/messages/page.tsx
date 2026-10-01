import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyThreads } from "@/lib/messages/queries";
import type { MessageThread } from "@/lib/messages/types";

export default async function SupervisorMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const mine = (await getMyThreads()).filter((t) => t.supervisor_id === user!.id);
  const byRecentActivity = (a: MessageThread, b: MessageThread) =>
    (b.last_message_at ?? b.created_at).localeCompare(a.last_message_at ?? a.created_at);

  const current = mine.filter((t) => t.is_current).sort(byRecentActivity);
  const former = mine.filter((t) => !t.is_current).sort(byRecentActivity);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <ThreadList
        heading="Your students"
        threads={current}
        emptyText="You don't have any assigned students yet."
      />
      {former.length > 0 ? (
        <ThreadList heading="Former students (read-only history)" threads={former} emptyText="" />
      ) : null}
    </div>
  );
}

function ThreadList({
  heading,
  threads,
  emptyText,
}: {
  heading: string;
  threads: MessageThread[];
  emptyText: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base text-navy">{heading}</h2>
      <div className="flex flex-col divide-y divide-navy/5 rounded-card bg-card">
        {threads.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-navy/60">{emptyText}</p>
        ) : (
          threads.map((t) => (
            <Link
              key={t.id}
              href={`/supervisor/messages/${t.id}`}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-navy/5"
            >
              <span className="text-sm font-semibold text-navy">{t.student_name || "—"}</span>
              <span className="text-xs text-navy/50">
                {t.last_message_at
                  ? `Last message ${new Date(t.last_message_at).toLocaleDateString()}`
                  : "No messages yet"}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
