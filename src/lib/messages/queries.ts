import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MessageThread } from "./types";

/** Threads the signed-in user is part of, with both participants' names. */
export async function getMyThreads(): Promise<MessageThread[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_message_threads");
  return (data ?? []) as MessageThread[];
}
