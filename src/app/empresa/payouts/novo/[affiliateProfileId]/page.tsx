import { notFound } from "next/navigation";
import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatCentsBRL } from "@/components/dashboard/stat-card";
import { createPayout } from "@/modules/payouts/actions";

export default async function NovoPayoutFormPage({
  params,
}: {
  params: Promise<{ affiliateProfileId: string }>;
}) {
  const { affiliateProfileId } = await params;
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const commissions = await prisma.commission.findMany({
    where: {
      status: "APPROVED",
      payoutItems: { none: {} },
      campaignAffiliate: { affiliateProfileId, campaign: { companyId } },
    },
    include: { campaignAffiliate: { include: { campaign: { select: { name: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  if (commissions.length === 0) notFound();

  const totalCents = commissions.reduce((sum, c) => sum + c.amountCents, 0n);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Novo pagamento</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Comissões aprovadas e ainda não pagas. Desmarque as que não quer incluir neste lote.
        </p>
      </div>

      <form action={createPayout} className="flex flex-col gap-4">
        <input type="hidden" name="affiliateProfileId" value={affiliateProfileId} />
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
          {commissions.map((commission) => (
            <label
              key={commission.id}
              className="flex items-center justify-between gap-4 rounded-md px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <span className="flex items-center gap-3">
                <input type="checkbox" name="commissionId" value={commission.id} defaultChecked className="h-4 w-4" />
                <span className="text-sm text-zinc-950 dark:text-zinc-50">{commission.campaignAffiliate.campaign.name}</span>
              </span>
              <span className="text-sm text-zinc-500">{formatCentsBRL(commission.amountCents)}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-zinc-100 px-4 py-3 text-sm dark:bg-zinc-900">
          <span className="text-zinc-600 dark:text-zinc-400">Total se todas as comissões acima forem incluídas</span>
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">{formatCentsBRL(totalCents)}</span>
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center self-start rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          Gerar pagamento
        </button>
      </form>
    </div>
  );
}
