"use client";

import { useActionState } from "react";
import { createCampaign } from "@/modules/campaigns/actions";
import { TextField } from "@/components/ui/text-field";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ATTRIBUTION_METHOD_LABEL } from "@/modules/campaigns/labels";
import type { FormState } from "@/lib/form-state";

const initialState: FormState = undefined;

export function NewCampaignForm() {
  const [state, action] = useActionState(createCampaign, initialState);

  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <TextField id="name" name="name" label="Nome da campanha" errors={state?.errors?.name} />
      <TextField id="description" name="description" label="Descrição (opcional)" required={false} errors={state?.errors?.description} />
      <SelectField
        id="attributionMethod"
        name="attributionMethod"
        label="Método de atribuição"
        defaultValue="COUPON"
        options={Object.entries(ATTRIBUTION_METHOD_LABEL).map(([value, label]) => ({ value, label }))}
        errors={state?.errors?.attributionMethod}
      />
      <SelectField
        id="conversionType"
        name="conversionType"
        label="Tipo de conversão"
        defaultValue="SALE"
        options={[
          { value: "SALE", label: "Venda" },
          { value: "LEAD", label: "Lead" },
        ]}
      />
      <SelectField
        id="approvalMode"
        name="approvalMode"
        label="Aprovação de comissão"
        defaultValue="MANUAL"
        options={[
          { value: "MANUAL", label: "Manual (empresa aprova cada comissão)" },
          { value: "AUTO", label: "Automática" },
        ]}
      />
      <TextField
        id="attributionWindowDays"
        name="attributionWindowDays"
        label="Janela de atribuição (dias)"
        type="number"
        defaultValue="30"
        errors={state?.errors?.attributionWindowDays}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField id="startDate" name="startDate" label="Início (opcional)" type="date" required={false} />
        <TextField id="endDate" name="endDate" label="Fim (opcional)" type="date" required={false} />
      </div>
      <TextField
        id="destinationUrl"
        name="destinationUrl"
        label="URL de destino do link (opcional)"
        type="url"
        required={false}
        errors={state?.errors?.destinationUrl}
      />
      {state?.message && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}
      <SubmitButton>Criar campanha</SubmitButton>
    </form>
  );
}
