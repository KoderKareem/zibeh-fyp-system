import { createClient } from "@/lib/supabase/server";
import { MESSAGE_COLUMNS, type Message, type MessageThread as Thread } from "@/lib/messages/types";
import { MessageThread } from "./message-thread";

/** Loads a thread's messages server-side, then hands off to the live client view. */
export async function MessageThreadPanel({
  thread,
  currentUserId,
}: {
  thread: Thread;
  currentUserId: string;
}) {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .eq("thread_id", thread.id)
    .order("created_at")
    .returns<Message[]>();

  return (
    <MessageThread
      threadId={thread.id}
      initialMessages={messages ?? []}
      participantNames={{
        [thread.student_id]: thread.student_name,
        [thread.supervisor_id]: thread.supervisor_name,
      }}
      currentUserId={currentUserId}
      canSend={thread.is_current}
    />
  );
}
