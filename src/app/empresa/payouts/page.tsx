import Link from "next/link";
import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatCentsBRL } from "@/components/dashboard/stat-card";
import { PAYOUT_STATUS_LABEL, PAYOUT_STATUS_TONE } from "@/modules/payouts/labels";

export default async function PayoutsPage() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const payouts = await prisma.payout.findMany({
    where: { companyId },
    include: { affiliateProfile: { select: { displayName: true } }, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Pagamentos</h1>
          <p className="mt-1 text-sm text-zinc-500">Lotes de pagamento agrupando comissões aprovadas por afiliado.</p>
        </div>
        <Link
          href="/empresa/payouts/novo"
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          Novo pagamento
        </Link>
      </div>

      {payouts.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum pagamento gerado ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {payouts.map((payout) => (
            <Link
              key={payout.id}
              href={`/empresa/payouts/${payout.id}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
            >
              <div>
                <p className="font-medium text-zinc-950 dark:text-zinc-50">{payout.affiliateProfile.displayName}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {payout._count.items} comissão(ões) · {formatCentsBRL(payout.totalAmountCents)}
                </p>
              </div>
              <Badge tone={PAYOUT_STATUS_TONE[payout.status]}>{PAYOUT_STATUS_LABEL[payout.status]}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
