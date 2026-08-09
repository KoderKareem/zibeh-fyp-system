"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { decidePackage, type DecideState } from "./actions";
import { inputClasses } from "@/lib/ui";

type Topic = {
  id: string;
  topic_number: number;
  title: string;
  description: string | null;
  keywords: string[];
};

function SubmitButtons({ canApprove }: { canApprove: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="submit"
        name="decision"
        value="approve"
        disabled={pending || !canApprove}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "Saving…" : "Approve selected topic"}
      </button>
      <button
        type="submit"
        name="decision"
        value="reject"
        disabled={pending}
        className="rounded-full border border-red-200 px-6 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Reject all three"}
      </button>
    </div>
  );
}

export function ReviewForm({ packageId, topics }: { packageId: string; topics: Topic[] }) {
  const [state, formAction] = useActionState<DecideState, FormData>(decidePackage, null);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="packageId" value={packageId} />

      <div className="grid gap-4 sm:grid-cols-3">
        {topics.map((topic) => (
          <label
            key={topic.id}
            className={`flex cursor-pointer flex-col gap-2 rounded-card border-2 p-4 transition-colors ${
              selectedTopicId === topic.id ? "border-primary bg-white" : "border-transparent bg-card"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="topicId"
                value={topic.id}
                checked={selectedTopicId === topic.id}
                onChange={() => setSelectedTopicId(topic.id)}
              />
              <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">
                Topic {topic.topic_number}
              </span>
            </div>
            <p className="text-sm font-semibold text-navy">{topic.title}</p>
            {topic.description ? (
              <p className="text-xs text-navy/70">{topic.description}</p>
            ) : null}
            {topic.keywords?.length ? (
              <p className="text-xs text-navy/50">{topic.keywords.join(", ")}</p>
            ) : null}
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="comment" className="text-sm font-medium text-navy">
          Comment (required — why this one, or why none of them)
        </label>
        <textarea id="comment" name="comment" rows={4} required className={inputClasses} />
      </div>

      {state?.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}

      <SubmitButtons canApprove={!!selectedTopicId} />
    </form>
  );
}
