import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";
import { CAMPAIGN_STATUS_LABEL, ATTRIBUTION_METHOD_LABEL } from "@/modules/campaigns/labels";

export async function GET() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const campaigns = await prisma.campaign.findMany({
    where: { companyId },
    include: { _count: { select: { campaignAffiliates: true, sales: true, leads: true } } },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    ["Campanha", "Status", "Método de atribuição", "Tipo de conversão", "Afiliados", "Vendas", "Leads", "Criada em"],
    campaigns.map((c) => [
      c.name,
      CAMPAIGN_STATUS_LABEL[c.status],
      ATTRIBUTION_METHOD_LABEL[c.attributionMethod],
      c.conversionType === "LEAD" ? "Lead" : "Venda",
      c._count.campaignAffiliates,
      c._count.sales,
      c._count.leads,
      c.createdAt.toISOString().slice(0, 10),
    ])
  );

  return csvResponse("campanhas.csv", csv);
}
