"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireContext } from "@/lib/dal";
import { createProductSchema } from "@/modules/products/schemas";
import type { FormState } from "@/lib/form-state";

export async function createProduct(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return { message: "Contexto inválido." };

  const validated = createProductSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    category: formData.get("category"),
    price: formData.get("price"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, sku, category, price } = validated.data;

  await prisma.product.create({
    data: {
      companyId: context.companyId,
      name,
      sku: sku || null,
      category: category || null,
      priceCents: price,
    },
  });

  revalidatePath("/empresa/produtos");
}

export async function toggleProductActive(formData: FormData) {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return;

  const productId = formData.get("productId");
  if (typeof productId !== "string") return;

  // Sempre filtra por companyId — nunca confia só no id vindo do form.
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId: context.companyId },
    select: { id: true, active: true },
  });
  if (!product) return;

  await prisma.product.update({ where: { id: product.id }, data: { active: !product.active } });
  revalidatePath("/empresa/produtos");
}
