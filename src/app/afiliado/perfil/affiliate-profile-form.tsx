"use client";

import { useActionState } from "react";
import { updateAffiliateProfile } from "@/modules/affiliates/actions";
import { TextField } from "@/components/ui/text-field";
import { TextFieldWithLink } from "@/components/ui/text-field-with-link";
import { WhatsappIconLink, InstagramIconLink } from "@/components/ui/social-icon-link";
import { SubmitButton } from "@/components/ui/submit-button";
import { whatsappUrl, instagramProfileUrl } from "@/lib/contact-links";
import type { FormState } from "@/lib/form-state";

const initialState: FormState = undefined;

type AffiliateProfileValues = {
  name: string;
  email: string;
  phone: string | null;
  displayName: string;
  bio: string | null;
  document: string | null;
  city: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  otherSocialUrl: string | null;
};

export function AffiliateProfileForm({ profile }: { profile: AffiliateProfileValues }) {
  const [state, action] = useActionState(updateAffiliateProfile, initialState);

  return (
    <form
      action={action}
      className="flex flex-col gap-5 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id="name" name="name" label="Nome" defaultValue={profile.name} errors={state?.errors?.name} />
        <TextField
          id="displayName"
          name="displayName"
          label="Nome de exibição (usado em links e cupons)"
          defaultValue={profile.displayName}
          errors={state?.errors?.displayName}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="email"
          name="email"
          label="E-mail"
          type="email"
          defaultValue={profile.email}
          errors={state?.errors?.email}
        />
        <TextFieldWithLink
          id="phone"
          name="phone"
          label="Telefone (opcional)"
          required={false}
          defaultValue={profile.phone ?? ""}
          errors={state?.errors?.phone}
          buildHref={whatsappUrl}
          renderIcon={(href) => <WhatsappIconLink href={href} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="city"
          name="city"
          label="Cidade (opcional)"
          required={false}
          defaultValue={profile.city ?? ""}
          errors={state?.errors?.city}
        />
        <TextField
          id="document"
          name="document"
          label="CPF/CNPJ (opcional)"
          required={false}
          defaultValue={profile.document ?? ""}
          errors={state?.errors?.document}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Sobre você (opcional)
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={profile.bio ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {state?.errors?.bio?.map((error) => (
          <p key={error} className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">Redes sociais (opcional)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextFieldWithLink
            id="instagramUrl"
            name="instagramUrl"
            label="Instagram"
            required={false}
            defaultValue={profile.instagramUrl ?? ""}
            errors={state?.errors?.instagramUrl}
            buildHref={instagramProfileUrl}
            renderIcon={(href) => <InstagramIconLink href={href} />}
          />
          <TextField
            id="tiktokUrl"
            name="tiktokUrl"
            label="TikTok"
            required={false}
            defaultValue={profile.tiktokUrl ?? ""}
            errors={state?.errors?.tiktokUrl}
          />
          <TextField
            id="otherSocialUrl"
            name="otherSocialUrl"
            label="Outra rede"
            required={false}
            defaultValue={profile.otherSocialUrl ?? ""}
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
