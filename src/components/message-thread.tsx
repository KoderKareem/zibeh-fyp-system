"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/messages/actions";
import { MAX_MESSAGE_LENGTH, type Message } from "@/lib/messages/types";
import { inputClasses, primaryButtonClasses } from "@/lib/ui";

function addMessages(current: Message[], incoming: Message[]) {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function MessageThread({
  threadId,
  initialMessages,
  participantNames,
  currentUserId,
  canSend,
}: {
  threadId: string;
  initialMessages: Message[];
  participantNames: Record<string, string>;
  currentUserId: string;
  canSend: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        (payload) => setMessages((current) => addMessages(current, [payload.new as Message])),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "");

    startTransition(async () => {
      const result = await sendMessage(threadId, body);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      form.reset();
      // Realtime echoes this back too; addMessages de-duplicates by id.
      setMessages((current) => addMessages(current, [result.message]));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={listRef}
        className="flex max-h-[60vh] min-h-48 flex-col gap-3 overflow-y-auto rounded-card bg-card p-4"
      >
        {messages.length === 0 ? (
          <p className="m-auto text-sm text-navy/50">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex max-w-[85%] flex-col gap-1 rounded-lg p-3 ${
                  mine ? "self-end bg-card-secondary" : "self-start bg-white"
                }`}
              >
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-xs font-semibold text-navy">
                    {participantNames[m.sender_id] ?? "Unknown"}
                    {mine ? " (you)" : ""}
                  </span>
                  <time
                    dateTime={m.created_at}
                    suppressHydrationWarning
                    className="text-[11px] text-navy/40"
                  >
                    {new Date(m.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-navy/80">{m.body}</p>
              </div>
            );
          })
        )}
      </div>

      {canSend ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label htmlFor={`body-${threadId}`} className="sr-only">
            New message
          </label>
          <textarea
            id={`body-${threadId}`}
            name="body"
            rows={3}
            required
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Write a message…"
            className={inputClasses}
          />
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          <div>
            <button type="submit" disabled={pending} className={primaryButtonClasses}>
              {pending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-navy/50">
          This conversation is read-only history from a previous supervisor assignment.
        </p>
      )}
    </div>
  );
}
