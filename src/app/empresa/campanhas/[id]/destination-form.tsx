"use client";

import { useActionState } from "react";
import { updateCampaignDestination } from "@/modules/campaigns/actions";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/form-state";

const initialState: FormState = undefined;

export function DestinationForm({ campaignId, currentUrl }: { campaignId: string; currentUrl: string | null }) {
  const [state, action] = useActionState(updateCampaignDestination, initialState);

  return (
    <form action={action} className="flex max-w-sm flex-col gap-4">
      <input type="hidden" name="campaignId" value={campaignId} />
      <TextField
        id="destinationUrl"
        name="destinationUrl"
        label="URL de destino (página de produto/checkout)"
        type="url"
        required={false}
        defaultValue={currentUrl ?? ""}
        errors={state?.errors?.destinationUrl}
      />
      <p className="text-xs text-zinc-500">
        Se vazio, o link do afiliado mostra uma página simples com o cupom (quando houver).
      </p>
      {state?.message && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}
      <SubmitButton>Salvar destino</SubmitButton>
    </form>
  );
}
