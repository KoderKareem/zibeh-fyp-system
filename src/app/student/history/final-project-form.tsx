"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { uploadFinalProject, type UploadFinalProjectState } from "./actions";
import { inputClasses, primaryButtonClasses } from "@/lib/ui";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClasses}>
      {pending ? "Uploading…" : label}
    </button>
  );
}

export function FinalProjectForm({
  packageId,
  defaultAbstract,
  defaultSourceCodeUrl,
  buttonLabel,
}: {
  packageId: string;
  defaultAbstract: string;
  defaultSourceCodeUrl?: string;
  buttonLabel: string;
}) {
  const [state, formAction] = useActionState<UploadFinalProjectState, FormData>(
    uploadFinalProject,
    null,
  );

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-lg bg-white p-4">
      <input type="hidden" name="packageId" value={packageId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`abstract-${packageId}`} className="text-sm font-medium text-navy">
          Final abstract
        </label>
        <textarea
          id={`abstract-${packageId}`}
          name="abstract"
          rows={4}
          defaultValue={defaultAbstract}
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`document-${packageId}`} className="text-sm font-medium text-navy">
          Final document
        </label>
        <input
          id={`document-${packageId}`}
          name="document"
          type="file"
          accept=".pdf,.doc,.docx"
          required
          className="text-sm text-navy file:mr-3 file:rounded-full file:border-0 file:bg-navy/5 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy hover:file:bg-navy/10"
        />
        <p className="text-xs text-navy/50">PDF or Word, up to 20MB.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`sourceCodeUrl-${packageId}`} className="text-sm font-medium text-navy">
          Source code link (optional)
        </label>
        <input
          id={`sourceCodeUrl-${packageId}`}
          name="sourceCodeUrl"
          type="url"
          defaultValue={defaultSourceCodeUrl ?? ""}
          placeholder="https://github.com/…"
          className={inputClasses}
        />
      </div>

      {state && "error" in state ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      <SubmitButton label={buttonLabel} />
    </form>
  );
}
