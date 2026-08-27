"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthFormState } from "@/modules/auth/actions";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthFormState = undefined;

export function LoginForm() {
  const [state, action] = useActionState(login, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <TextField id="email" name="email" label="E-mail" type="email" autoComplete="email" errors={state?.errors?.email} />
      <div className="flex flex-col gap-1.5">
        <TextField
          id="password"
          name="password"
          label="Senha"
          type="password"
          autoComplete="current-password"
          errors={state?.errors?.password}
        />
        <Link href="/recuperar-senha" className="self-end text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
          Esqueci minha senha
        </Link>
      </div>
      {state?.message && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}
      <SubmitButton>Entrar</SubmitButton>
    </form>
  );
}
