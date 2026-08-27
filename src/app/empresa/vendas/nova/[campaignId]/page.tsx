import { notFound } from "next/navigation";
import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ATTRIBUTION_METHOD_LABEL } from "@/modules/campaigns/labels";
import { NewSaleForm } from "./new-sale-form";

export default async function NovaVendaFormPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, companyId } });
  if (!campaign) notFound();

  const [affiliates, leads] = await Promise.all([
    campaign.attributionMethod === "LINK"
      ? prisma.campaignAffiliate.findMany({
          where: { campaignId: campaign.id, status: "APPROVED" },
          include: { affiliateProfile: { select: { displayName: true } } },
        })
      : Promise.resolve([]),
    campaign.attributionMethod === "LEAD"
      ? prisma.lead.findMany({
          where: { campaignId: campaign.id, affiliateProfileId: { not: null } },
          include: { affiliateProfile: { select: { displayName: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Nova venda — {campaign.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Método de atribuição: {ATTRIBUTION_METHOD_LABEL[campaign.attributionMethod]}.
        </p>
      </div>
      <NewSaleForm
        campaignId={campaign.id}
        attributionMethod={campaign.attributionMethod}
        affiliateOptions={affiliates.map((a) => ({
          campaignAffiliateId: a.id,
          displayName: a.affiliateProfile.displayName,
        }))}
        leadOptions={leads.map((l) => ({
          leadId: l.id,
          label: `${l.name} (${l.email}) — ${l.affiliateProfile?.displayName}`,
        }))}
      />
    </div>
  );
}
