"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitPackage, type SubmitState } from "./actions";
import { inputClasses, primaryButtonClasses } from "@/lib/ui";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClasses}>
      {pending ? "Submitting…" : label}
    </button>
  );
}

function TopicFields({ n }: { n: 1 | 2 | 3 }) {
  return (
    <div className="rounded-card bg-card p-5">
      <h3 className="text-base font-semibold text-navy">Topic {n}</h3>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`topic${n}_title`} className="text-sm font-medium text-navy">
            Title
          </label>
          <input
            id={`topic${n}_title`}
            name={`topic${n}_title`}
            type="text"
            required
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`topic${n}_case_study`} className="text-sm font-medium text-navy">
            Case Study
          </label>
          <input
            id={`topic${n}_case_study`}
            name={`topic${n}_case_study`}
            type="text"
            required
            placeholder="e.g. Zibeh Institute of Technology, Jos"
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`topic${n}_description`} className="text-sm font-medium text-navy">
            Abstract
          </label>
          <textarea
            id={`topic${n}_description`}
            name={`topic${n}_description`}
            rows={3}
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`topic${n}_keywords`} className="text-sm font-medium text-navy">
            Keywords (comma-separated, optional)
          </label>
          <input
            id={`topic${n}_keywords`}
            name={`topic${n}_keywords`}
            type="text"
            placeholder="e.g. machine learning, healthcare, NLP"
            className={inputClasses}
          />
        </div>
      </div>
    </div>
  );
}

export function SubmitForm() {
  const [state, formAction] = useActionState<SubmitState, FormData>(
    submitPackage,
    null,
  );

  const hasWarnings = !!state && "warnings" in state;
  const hasError = !!state && "error" in state;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <TopicFields n={1} />
      <TopicFields n={2} />
      <TopicFields n={3} />

      {hasError ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      {hasWarnings ? (
        <div className="rounded-card border border-amber-300 bg-[#fff7e6] p-5">
          <h3 className="text-sm font-semibold text-navy">
            Similar projects already exist in the repository
          </h3>
          <ul className="mt-3 flex flex-col gap-3 text-sm text-navy/80">
            {state.warnings.map((w) => (
              <li key={w.topicNumber}>
                <span className="font-medium">
                  Topic {w.topicNumber} (&quot;{w.submittedTitle}&quot;)
                </span>{" "}
                looks similar to:
                <ul className="ml-4 mt-1 list-disc">
                  {w.matches.map((m) => (
                    <li key={m.title}>
                      {m.title} — {Math.round(m.similarity * 100)}% similar
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-navy">
            <input type="checkbox" name="confirmed" value="true" required />
            I&apos;ve checked — submit anyway
          </label>
        </div>
      ) : null}

      <SubmitButton label={hasWarnings ? "Submit anyway" : "Check & submit"} />
    </form>
  );
}
