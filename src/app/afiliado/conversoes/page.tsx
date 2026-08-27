import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatCentsBRL } from "@/components/dashboard/stat-card";
import { SALE_STATUS_LABEL, SALE_STATUS_TONE } from "@/modules/sales/labels";

export default async function ConversoesPage() {
  const user = await getCurrentUser();
  const affiliateProfileId = user.affiliateProfile?.id ?? "";

  const sales = await prisma.sale.findMany({
    where: { affiliateProfileId },
    include: {
      campaign: { select: { name: true } },
      commissions: { select: { amountCents: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Conversões</h1>
        <p className="mt-1 text-sm text-zinc-500">Vendas atribuídas a você.</p>
      </div>

      {sales.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma conversão ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sales.map((sale) => {
            const commission = sale.commissions[0];
            return (
              <div
                key={sale.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div>
                  <p className="font-medium text-zinc-950 dark:text-zinc-50">{sale.campaign.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Venda de {formatCentsBRL(sale.grossAmountCents)}
                    {commission && ` · comissão de ${formatCentsBRL(commission.amountCents)}`}
                  </p>
                </div>
                <Badge tone={SALE_STATUS_TONE[sale.status]}>{SALE_STATUS_LABEL[sale.status]}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
