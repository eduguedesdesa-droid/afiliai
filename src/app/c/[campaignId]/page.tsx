import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveAttributionForVisitor } from "@/modules/tracking/service";
import { VISITOR_COOKIE_NAME } from "@/lib/visitor";
import { LeadForm } from "./lead-form";

/**
 * Página pública de campanha — destino do /r/[code] quando a campanha é de
 * LEAD (formulário) ou quando é de VENDA mas a empresa não configurou uma
 * URL de destino própria (mostra o cupom do afiliado como fallback).
 */
export default async function PublicCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ enviado?: string }>;
}) {
  const { campaignId } = await params;
  const { enviado } = await searchParams;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { company: { select: { name: true } } },
  });

  if (!campaign) notFound();

  if (campaign.conversionType === "LEAD") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-16">
        <div>
          <p className="text-sm text-zinc-500">{campaign.company.name}</p>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{campaign.name}</h1>
          {campaign.description && <p className="mt-1 text-sm text-zinc-500">{campaign.description}</p>}
        </div>
        {enviado ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            Recebemos seus dados! A equipe da {campaign.company.name} vai entrar em contato em breve.
          </p>
        ) : (
          <LeadForm campaignId={campaign.id} />
        )}
      </div>
    );
  }

  // conversionType === SALE sem destinationUrl — fallback mostrando o cupom do afiliado atribuído, se houver.
  const cookieStore = await cookies();
  const visitorId = cookieStore.get(VISITOR_COOKIE_NAME)?.value ?? null;
  const attribution = visitorId
    ? await resolveAttributionForVisitor(campaign.companyId, visitorId, campaign.id)
    : null;

  const coupon = attribution
    ? await prisma.coupon.findFirst({
        where: { campaignAffiliateId: attribution.campaignAffiliateId },
        select: { code: true },
      })
    : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm text-zinc-500">{campaign.company.name}</p>
      <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{campaign.name}</h1>
      {coupon ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Use o cupom{" "}
          <span className="select-all font-mono text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            {coupon.code}
          </span>{" "}
          no checkout da {campaign.company.name}.
        </p>
      ) : (
        <p className="text-sm text-zinc-500">Esta campanha ainda não tem uma página de destino configurada.</p>
      )}
    </div>
  );
}
