import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

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

export default async function MinhasCampanhasPage() {
  const user = await getCurrentUser();
  const affiliateProfileId = user.affiliateProfile?.id ?? "";

  const participations = await prisma.campaignAffiliate.findMany({
    where: { affiliateProfileId },
    include: { campaign: { include: { company: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Minhas campanhas</h1>
        <p className="mt-1 text-sm text-zinc-500">Campanhas das quais você participa ou solicitou participação.</p>
      </div>

      {participations.length === 0 ? (
        <p className="text-sm text-zinc-500">Você ainda não participa de nenhuma campanha.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {participations.map((participation) => (
            <div
              key={participation.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="font-medium text-zinc-950 dark:text-zinc-50">{participation.campaign.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{participation.campaign.company.name}</p>
              </div>
              <Badge tone={STATUS_TONE[participation.status]}>{STATUS_LABEL[participation.status]}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
