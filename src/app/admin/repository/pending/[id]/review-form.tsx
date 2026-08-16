"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { decideReview, type DecideReviewState } from "./actions";
import { inputClasses } from "@/lib/ui";

function SubmitButtons() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="submit"
        name="decision"
        value="approve"
        disabled={pending}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "Saving…" : "Approve & publish"}
      </button>
      <button
        type="submit"
        name="decision"
        value="reject"
        disabled={pending}
        className="rounded-full border border-red-200 px-6 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Reject"}
      </button>
    </div>
  );
}

export function ReviewForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState<DecideReviewState, FormData>(decideReview, null);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-card bg-card p-5">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="accessLevel" className="text-sm font-medium text-navy">
          Access level if approved
        </label>
        <select id="accessLevel" name="accessLevel" defaultValue="public" className={inputClasses}>
          <option value="public">Public — anyone can view</option>
          <option value="restricted">Restricted — requires login</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="comment" className="text-sm font-medium text-navy">
          Comment (required if rejecting)
        </label>
        <textarea id="comment" name="comment" rows={3} className={inputClasses} />
      </div>

      {state?.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}

      <SubmitButtons />
    </form>
  );
}
