import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { StatCard, formatCentsBRL } from "@/components/dashboard/stat-card";
import { ProfilePromptBanner } from "@/components/dashboard/profile-prompt-banner";

export default async function AfiliadoDashboardPage() {
  const user = await getCurrentUser();
  const affiliateProfileId = user.affiliateProfile?.id ?? "";

  const [campaignsCount, salesAgg, commissionsAgg, paidAgg, affiliateProfile] = await Promise.all([
    prisma.campaignAffiliate.count({
      where: { affiliateProfileId, status: "APPROVED" },
    }),
    prisma.sale.aggregate({
      where: { affiliateProfileId, status: "CONFIRMED" },
      _count: { _all: true },
      _sum: { grossAmountCents: true },
    }),
    prisma.commission.aggregate({
      where: { campaignAffiliate: { affiliateProfileId } },
      _sum: { amountCents: true },
    }),
    prisma.commission.aggregate({
      where: { campaignAffiliate: { affiliateProfileId }, status: "PAID" },
      _sum: { amountCents: true },
    }),
    prisma.affiliateProfile.findUnique({ where: { id: affiliateProfileId }, select: { city: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ProfilePromptBanner href="/afiliado/perfil" incomplete={!affiliateProfile?.city} />
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Acompanhe suas campanhas e ganhos como afiliado.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Campanhas participando" value={String(campaignsCount)} />
        <StatCard
          label="Vendas confirmadas"
          value={String(salesAgg._count._all)}
          hint={formatCentsBRL(salesAgg._sum.grossAmountCents ?? 0n)}
        />
        <StatCard label="Comissões geradas" value={formatCentsBRL(commissionsAgg._sum.amountCents ?? 0n)} />
        <StatCard label="Já recebido" value={formatCentsBRL(paidAgg._sum.amountCents ?? 0n)} />
      </div>
      {campaignsCount === 0 && (
        <p className="text-sm text-zinc-500">
          Você ainda não participa de nenhuma campanha. O marketplace de campanhas chega em uma próxima etapa.
        </p>
      )}
    </div>
  );
}
