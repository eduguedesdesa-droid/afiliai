import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";
import { COMMISSION_STATUS_LABEL } from "@/modules/commissions/labels";
import { REWARD_TYPE_LABEL } from "@/modules/campaigns/labels";

export async function GET() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const commissions = await prisma.commission.findMany({
    where: { campaignAffiliate: { campaign: { companyId } } },
    include: {
      campaignAffiliate: {
        include: { campaign: { select: { name: true } }, affiliateProfile: { select: { displayName: true } } },
      },
      sale: { select: { grossAmountCents: true, occurredAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    ["Data", "Afiliado", "Campanha", "Valor da venda", "Comissão", "Tipo", "Status"],
    commissions.map((c) => [
      c.sale.occurredAt.toISOString().slice(0, 10),
      c.campaignAffiliate.affiliateProfile.displayName,
      c.campaignAffiliate.campaign.name,
      (Number(c.sale.grossAmountCents) / 100).toFixed(2),
      (Number(c.amountCents) / 100).toFixed(2),
      REWARD_TYPE_LABEL[c.type],
      COMMISSION_STATUS_LABEL[c.status],
    ])
  );

  return csvResponse("comissoes.csv", csv);
}
