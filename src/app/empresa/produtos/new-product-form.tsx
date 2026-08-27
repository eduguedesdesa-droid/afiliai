"use client";

import { useActionState } from "react";
import { createProduct } from "@/modules/products/actions";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/form-state";

const initialState: FormState = undefined;

export function NewProductForm() {
  const [state, action] = useActionState(createProduct, initialState);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Novo produto</h2>
      <TextField id="name" name="name" label="Nome" errors={state?.errors?.name} />
      <div className="grid grid-cols-2 gap-4">
        <TextField id="sku" name="sku" label="SKU (opcional)" required={false} errors={state?.errors?.sku} />
        <TextField id="category" name="category" label="Categoria (opcional)" required={false} errors={state?.errors?.category} />
      </div>
      <TextField id="price" name="price" label="Preço em R$ (opcional)" type="number" required={false} errors={state?.errors?.price} />
      {state?.message && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}
      <SubmitButton>Adicionar produto</SubmitButton>
    </form>
  );
}
