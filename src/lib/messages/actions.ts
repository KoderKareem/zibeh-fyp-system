"use server";

import { createClient } from "@/lib/supabase/server";
import { MAX_MESSAGE_LENGTH, MESSAGE_COLUMNS, type Message } from "./types";

export type SendMessageResult = { error: string } | { message: Message };

export async function sendMessage(threadId: string, rawBody: string): Promise<SendMessageResult> {
  const body = rawBody.trim();
  if (!threadId) return { error: "Missing thread." };
  if (!body) return { error: "Message can't be empty." };
  if (body.length > MAX_MESSAGE_LENGTH) {
    return { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're not signed in." };

  // RLS only allows this for a participant of the student's *current* pairing.
  const { data, error } = await supabase
    .from("messages")
    .insert({ thread_id: threadId, sender_id: user.id, body })
    .select(MESSAGE_COLUMNS)
    .single<Message>();

  if (error) {
    return {
      error:
        error.code === "42501"
          ? "You can't send messages in this conversation."
          : error.message,
    };
  }

  return { message: data };
}
