"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { addArchivalProject, type AddProjectState } from "./actions";
import { inputClasses, primaryButtonClasses } from "@/lib/ui";

type Option = { id: string; name?: string; label?: string; full_name?: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClasses}>
      {pending ? "Adding…" : "Add to repository"}
    </button>
  );
}

export function AddProjectForm({
  departments,
  sessions,
  supervisors,
}: {
  departments: Option[];
  sessions: Option[];
  supervisors: Option[];
}) {
  const [state, formAction] = useActionState<AddProjectState, FormData>(addArchivalProject, null);

  if (state && "success" in state) {
    return (
      <div className="rounded-card bg-card p-6">
        <h2 className="text-lg text-navy">Added to the repository</h2>
        <p className="mt-2 text-sm text-navy/70">
          &quot;{state.title}&quot; is now in the repository, marked as an admin backfill.
        </p>
        <div className="mt-5 flex gap-3">
          <Link href="/admin/repository/add" className={primaryButtonClasses}>
            Add another
          </Link>
          <Link
            href="/repository"
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
          >
            View repository
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-card bg-card p-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-navy">
          Title
        </label>
        <input id="title" name="title" type="text" required className={inputClasses} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="abstract" className="text-sm font-medium text-navy">
          Abstract
        </label>
        <textarea id="abstract" name="abstract" rows={4} className={inputClasses} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="keywords" className="text-sm font-medium text-navy">
          Keywords (comma-separated)
        </label>
        <input id="keywords" name="keywords" type="text" className={inputClasses} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="departmentId" className="text-sm font-medium text-navy">
            Department
          </label>
          <select id="departmentId" name="departmentId" defaultValue="" className={inputClasses}>
            <option value="">Unspecified</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sessionId" className="text-sm font-medium text-navy">
            Academic session
          </label>
          <select id="sessionId" name="sessionId" defaultValue="" className={inputClasses}>
            <option value="">Unspecified</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="supervisorId" className="text-sm font-medium text-navy">
            Supervisor
          </label>
          <select id="supervisorId" name="supervisorId" defaultValue="" className={inputClasses}>
            <option value="">Unspecified</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="accessLevel" className="text-sm font-medium text-navy">
            Access level
          </label>
          <select id="accessLevel" name="accessLevel" defaultValue="public" className={inputClasses}>
            <option value="public">Public — anyone can view</option>
            <option value="restricted">Restricted — requires login</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="document" className="text-sm font-medium text-navy">
          Document (optional)
        </label>
        <input
          id="document"
          name="document"
          type="file"
          accept=".pdf,.doc,.docx"
          className="text-sm text-navy file:mr-3 file:rounded-full file:border-0 file:bg-navy/5 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy hover:file:bg-navy/10"
        />
        <p className="text-xs text-navy/50">PDF or Word, up to 20MB.</p>
      </div>

      {state && "error" in state ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
