"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthFormState } from "@/modules/auth/actions";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthFormState = undefined;

export function RequestResetForm() {
  const [state, action] = useActionState(requestPasswordReset, initialState);

  if (state?.message && !state.errors) {
    return (
      <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <TextField id="email" name="email" label="E-mail" type="email" autoComplete="email" errors={state?.errors?.email} />
      <SubmitButton>Enviar link de recuperação</SubmitButton>
    </form>
  );
}
