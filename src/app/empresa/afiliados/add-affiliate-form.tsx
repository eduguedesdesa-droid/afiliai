"use client";

import { useActionState } from "react";
import { addAffiliateManually } from "@/modules/affiliates/actions";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/form-state";

const initialState: FormState = undefined;

export function AddAffiliateForm() {
  const [state, action] = useActionState(addAffiliateManually, initialState);

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Adicionar afiliado</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Cadastre um afiliado direto, sem precisar que ele solicite participação. Se o e-mail já tiver conta na
          Afiliai, ele só entra na sua campanha com o cupom abaixo (os outros dados ficam a cargo dele, em{" "}
          <span className="font-mono">/afiliado/perfil</span>). Se for um e-mail novo, criamos a conta e mandamos um
          link pra ele definir a senha.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id="name" name="name" label="Nome" errors={state?.errors?.name} />
        <TextField id="email" name="email" label="E-mail" type="email" errors={state?.errors?.email} />
      </div>

      <TextField
        id="couponCode"
        name="couponCode"
        label="Código do cupom (ex.: JOAO10)"
        errors={state?.errors?.couponCode}
      />

      <details className="rounded-md border border-zinc-200 dark:border-zinc-800">
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Dados de contato (opcional — só usados se for uma conta nova)
        </summary>
        <div className="flex flex-col gap-4 p-3 pt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField id="phone" name="phone" label="Telefone" required={false} errors={state?.errors?.phone} />
            <TextField id="city" name="city" label="Cidade" required={false} errors={state?.errors?.city} />
          </div>
          <TextField id="document" name="document" label="CPF/CNPJ" required={false} errors={state?.errors?.document} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField
              id="instagramUrl"
              name="instagramUrl"
              label="Instagram"
              required={false}
              errors={state?.errors?.instagramUrl}
            />
            <TextField id="tiktokUrl" name="tiktokUrl" label="TikTok" required={false} errors={state?.errors?.tiktokUrl} />
            <TextField
              id="otherSocialUrl"
              name="otherSocialUrl"
              label="Outra rede"
              required={false}
              errors={state?.errors?.otherSocialUrl}
            />
          </div>
        </div>
      </details>

      {state?.message && (
        <p className={`text-sm ${state.success ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {state.message}
        </p>
      )}
      <div>
        <SubmitButton>Adicionar afiliado</SubmitButton>
      </div>
    </form>
  );
}
