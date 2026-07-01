"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/lib/auth/actions";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">
          {state.error}
        </div>
      ) : null}
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          autoComplete="email"
          className="focus-ring rounded-md border border-[var(--border)] px-3 py-2.5"
          defaultValue={state.email}
          name="email"
          placeholder="admin@swanda.sch.id"
          required
          type="email"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Password
        <input
          autoComplete="current-password"
          className="focus-ring rounded-md border border-[var(--border)] px-3 py-2.5"
          name="password"
          placeholder="********"
          required
          type="password"
        />
      </label>
      <button
        className="btn-primary focus-ring rounded-md bg-[var(--primary)] px-4 py-2.5 font-semibold hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
