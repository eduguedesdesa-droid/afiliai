import Link from "next/link";
import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatCentsBRL } from "@/components/dashboard/stat-card";

export default async function NovoPayoutEscolherAfiliadoPage() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const commissions = await prisma.commission.findMany({
    where: {
      status: "APPROVED",
      payoutItems: { none: {} },
      campaignAffiliate: { campaign: { companyId } },
    },
    select: {
      amountCents: true,
      campaignAffiliate: { select: { affiliateProfileId: true, affiliateProfile: { select: { displayName: true } } } },
    },
  });

  const byAffiliate = new Map<string, { displayName: string; count: number; totalCents: bigint }>();
  for (const c of commissions) {
    const id = c.campaignAffiliate.affiliateProfileId;
    const entry = byAffiliate.get(id) ?? { displayName: c.campaignAffiliate.affiliateProfile.displayName, count: 0, totalCents: 0n };
    entry.count += 1;
    entry.totalCents += c.amountCents;
    byAffiliate.set(id, entry);
  }

  const affiliates = Array.from(byAffiliate.entries()).map(([affiliateProfileId, data]) => ({ affiliateProfileId, ...data }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Novo pagamento</h1>
        <p className="mt-1 text-sm text-zinc-500">Escolha o afiliado — só aparecem aqui os que têm comissão aprovada a receber.</p>
      </div>

      {affiliates.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma comissão aprovada aguardando pagamento no momento.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {affiliates.map((affiliate) => (
            <Link
              key={affiliate.affiliateProfileId}
              href={`/empresa/payouts/novo/${affiliate.affiliateProfileId}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
            >
              <p className="font-medium text-zinc-950 dark:text-zinc-50">{affiliate.displayName}</p>
              <p className="text-sm text-zinc-500">
                {affiliate.count} comissão(ões) · {formatCentsBRL(affiliate.totalCents)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
