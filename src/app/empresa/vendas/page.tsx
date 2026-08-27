import Link from "next/link";
import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatCentsBRL } from "@/components/dashboard/stat-card";
import { SALE_STATUS_LABEL, SALE_STATUS_TONE } from "@/modules/sales/labels";
import { cancelSale } from "@/modules/sales/actions";

const COMMISSION_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  PAID: "Paga",
  CANCELLED: "Cancelada",
};

export default async function VendasPage() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const sales = await prisma.sale.findMany({
    where: { companyId },
    include: {
      campaign: { select: { name: true } },
      affiliateProfile: { select: { displayName: true } },
      commissions: { select: { amountCents: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Vendas</h1>
          <p className="mt-1 text-sm text-zinc-500">Vendas registradas e a comissão gerada para o afiliado.</p>
        </div>
        <Link
          href="/empresa/vendas/nova"
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          Nova venda
        </Link>
      </div>

      {sales.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma venda registrada ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2 font-medium">Campanha</th>
                <th className="px-4 py-2 font-medium">Afiliado</th>
                <th className="px-4 py-2 font-medium">Valor</th>
                <th className="px-4 py-2 font-medium">Comissão</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => {
                const commission = sale.commissions[0];
                return (
                  <tr key={sale.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                    <td className="px-4 py-2 text-zinc-950 dark:text-zinc-50">{sale.campaign.name}</td>
                    <td className="px-4 py-2 text-zinc-500">{sale.affiliateProfile.displayName}</td>
                    <td className="px-4 py-2 text-zinc-500">{formatCentsBRL(sale.grossAmountCents)}</td>
                    <td className="px-4 py-2 text-zinc-500">
                      {commission
                        ? `${formatCentsBRL(commission.amountCents)} (${COMMISSION_STATUS_LABEL[commission.status]})`
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Badge tone={SALE_STATUS_TONE[sale.status]}>{SALE_STATUS_LABEL[sale.status]}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {sale.status === "CONFIRMED" && (
                        <form action={cancelSale}>
                          <input type="hidden" name="saleId" value={sale.id} />
                          <button
                            type="submit"
                            className="text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
                          >
                            Cancelar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
