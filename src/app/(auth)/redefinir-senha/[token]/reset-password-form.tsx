"use client";

import { useActionState } from "react";
import { resetPassword, type AuthFormState } from "@/modules/auth/actions";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthFormState = undefined;

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <TextField
        id="password"
        name="password"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        errors={state?.errors?.password}
      />
      <TextField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        errors={state?.errors?.confirmPassword}
      />
      {state?.message && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}
      <SubmitButton>Redefinir senha</SubmitButton>
    </form>
  );
}
