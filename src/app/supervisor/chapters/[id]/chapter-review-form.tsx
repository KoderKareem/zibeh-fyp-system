"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { decideChapter, type DecideChapterState } from "./actions";
import { inputClasses } from "@/lib/ui";

function SubmitButtons() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="submit"
        name="decision"
        value="approved"
        disabled={pending}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "Saving…" : "Approve chapter"}
      </button>
      <button
        type="submit"
        name="decision"
        value="revision_requested"
        disabled={pending}
        className="rounded-full border border-red-200 px-6 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Request revision"}
      </button>
    </div>
  );
}

export function ChapterReviewForm({ chapterId }: { chapterId: string }) {
  const [state, formAction] = useActionState<DecideChapterState, FormData>(decideChapter, null);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-card bg-card p-5">
      <input type="hidden" name="chapterId" value={chapterId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="comment" className="text-sm font-medium text-navy">
          Comment (required if requesting a revision)
        </label>
        <textarea id="comment" name="comment" rows={4} className={inputClasses} />
      </div>

      {state?.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}

      <SubmitButtons />
    </form>
  );
}
