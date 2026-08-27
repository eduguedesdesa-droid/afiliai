"use client";

import { useActionState } from "react";
import { createSale } from "@/modules/sales/actions";
import { TextField } from "@/components/ui/text-field";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/form-state";
import type { AttributionMethod } from "@/generated/prisma/enums";

const initialState: FormState = undefined;

type AffiliateOption = { campaignAffiliateId: string; displayName: string };
type LeadOption = { leadId: string; label: string };

export function NewSaleForm({
  campaignId,
  attributionMethod,
  affiliateOptions,
  leadOptions,
}: {
  campaignId: string;
  attributionMethod: AttributionMethod;
  affiliateOptions: AffiliateOption[];
  leadOptions: LeadOption[];
}) {
  const [state, action] = useActionState(createSale, initialState);
  const usesCoupon = attributionMethod === "COUPON" || attributionMethod === "LINK_AND_COUPON";
  const usesManualAffiliate = attributionMethod === "LINK";
  const usesLead = attributionMethod === "LEAD";

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="campaignId" value={campaignId} />

      {usesCoupon && (
        <TextField id="couponCode" name="couponCode" label="Código do cupom usado" errors={state?.errors?.couponCode} />
      )}

      {usesManualAffiliate && (
        <SelectField
          id="campaignAffiliateId"
          name="campaignAffiliateId"
          label="Afiliado"
          options={
            affiliateOptions.length > 0
              ? affiliateOptions.map((a) => ({ value: a.campaignAffiliateId, label: a.displayName }))
              : [{ value: "", label: "Nenhum afiliado aprovado nesta campanha" }]
          }
          errors={state?.errors?.campaignAffiliateId}
        />
      )}

      {usesLead && (
        <SelectField
          id="leadId"
          name="leadId"
          label="Lead"
          options={
            leadOptions.length > 0
              ? leadOptions.map((l) => ({ value: l.leadId, label: l.label }))
              : [{ value: "", label: "Nenhum lead com afiliado atribuído nesta campanha" }]
          }
          errors={state?.errors?.leadId}
        />
      )}

      <TextField id="grossAmount" name="grossAmount" label="Valor da venda (R$)" type="number" errors={state?.errors?.grossAmount} />
      <TextField
        id="externalOrderId"
        name="externalOrderId"
        label="Identificador do pedido (opcional)"
        required={false}
        errors={state?.errors?.externalOrderId}
      />
      {state?.message && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}
      <SubmitButton>Registrar venda</SubmitButton>
    </form>
  );
}
