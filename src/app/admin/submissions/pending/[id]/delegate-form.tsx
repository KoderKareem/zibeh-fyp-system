"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { delegateToSupervisor, type DelegateState } from "./actions";
import { inputClasses, primaryButtonClasses } from "@/lib/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClasses}>
      {pending ? "Assigning…" : "Delegate to this supervisor"}
    </button>
  );
}

export function DelegateForm({
  packageId,
  supervisors,
}: {
  packageId: string;
  supervisors: { id: string; full_name: string }[];
}) {
  const [state, formAction] = useActionState<DelegateState, FormData>(delegateToSupervisor, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="packageId" value={packageId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="supervisorId" className="text-sm font-medium text-navy">
          Supervisor
        </label>
        <select id="supervisorId" name="supervisorId" defaultValue="" className={inputClasses}>
          <option value="" disabled>
            Choose a supervisor…
          </option>
          {supervisors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
      </div>

      {state?.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
