import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export default async function LinksPage() {
  const user = await getCurrentUser();
  const affiliateProfileId = user.affiliateProfile?.id ?? "";

  const links = await prisma.affiliateLink.findMany({
    where: { campaignAffiliate: { affiliateProfileId } },
    include: { campaignAffiliate: { include: { campaign: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Links</h1>
        <p className="mt-1 text-sm text-zinc-500">Seus links rastreáveis por campanha.</p>
      </div>

      {links.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Você ainda não tem links. Eles são gerados automaticamente quando sua participação numa campanha com
          atribuição por link é aprovada.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {links.map((link) => (
            <div key={link.id} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{link.campaignAffiliate.campaign.name}</p>
              <p className="mt-1 select-all break-all font-mono text-sm text-zinc-600 dark:text-zinc-400">
                {env.APP_URL}/r/{link.code}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{link.clicksCount} clique(s) registrados</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
