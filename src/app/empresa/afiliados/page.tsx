import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { respondToJoinRequest } from "@/modules/affiliates/actions";
import { AddAffiliateForm } from "./add-affiliate-form";

const STATUS_LABEL: Record<string, string> = {
  INVITED: "Convidado",
  PENDING_APPROVAL: "Aguardando aprovação",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  REMOVED: "Removido",
};

const STATUS_TONE: Record<string, "neutral" | "positive" | "warning" | "negative"> = {
  INVITED: "neutral",
  PENDING_APPROVAL: "warning",
  APPROVED: "positive",
  REJECTED: "negative",
  REMOVED: "neutral",
};

export default async function AfiliadosPage() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const participations = await prisma.campaignAffiliate.findMany({
    where: { campaign: { companyId } },
    include: {
      campaign: { select: { name: true } },
      affiliateProfile: { select: { displayName: true } },
      coupons: { select: { code: true } },
      affiliateLinks: { select: { code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = participations.filter((p) => p.status === "PENDING_APPROVAL");
  const others = participations.filter((p) => p.status !== "PENDING_APPROVAL");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Afiliados</h1>
        <p className="mt-1 text-sm text-zinc-500">Aprove solicitações e acompanhe os afiliados das suas campanhas.</p>
      </div>

      <AddAffiliateForm />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Solicitações pendentes {pending.length > 0 && `(${pending.length})`}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma solicitação pendente.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((participation) => (
              <div
                key={participation.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div>
                  <p className="font-medium text-zinc-950 dark:text-zinc-50">{participation.affiliateProfile.displayName}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{participation.campaign.name}</p>
                </div>
                <div className="flex gap-2">
                  <form action={respondToJoinRequest}>
                    <input type="hidden" name="campaignAffiliateId" value={participation.id} />
                    <input type="hidden" name="decision" value="REJECTED" />
                    <button
                      type="submit"
                      className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      Rejeitar
                    </button>
                  </form>
                  <form action={respondToJoinRequest}>
                    <input type="hidden" name="campaignAffiliateId" value={participation.id} />
                    <input type="hidden" name="decision" value="APPROVED" />
                    <button
                      type="submit"
                      className="h-9 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                    >
                      Aprovar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Todos os afiliados</h2>
        {others.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum afiliado ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2 font-medium">Afiliado</th>
                  <th className="px-4 py-2 font-medium">Campanha</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Cupom</th>
                  <th className="px-4 py-2 font-medium">Link</th>
                </tr>
              </thead>
              <tbody>
                {others.map((participation) => (
                  <tr key={participation.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                    <td className="px-4 py-2 text-zinc-950 dark:text-zinc-50">{participation.affiliateProfile.displayName}</td>
                    <td className="px-4 py-2 text-zinc-500">{participation.campaign.name}</td>
                    <td className="px-4 py-2">
                      <Badge tone={STATUS_TONE[participation.status]}>{STATUS_LABEL[participation.status]}</Badge>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-zinc-500">
                      {participation.coupons[0]?.code ?? "—"}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-zinc-500">
                      {participation.affiliateLinks[0]?.code ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
