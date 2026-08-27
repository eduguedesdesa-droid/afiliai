"use client";

import { useActionState } from "react";
import { upsertRewardRule } from "@/modules/campaigns/actions";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/form-state";
import type { RewardType } from "@/generated/prisma/enums";

const initialState: FormState = undefined;

export function RewardRuleForm({
  campaignId,
  existing,
}: {
  campaignId: string;
  existing: { rewardType: RewardType; value: string } | null;
}) {
  const [state, action] = useActionState(upsertRewardRule, initialState);

  return (
    <form action={action} className="flex max-w-sm flex-col gap-4">
      <input type="hidden" name="campaignId" value={campaignId} />
      <SelectField
        id="rewardType"
        name="rewardType"
        label="Tipo de recompensa"
        defaultValue={existing?.rewardType ?? "PERCENTAGE"}
        options={[
          { value: "PERCENTAGE", label: "Percentual sobre a venda" },
          { value: "FIXED", label: "Valor fixo por venda (R$)" },
        ]}
        errors={state?.errors?.rewardType}
      />
      <TextField
        id="value"
        name="value"
        label="Valor (% ou R$, conforme o tipo)"
        type="number"
        defaultValue={existing?.value}
        errors={state?.errors?.value}
      />
      {state?.message && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}
      <SubmitButton>{existing ? "Atualizar regra" : "Definir regra de recompensa"}</SubmitButton>
    </form>
  );
}
