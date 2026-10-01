export type MessageThread = {
  id: string;
  student_id: string;
  student_name: string;
  supervisor_id: string;
  supervisor_name: string;
  is_current: boolean;
  created_at: string;
  last_message_at: string | null;
};

export type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export const MESSAGE_COLUMNS = "id, thread_id, sender_id, body, created_at";
export const MAX_MESSAGE_LENGTH = 4000;
