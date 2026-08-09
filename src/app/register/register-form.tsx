"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { register, type RegisterState } from "./actions";
import { inputClasses, primaryButtonClasses } from "@/lib/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClasses}>
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<RegisterState, FormData>(
    register,
    null,
  );

  if (state && "message" in state) {
    return (
      <p className="rounded-lg bg-white px-4 py-3 text-sm font-medium text-navy">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-sm font-medium text-navy">
          I&apos;m registering as a…
        </legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-navy">
            <input type="radio" name="role" value="student" defaultChecked />
            Student
          </label>
          <label className="flex items-center gap-2 text-sm text-navy">
            <input type="radio" name="role" value="supervisor" />
            Supervisor
          </label>
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-navy">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-navy">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-navy">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-navy"
        >
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClasses}
        />
      </div>

      {state?.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
