"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1b8bc0] disabled:opacity-60"
    >
      {pending ? "Logging in…" : "Log in"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(
    login,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
          className="rounded-lg border border-navy/15 px-4 py-2.5 text-sm text-navy focus:border-primary focus:outline-none"
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
          autoComplete="current-password"
          className="rounded-lg border border-navy/15 px-4 py-2.5 text-sm text-navy focus:border-primary focus:outline-none"
        />
      </div>

      {state?.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
