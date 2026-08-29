import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { CompanyProfileForm } from "./company-profile-form";

export default async function EmpresaPerfilPage() {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return null;

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: context.companyId },
    select: {
      name: true,
      phone: true,
      email: true,
      city: true,
      document: true,
      instagramUrl: true,
      tiktokUrl: true,
      otherSocialUrl: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Perfil da empresa</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Dados de contato e identificação da empresa. Você pode alterar quando quiser.
        </p>
      </div>
      <CompanyProfileForm company={company} />
    </div>
  );
}
