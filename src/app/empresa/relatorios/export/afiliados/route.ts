import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const participations = await prisma.campaignAffiliate.findMany({
    where: { campaign: { companyId } },
    include: {
      campaign: { select: { name: true } },
      affiliateProfile: { select: { displayName: true, user: { select: { email: true } } } },
      coupons: { select: { code: true } },
      affiliateLinks: { select: { code: true, clicksCount: true } },
      commissions: { select: { amountCents: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const STATUS_LABEL: Record<string, string> = {
    INVITED: "Convidado",
    PENDING_APPROVAL: "Aguardando aprovação",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    REMOVED: "Removido",
  };

  const csv = toCsv(
    ["Afiliado", "E-mail", "Campanha", "Status", "Cupom", "Link", "Cliques", "Comissão gerada", "Comissão paga"],
    participations.map((p) => {
      const totalCents = p.commissions.reduce((sum, c) => sum + c.amountCents, 0n);
      const paidCents = p.commissions.filter((c) => c.status === "PAID").reduce((sum, c) => sum + c.amountCents, 0n);
      const clicks = p.affiliateLinks.reduce((sum, l) => sum + l.clicksCount, 0);
      return [
        p.affiliateProfile.displayName,
        p.affiliateProfile.user.email,
        p.campaign.name,
        STATUS_LABEL[p.status],
        p.coupons[0]?.code ?? "",
        p.affiliateLinks[0]?.code ?? "",
        clicks,
        (Number(totalCents) / 100).toFixed(2),
        (Number(paidCents) / 100).toFixed(2),
      ];
    })
  );

  return csvResponse("afiliados.csv", csv);
}
