import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyThreads } from "@/lib/messages/queries";
import { MessageThreadPanel } from "@/components/message-thread-panel";

export default async function SupervisorThreadPage(props: PageProps<"/supervisor/messages/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const thread = (await getMyThreads()).find((t) => t.id === id && t.supervisor_id === user!.id);
  if (!thread) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg text-navy">
          {thread.student_name || "—"}
          {thread.is_current ? "" : " (former student)"}
        </h2>
        <Link href="/supervisor/messages" className="text-sm font-semibold text-primary">
          All conversations
        </Link>
      </div>
      <MessageThreadPanel thread={thread} currentUserId={user!.id} />
    </div>
  );
}
