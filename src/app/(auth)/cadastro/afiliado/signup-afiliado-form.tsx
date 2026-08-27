"use client";

import { useActionState } from "react";
import { signupAfiliado, type AuthFormState } from "@/modules/auth/actions";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthFormState = undefined;

export function SignupAfiliadoForm() {
  const [state, action] = useActionState(signupAfiliado, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <TextField id="name" name="name" label="Seu nome" autoComplete="name" errors={state?.errors?.name} />
      <TextField id="email" name="email" label="E-mail" type="email" autoComplete="email" errors={state?.errors?.email} />
      <TextField
        id="password"
        name="password"
        label="Senha"
        type="password"
        autoComplete="new-password"
        errors={state?.errors?.password}
      />
      {state?.message && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}
      <SubmitButton>Criar conta de afiliado</SubmitButton>
    </form>
  );
}
