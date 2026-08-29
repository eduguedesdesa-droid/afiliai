"use client";

import { useActionState } from "react";
import { updateCompanyProfile } from "@/modules/companies/actions";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/form-state";

const initialState: FormState = undefined;

type CompanyProfileValues = {
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  document: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  otherSocialUrl: string | null;
};

export function CompanyProfileForm({ company }: { company: CompanyProfileValues }) {
  const [state, action] = useActionState(updateCompanyProfile, initialState);

  return (
    <form
      action={action}
      className="flex flex-col gap-5 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <TextField id="name" name="name" label="Nome da empresa" defaultValue={company.name} errors={state?.errors?.name} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="phone"
          name="phone"
          label="Telefone (opcional)"
          required={false}
          defaultValue={company.phone ?? ""}
          errors={state?.errors?.phone}
        />
        <TextField
          id="email"
          name="email"
          label="E-mail de contato (opcional)"
          type="email"
          required={false}
          defaultValue={company.email ?? ""}
          errors={state?.errors?.email}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="city"
          name="city"
          label="Cidade (opcional)"
          required={false}
          defaultValue={company.city ?? ""}
          errors={state?.errors?.city}
        />
        <TextField
          id="document"
          name="document"
          label="CNPJ (opcional)"
          required={false}
          defaultValue={company.document ?? ""}
          errors={state?.errors?.document}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">Redes sociais (opcional)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            id="instagramUrl"
            name="instagramUrl"
            label="Instagram"
            required={false}
            defaultValue={company.instagramUrl ?? ""}
            errors={state?.errors?.instagramUrl}
          />
          <TextField
            id="tiktokUrl"
            name="tiktokUrl"
            label="TikTok"
            required={false}
            defaultValue={company.tiktokUrl ?? ""}
            errors={state?.errors?.tiktokUrl}
          />
          <TextField
            id="otherSocialUrl"
            name="otherSocialUrl"
            label="Outra rede"
            required={false}
            defaultValue={company.otherSocialUrl ?? ""}
            errors={state?.errors?.otherSocialUrl}
          />
        </div>
      </div>

      {state?.message && (
        <p className={`text-sm ${state.success ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {state.message}
        </p>
      )}
      <div>
        <SubmitButton>Salvar perfil</SubmitButton>
      </div>
    </form>
  );
}
