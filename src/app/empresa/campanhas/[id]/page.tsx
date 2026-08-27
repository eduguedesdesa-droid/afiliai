import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_TONE,
  ATTRIBUTION_METHOD_LABEL,
  REWARD_TYPE_LABEL,
} from "@/modules/campaigns/labels";
import { setCampaignStatus } from "@/modules/campaigns/actions";
import { RewardRuleForm } from "./reward-rule-form";

const NEXT_STATUS: Record<string, { status: string; label: string }[]> = {
  DRAFT: [{ status: "ACTIVE", label: "Ativar campanha" }],
  ACTIVE: [
    { status: "PAUSED", label: "Pausar campanha" },
    { status: "ENDED", label: "Encerrar campanha" },
  ],
  PAUSED: [
    { status: "ACTIVE", label: "Reativar campanha" },
    { status: "ENDED", label: "Encerrar campanha" },
  ],
  ENDED: [],
};

export default async function CampanhaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const campaign = await prisma.campaign.findFirst({
    where: { id, companyId },
    include: {
      rewardRules: true,
      _count: { select: { campaignAffiliates: true, sales: true } },
    },
  });

  if (!campaign) notFound();

  const rewardRule = campaign.rewardRules[0] ?? null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{campaign.name}</h1>
            <Badge tone={CAMPAIGN_STATUS_TONE[campaign.status]}>{CAMPAIGN_STATUS_LABEL[campaign.status]}</Badge>
          </div>
          {campaign.description && <p className="mt-1 max-w-lg text-sm text-zinc-500">{campaign.description}</p>}
          <p className="mt-2 text-xs text-zinc-500">
            {ATTRIBUTION_METHOD_LABEL[campaign.attributionMethod]} · janela de atribuição de{" "}
            {campaign.attributionWindowDays} dias · {campaign._count.campaignAffiliates} afiliado(s) ·{" "}
            {campaign._count.sales} venda(s)
          </p>
        </div>
        <div className="flex gap-2">
          {(NEXT_STATUS[campaign.status] ?? []).map((transition) => (
            <form key={transition.status} action={setCampaignStatus}>
              <input type="hidden" name="campaignId" value={campaign.id} />
              <input type="hidden" name="status" value={transition.status} />
              <button
                type="submit"
                className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {transition.label}
              </button>
            </form>
          ))}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Regra de recompensa</h2>
        {rewardRule && (
          <p className="text-sm text-zinc-500">
            Atual: {REWARD_TYPE_LABEL[rewardRule.rewardType]} —{" "}
            {rewardRule.rewardType === "PERCENTAGE" ? `${rewardRule.value}%` : `R$ ${rewardRule.value}`}
          </p>
        )}
        <RewardRuleForm
          campaignId={campaign.id}
          existing={rewardRule ? { rewardType: rewardRule.rewardType, value: rewardRule.value?.toString() ?? "" } : null}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Afiliados</h2>
        <p className="text-sm text-zinc-500">
          Gerencie solicitações e afiliados aprovados nesta campanha em{" "}
          <Link href="/empresa/afiliados" className="underline underline-offset-4">
            Afiliados
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
