"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { uploadChapter, type UploadChapterState } from "./actions";
import { primaryButtonClasses } from "@/lib/ui";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClasses}>
      {pending ? "Uploading…" : label}
    </button>
  );
}

export function ChapterUploadForm({
  chapterNumber,
  buttonLabel,
}: {
  chapterNumber: number;
  buttonLabel: string;
}) {
  const [state, formAction] = useActionState<UploadChapterState, FormData>(uploadChapter, null);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-lg bg-white p-4">
      <input type="hidden" name="chapterNumber" value={chapterNumber} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`document-${chapterNumber}`} className="text-sm font-medium text-navy">
          Chapter {chapterNumber} document
        </label>
        <input
          id={`document-${chapterNumber}`}
          name="document"
          type="file"
          accept=".pdf,.doc,.docx"
          required
          className="text-sm text-navy file:mr-3 file:rounded-full file:border-0 file:bg-navy/5 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy hover:file:bg-navy/10"
        />
        <p className="text-xs text-navy/50">PDF or Word, up to 20MB.</p>
      </div>

      {state && "error" in state ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      <div>
        <SubmitButton label={buttonLabel} />
      </div>
    </form>
  );
}
