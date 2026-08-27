import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatCentsBRL } from "@/components/dashboard/stat-card";
import { COMMISSION_STATUS_LABEL, COMMISSION_STATUS_TONE } from "@/modules/commissions/labels";
import { PAYOUT_STATUS_LABEL, PAYOUT_STATUS_TONE } from "@/modules/payouts/labels";

export default async function GanhosPage() {
  const user = await getCurrentUser();
  const affiliateProfileId = user.affiliateProfile?.id ?? "";

  const [commissions, payouts] = await Promise.all([
    prisma.commission.findMany({
      where: { campaignAffiliate: { affiliateProfileId } },
      include: {
        campaignAffiliate: { include: { campaign: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payout.findMany({
      where: { affiliateProfileId },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totals = commissions.reduce(
    (acc, c) => {
      if (c.status === "PENDING") acc.pending += c.amountCents;
      if (c.status === "APPROVED") acc.approved += c.amountCents;
      if (c.status === "PAID") acc.paid += c.amountCents;
      return acc;
    },
    { pending: 0n, approved: 0n, paid: 0n }
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Ganhos</h1>
        <p className="mt-1 text-sm text-zinc-500">Suas comissões por status.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">Pendentes</p>
          <p className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">{formatCentsBRL(totals.pending)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">Aprovadas (a receber)</p>
          <p className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">{formatCentsBRL(totals.approved)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">Recebidas</p>
          <p className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">{formatCentsBRL(totals.paid)}</p>
        </div>
      </div>

      {payouts.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Pagamentos</h2>
          {payouts.map((payout) => (
            <div
              key={payout.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="font-medium text-zinc-950 dark:text-zinc-50">{formatCentsBRL(payout.totalAmountCents)}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {payout._count.items} comissão(ões)
                  {payout.paidAt && ` · pago em ${payout.paidAt.toLocaleDateString("pt-BR")}`}
                </p>
              </div>
              <Badge tone={PAYOUT_STATUS_TONE[payout.status]}>{PAYOUT_STATUS_LABEL[payout.status]}</Badge>
            </div>
          ))}
        </div>
      )}

      {commissions.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma comissão ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Comissões</h2>
          {commissions.map((commission) => (
            <div
              key={commission.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="font-medium text-zinc-950 dark:text-zinc-50">{formatCentsBRL(commission.amountCents)}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{commission.campaignAffiliate.campaign.name}</p>
              </div>
              <Badge tone={COMMISSION_STATUS_TONE[commission.status]}>{COMMISSION_STATUS_LABEL[commission.status]}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
