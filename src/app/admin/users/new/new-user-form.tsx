"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createUser, type CreateUserState } from "../actions";
import { inputClasses, primaryButtonClasses } from "@/lib/ui";

type Option = { id: string; name?: string; full_name?: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClasses}>
      {pending ? "Creating…" : "Create account"}
    </button>
  );
}

export function NewUserForm({
  departments,
  supervisors,
}: {
  departments: Option[];
  supervisors: Option[];
}) {
  const [state, formAction] = useActionState<CreateUserState, FormData>(createUser, null);
  const [role, setRole] = useState<"student" | "supervisor">("student");

  if (state && "success" in state) {
    return (
      <div className="rounded-card bg-card p-6">
        <h2 className="text-lg text-navy">Account created</h2>
        <p className="mt-2 text-sm text-navy/70">
          Share these sign-in details with {state.email} — this password won&apos;t be shown again.
        </p>
        <dl className="mt-4 flex flex-col gap-2 rounded-lg bg-white p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="font-medium text-navy/60">Email</dt>
            <dd className="text-navy">{state.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-medium text-navy/60">Temporary password</dt>
            <dd className="font-mono text-navy">{state.tempPassword}</dd>
          </div>
        </dl>
        <div className="mt-5 flex gap-3">
          <Link href="/admin/users/new" className={primaryButtonClasses}>
            Create another
          </Link>
          <Link
            href="/admin/users"
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
          >
            Back to users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-card bg-card p-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-navy">
          Full name
        </label>
        <input id="fullName" name="fullName" type="text" required className={inputClasses} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-navy">
          Email
        </label>
        <input id="email" name="email" type="email" required className={inputClasses} />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-sm font-medium text-navy">Role</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="radio"
              name="role"
              value="student"
              checked={role === "student"}
              onChange={() => setRole("student")}
            />
            Student
          </label>
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="radio"
              name="role"
              value="supervisor"
              checked={role === "supervisor"}
              onChange={() => setRole("supervisor")}
            />
            Supervisor
          </label>
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="departmentId" className="text-sm font-medium text-navy">
          Department (optional)
        </label>
        <select id="departmentId" name="departmentId" defaultValue="" className={inputClasses}>
          <option value="">No department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {role === "student" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="supervisorId" className="text-sm font-medium text-navy">
            Supervisor (optional)
          </label>
          <select id="supervisorId" name="supervisorId" defaultValue="" className={inputClasses}>
            <option value="">Unassigned</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {state && "error" in state ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
