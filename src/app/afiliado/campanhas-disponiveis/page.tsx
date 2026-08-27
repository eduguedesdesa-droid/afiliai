import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { requestToJoinCampaign } from "@/modules/affiliates/actions";
import { ATTRIBUTION_METHOD_LABEL } from "@/modules/campaigns/labels";

export default async function CampanhasDisponiveisPage() {
  const user = await getCurrentUser();
  const affiliateProfileId = user.affiliateProfile?.id ?? "";

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "ACTIVE",
      company: { status: "ACTIVE" },
      campaignAffiliates: { none: { affiliateProfileId } },
    },
    include: { company: { select: { name: true } }, rewardRules: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Campanhas disponíveis</h1>
        <p className="mt-1 text-sm text-zinc-500">Solicite participação em campanhas abertas de qualquer empresa.</p>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma campanha disponível no momento.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign) => {
            const rewardRule = campaign.rewardRules[0];
            return (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div>
                  <p className="font-medium text-zinc-950 dark:text-zinc-50">{campaign.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {campaign.company.name} · {ATTRIBUTION_METHOD_LABEL[campaign.attributionMethod]}
                    {rewardRule &&
                      ` · ${rewardRule.rewardType === "PERCENTAGE" ? `${rewardRule.value}% de comissão` : `R$ ${rewardRule.value} por venda`}`}
                  </p>
                </div>
                <form action={requestToJoinCampaign}>
                  <input type="hidden" name="campaignId" value={campaign.id} />
                  <button
                    type="submit"
                    className="h-9 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                  >
                    Participar
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
