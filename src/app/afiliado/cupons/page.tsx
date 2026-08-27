import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function CuponsPage() {
  const user = await getCurrentUser();
  const affiliateProfileId = user.affiliateProfile?.id ?? "";

  const coupons = await prisma.coupon.findMany({
    where: { campaignAffiliate: { affiliateProfileId } },
    include: { campaignAffiliate: { include: { campaign: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Cupons</h1>
        <p className="mt-1 text-sm text-zinc-500">Seus cupons exclusivos por campanha.</p>
      </div>

      {coupons.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Você ainda não tem cupons. Eles são gerados automaticamente quando sua participação numa campanha com
          atribuição por cupom é aprovada.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{coupon.campaignAffiliate.campaign.name}</p>
                <p className="mt-1 select-all font-mono text-lg text-zinc-950 dark:text-zinc-50">{coupon.code}</p>
                <p className="mt-1 text-xs text-zinc-500">{coupon.usedCount} uso(s)</p>
              </div>
              <Badge tone={coupon.active ? "positive" : "neutral"}>{coupon.active ? "Ativo" : "Inativo"}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
