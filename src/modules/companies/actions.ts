"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireContext } from "@/lib/dal";
import { updateCompanyProfileSchema } from "@/modules/companies/schemas";
import type { FormState } from "@/lib/form-state";

/** Empresa edita o próprio perfil (contato, cidade, CNPJ, redes sociais) em /empresa/perfil. */
export async function updateCompanyProfile(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return { message: "Contexto inválido." };

  const validated = updateCompanyProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    city: formData.get("city"),
    document: formData.get("document"),
    instagramUrl: formData.get("instagramUrl"),
    tiktokUrl: formData.get("tiktokUrl"),
    otherSocialUrl: formData.get("otherSocialUrl"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  await prisma.company.update({
    where: { id: context.companyId },
    data: validated.data,
  });

  revalidatePath("/empresa/perfil");
  revalidatePath("/empresa");

  return { message: "Perfil atualizado com sucesso.", success: true };
}
