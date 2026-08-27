"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireContext, getCurrentUser } from "@/lib/dal";
import { destroyAllSessionsForUser } from "@/lib/session";

/**
 * Ações exclusivas do admin da plataforma sobre empresas e usuários de
 * outras contas. Nunca use `service.ts` de outro módulo para isso — são
 * ações que só fazem sentido no papel PLATFORM_ADMIN, com sua própria
 * checagem de autorização.
 */

export async function suspendCompany(formData: FormData) {
  await requireContext("PLATFORM_ADMIN");

  const companyId = formData.get("companyId");
  if (typeof companyId !== "string") return;

  await prisma.company.update({ where: { id: companyId }, data: { status: "SUSPENDED" } });
  revalidatePath("/admin/empresas");
}

export async function reactivateCompany(formData: FormData) {
  await requireContext("PLATFORM_ADMIN");

  const companyId = formData.get("companyId");
  if (typeof companyId !== "string") return;

  await prisma.company.update({ where: { id: companyId }, data: { status: "ACTIVE" } });
  revalidatePath("/admin/empresas");
}

/** Suspende a conta e derruba todas as sessões ativas dela imediatamente. */
export async function suspendUser(formData: FormData) {
  await requireContext("PLATFORM_ADMIN");
  const admin = await getCurrentUser();

  const userId = formData.get("userId");
  if (typeof userId !== "string") return;
  if (userId === admin.id) return; // nunca suspende a si mesmo

  await prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  await destroyAllSessionsForUser(userId);

  revalidatePath("/admin/usuarios");
}

export async function reactivateUser(formData: FormData) {
  await requireContext("PLATFORM_ADMIN");

  const userId = formData.get("userId");
  if (typeof userId !== "string") return;

  await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  revalidatePath("/admin/usuarios");
}
