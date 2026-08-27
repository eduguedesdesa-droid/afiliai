import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { updateLeadStatus } from "@/modules/leads/actions";

const STATUS_LABEL: Record<string, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  QUALIFIED: "Qualificado",
  CONVERTED: "Convertido",
  LOST: "Perdido",
};

const STATUS_TONE: Record<string, "neutral" | "positive" | "warning" | "negative"> = {
  NEW: "neutral",
  CONTACTED: "warning",
  QUALIFIED: "warning",
  CONVERTED: "positive",
  LOST: "negative",
};

const NEXT_STATUS: Record<string, { status: string; label: string }[]> = {
  NEW: [
    { status: "CONTACTED", label: "Marcar como contatado" },
    { status: "LOST", label: "Marcar como perdido" },
  ],
  CONTACTED: [
    { status: "QUALIFIED", label: "Marcar como qualificado" },
    { status: "LOST", label: "Marcar como perdido" },
  ],
  QUALIFIED: [{ status: "LOST", label: "Marcar como perdido" }],
  CONVERTED: [],
  LOST: [],
};

export default async function LeadsPage() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const leads = await prisma.lead.findMany({
    where: { companyId },
    include: {
      campaign: { select: { name: true } },
      affiliateProfile: { select: { displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Leads</h1>
        <p className="mt-1 text-sm text-zinc-500">Leads capturados pelas suas campanhas, com o afiliado atribuído.</p>
      </div>

      {leads.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum lead recebido ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-zinc-950 dark:text-zinc-50">{lead.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {lead.email} {lead.phone && `· ${lead.phone}`}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {lead.campaign.name} · afiliado:{" "}
                    {lead.affiliateProfile ? lead.affiliateProfile.displayName : "direto (sem afiliado)"}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[lead.status]}>{STATUS_LABEL[lead.status]}</Badge>
              </div>
              {(NEXT_STATUS[lead.status] ?? []).length > 0 && (
                <div className="mt-3 flex gap-2">
                  {NEXT_STATUS[lead.status].map((transition) => (
                    <form key={transition.status} action={updateLeadStatus}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <input type="hidden" name="status" value={transition.status} />
                      <button
                        type="submit"
                        className="h-8 rounded-md border border-zinc-300 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        {transition.label}
                      </button>
                    </form>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
