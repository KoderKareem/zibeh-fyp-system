"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateUser, type UpdateUserState } from "../../actions";
import { inputClasses, primaryButtonClasses } from "@/lib/ui";

type Option = { id: string; name?: string; full_name?: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClasses}>
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export function EditUserForm({
  user,
  departments,
  supervisors,
}: {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: "student" | "supervisor";
    department_id: string | null;
    supervisor_id: string | null;
  };
  departments: Option[];
  supervisors: Option[];
}) {
  const [state, formAction] = useActionState<UpdateUserState, FormData>(updateUser, null);
  const [role, setRole] = useState<"student" | "supervisor">(user.role);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-card bg-card p-6">
      <input type="hidden" name="id" value={user.id} />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-navy">Email</span>
        <p className="text-sm text-navy/60">{user.email}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-navy">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          defaultValue={user.full_name}
          className={inputClasses}
        />
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
          Department
        </label>
        <select
          id="departmentId"
          name="departmentId"
          defaultValue={user.department_id ?? ""}
          className={inputClasses}
        >
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
            Supervisor
          </label>
          <select
            id="supervisorId"
            name="supervisorId"
            defaultValue={user.supervisor_id ?? ""}
            className={inputClasses}
          >
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
