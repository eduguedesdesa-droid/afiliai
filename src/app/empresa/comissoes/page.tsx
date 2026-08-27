import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatCentsBRL } from "@/components/dashboard/stat-card";
import { COMMISSION_STATUS_LABEL, COMMISSION_STATUS_TONE, NEXT_COMMISSION_STATUS } from "@/modules/commissions/labels";
import { updateCommissionStatus } from "@/modules/commissions/actions";

export default async function ComissoesPage() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const commissions = await prisma.commission.findMany({
    where: { campaignAffiliate: { campaign: { companyId } } },
    include: {
      campaignAffiliate: {
        include: {
          campaign: { select: { name: true } },
          affiliateProfile: { select: { displayName: true } },
        },
      },
      sale: { select: { grossAmountCents: true, occurredAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

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
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Comissões</h1>
        <p className="mt-1 text-sm text-zinc-500">Acompanhe e aprove as comissões geradas pelas vendas.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">Pendentes</p>
          <p className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">{formatCentsBRL(totals.pending)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">Aprovadas (a pagar)</p>
          <p className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">{formatCentsBRL(totals.approved)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">Pagas</p>
          <p className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">{formatCentsBRL(totals.paid)}</p>
        </div>
      </div>

      {commissions.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma comissão gerada ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {commissions.map((commission) => (
            <div
              key={commission.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="font-medium text-zinc-950 dark:text-zinc-50">
                  {commission.campaignAffiliate.affiliateProfile.displayName} — {formatCentsBRL(commission.amountCents)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {commission.campaignAffiliate.campaign.name} · venda de {formatCentsBRL(commission.sale.grossAmountCents)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={COMMISSION_STATUS_TONE[commission.status]}>{COMMISSION_STATUS_LABEL[commission.status]}</Badge>
                <div className="flex gap-2">
                  {NEXT_COMMISSION_STATUS[commission.status].map((transition) => (
                    <form key={transition.status} action={updateCommissionStatus}>
                      <input type="hidden" name="commissionId" value={commission.id} />
                      <input type="hidden" name="toStatus" value={transition.status} />
                      <button
                        type="submit"
                        className="h-8 rounded-md border border-zinc-300 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        {transition.label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
