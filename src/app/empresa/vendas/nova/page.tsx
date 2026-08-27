import Link from "next/link";
import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ATTRIBUTION_METHOD_LABEL } from "@/modules/campaigns/labels";

export default async function NovaVendaEscolherCampanhaPage() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const campaigns = await prisma.campaign.findMany({
    where: { companyId, status: { not: "DRAFT" } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Nova venda</h1>
        <p className="mt-1 text-sm text-zinc-500">Escolha a campanha desta venda.</p>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Você precisa de uma campanha ativa (ou pausada/encerrada) para registrar uma venda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/empresa/vendas/nova/${campaign.id}`}
              className="rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
            >
              <p className="font-medium text-zinc-950 dark:text-zinc-50">{campaign.name}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{ATTRIBUTION_METHOD_LABEL[campaign.attributionMethod]}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
