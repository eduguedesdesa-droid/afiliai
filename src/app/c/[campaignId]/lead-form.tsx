"use client";

import { useActionState } from "react";
import { submitLead } from "@/modules/leads/actions";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/form-state";

const initialState: FormState = undefined;

export function LeadForm({ campaignId }: { campaignId: string }) {
  const [state, action] = useActionState(submitLead, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="campaignId" value={campaignId} />
      <TextField id="name" name="name" label="Nome" autoComplete="name" errors={state?.errors?.name} />
      <TextField id="email" name="email" label="E-mail" type="email" autoComplete="email" errors={state?.errors?.email} />
      <TextField id="phone" name="phone" label="Telefone (opcional)" type="tel" required={false} autoComplete="tel" errors={state?.errors?.phone} />
      {state?.message && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}
      <SubmitButton>Enviar</SubmitButton>
    </form>
  );
}
