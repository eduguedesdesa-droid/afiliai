import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";
import { SALE_STATUS_LABEL } from "@/modules/sales/labels";
import { COMMISSION_STATUS_LABEL } from "@/modules/commissions/labels";

export async function GET() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const sales = await prisma.sale.findMany({
    where: { companyId },
    include: {
      campaign: { select: { name: true } },
      affiliateProfile: { select: { displayName: true } },
      commissions: { select: { amountCents: true, status: true } },
    },
    orderBy: { occurredAt: "desc" },
  });

  const csv = toCsv(
    ["Data", "Campanha", "Afiliado", "Valor", "Pedido externo", "Status da venda", "Comissão", "Status da comissão"],
    sales.map((s) => {
      const commission = s.commissions[0];
      return [
        s.occurredAt.toISOString().slice(0, 10),
        s.campaign.name,
        s.affiliateProfile.displayName,
        (Number(s.grossAmountCents) / 100).toFixed(2),
        s.externalOrderId ?? "",
        SALE_STATUS_LABEL[s.status],
        commission ? (Number(commission.amountCents) / 100).toFixed(2) : "",
        commission ? COMMISSION_STATUS_LABEL[commission.status] : "",
      ];
    })
  );

  return csvResponse("vendas.csv", csv);
}
