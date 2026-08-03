"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/admin/login/actions";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });

  return (
    <form action={action} className="stacked-form">
      <div className="form-field">
        <label htmlFor="admin-password">Password</label>
        <input
          autoComplete="current-password"
          autoFocus
          id="admin-password"
          name="password"
          required
          type="password"
        />
      </div>
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {state.error ? (
        <p aria-live="polite" className="form-message form-error">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
