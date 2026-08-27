import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { StatCard, formatCentsBRL } from "@/components/dashboard/stat-card";

export default async function EmpresaDashboardPage() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const [campaignsCount, activeAffiliatesCount, salesAgg, commissionsAgg] = await Promise.all([
    prisma.campaign.count({ where: { companyId } }),
    prisma.campaignAffiliate.count({
      where: { campaign: { companyId }, status: "APPROVED" },
    }),
    prisma.sale.aggregate({
      where: { companyId, status: { in: ["CONFIRMED"] } },
      _count: { _all: true },
      _sum: { grossAmountCents: true },
    }),
    prisma.commission.aggregate({
      where: { campaignAffiliate: { campaign: { companyId } } },
      _sum: { amountCents: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Visão geral das suas campanhas de indicação e afiliados.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Campanhas" value={String(campaignsCount)} />
        <StatCard label="Afiliados aprovados" value={String(activeAffiliatesCount)} />
        <StatCard
          label="Vendas confirmadas"
          value={String(salesAgg._count._all)}
          hint={formatCentsBRL(salesAgg._sum.grossAmountCents ?? 0n)}
        />
        <StatCard label="Comissões geradas" value={formatCentsBRL(commissionsAgg._sum.amountCents ?? 0n)} />
      </div>
      {campaignsCount === 0 && (
        <p className="text-sm text-zinc-500">
          Você ainda não tem campanhas. A criação de campanhas chega na próxima etapa da implementação.
        </p>
      )}
    </div>
  );
}
