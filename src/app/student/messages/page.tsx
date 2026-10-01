import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyThreads } from "@/lib/messages/queries";
import { MessageThreadPanel } from "@/components/message-thread-panel";

export default async function StudentMessagesPage(props: PageProps<"/student/messages">) {
  const { thread: threadParam } = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const threads = await getMyThreads();
  const current = threads.find((t) => t.is_current) ?? null;
  const history = threads
    .filter((t) => !t.is_current)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const selected =
    typeof threadParam === "string" ? threads.find((t) => t.id === threadParam) : current;
  if (typeof threadParam === "string" && !selected) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {selected ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg text-navy">
              {selected.is_current ? "Your supervisor" : "Previous supervisor"}:{" "}
              {selected.supervisor_name || "—"}
            </h2>
            {!selected.is_current && current ? (
              <Link href="/student/messages" className="text-sm font-semibold text-primary">
                Back to current conversation
              </Link>
            ) : null}
          </div>
          <MessageThreadPanel thread={selected} currentUserId={user!.id} />
        </div>
      ) : (
        <div className="rounded-card bg-card p-6">
          <p className="text-sm text-navy/70">
            You&apos;ll be able to message your supervisor once one has been assigned to you.
          </p>
        </div>
      )}

      {history.length > 0 ? (
        <div className="rounded-card bg-card-secondary p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
            Previous supervisors
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {history.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/student/messages?thread=${t.id}`}
                  className={`text-sm font-semibold hover:underline ${
                    t.id === selected?.id ? "text-navy" : "text-primary"
                  }`}
                >
                  {t.supervisor_name || "—"}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
