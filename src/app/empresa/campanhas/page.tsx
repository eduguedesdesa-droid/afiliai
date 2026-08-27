import Link from "next/link";
import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { CAMPAIGN_STATUS_LABEL, CAMPAIGN_STATUS_TONE, ATTRIBUTION_METHOD_LABEL } from "@/modules/campaigns/labels";

export default async function CampanhasPage() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const campaigns = await prisma.campaign.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { campaignAffiliates: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Campanhas</h1>
          <p className="mt-1 text-sm text-zinc-500">Crie e gerencie suas campanhas de indicação e afiliados.</p>
        </div>
        <Link
          href="/empresa/campanhas/nova"
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          Nova campanha
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma campanha criada ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/empresa/campanhas/${campaign.id}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
            >
              <div>
                <p className="font-medium text-zinc-950 dark:text-zinc-50">{campaign.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {ATTRIBUTION_METHOD_LABEL[campaign.attributionMethod]} · {campaign._count.campaignAffiliates} afiliado(s)
                </p>
              </div>
              <Badge tone={CAMPAIGN_STATUS_TONE[campaign.status]}>{CAMPAIGN_STATUS_LABEL[campaign.status]}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
