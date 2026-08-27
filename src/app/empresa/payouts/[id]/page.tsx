import { notFound } from "next/navigation";
import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatCentsBRL } from "@/components/dashboard/stat-card";
import { PAYOUT_STATUS_LABEL, PAYOUT_STATUS_TONE } from "@/modules/payouts/labels";
import { markPayoutPaid } from "@/modules/payouts/actions";

export default async function PayoutDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const payout = await prisma.payout.findFirst({
    where: { id, companyId },
    include: {
      affiliateProfile: { select: { displayName: true } },
      items: {
        include: {
          commission: {
            include: { campaignAffiliate: { include: { campaign: { select: { name: true } } } } },
          },
        },
      },
    },
  });

  if (!payout) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              Pagamento — {payout.affiliateProfile.displayName}
            </h1>
            <Badge tone={PAYOUT_STATUS_TONE[payout.status]}>{PAYOUT_STATUS_LABEL[payout.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {formatCentsBRL(payout.totalAmountCents)} · {payout.items.length} comissão(ões)
            {payout.paidAt && ` · pago em ${payout.paidAt.toLocaleDateString("pt-BR")}`}
          </p>
        </div>
        {payout.status !== "PAID" && (
          <form action={markPayoutPaid}>
            <input type="hidden" name="payoutId" value={payout.id} />
            <button
              type="submit"
              className="h-9 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              Marcar como pago
            </button>
          </form>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2 font-medium">Campanha</th>
              <th className="px-4 py-2 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {payout.items.map((item) => (
              <tr key={item.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                <td className="px-4 py-2 text-zinc-950 dark:text-zinc-50">
                  {item.commission.campaignAffiliate.campaign.name}
                </td>
                <td className="px-4 py-2 text-zinc-500">{formatCentsBRL(item.commission.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
