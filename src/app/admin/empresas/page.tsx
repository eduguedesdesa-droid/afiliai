import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { COMPANY_STATUS_LABEL, COMPANY_STATUS_TONE } from "@/modules/admin/labels";
import { suspendCompany, reactivateCompany } from "@/modules/admin/actions";

export default async function AdminEmpresasPage() {
  const companies = await prisma.company.findMany({
    include: { _count: { select: { members: true, campaigns: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Empresas</h1>
        <p className="mt-1 text-sm text-zinc-500">Todas as empresas cadastradas na plataforma.</p>
      </div>

      {companies.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma empresa cadastrada ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {companies.map((company) => (
            <div
              key={company.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-medium text-zinc-950 dark:text-zinc-50">{company.name}</p>
                  <Badge tone={COMPANY_STATUS_TONE[company.status]}>{COMPANY_STATUS_LABEL[company.status]}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {company.segment ?? "sem segmento"} · plano {company.plan} · {company._count.members} membro(s) ·{" "}
                  {company._count.campaigns} campanha(s)
                </p>
              </div>
              {company.status === "SUSPENDED" ? (
                <form action={reactivateCompany}>
                  <input type="hidden" name="companyId" value={company.id} />
                  <button
                    type="submit"
                    className="h-9 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                  >
                    Reativar
                  </button>
                </form>
              ) : (
                <form action={suspendCompany}>
                  <input type="hidden" name="companyId" value={company.id} />
                  <button
                    type="submit"
                    className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    Suspender
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
