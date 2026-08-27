"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireContext } from "@/lib/dal";
import { resolveAttributionForVisitor } from "@/modules/tracking/service";
import { submitLeadSchema } from "@/modules/leads/schemas";
import { VISITOR_COOKIE_NAME } from "@/lib/visitor";
import type { FormState } from "@/lib/form-state";

/**
 * Recebe o formulário público de lead (página /c/[campaignId]). Só aceita
 * campanhas com conversionType=LEAD. A atribuição ao afiliado vem da sessão
 * de atribuição do visitante (cookie `afiliai_visitor` + TrackingSession) —
 * nunca de um campo do formulário, que poderia ser forjado.
 */
export async function submitLead(_prevState: FormState, formData: FormData): Promise<FormState> {
  const campaignId = formData.get("campaignId");
  if (typeof campaignId !== "string") return { message: "Campanha inválida." };

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, companyId: true, conversionType: true },
  });

  if (!campaign || campaign.conversionType !== "LEAD") {
    return { message: "Esta campanha não aceita cadastro de leads." };
  }

  const validated = submitLeadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, phone } = validated.data;

  const cookieStore = await cookies();
  const visitorId = cookieStore.get(VISITOR_COOKIE_NAME)?.value ?? null;

  const attribution = visitorId
    ? await resolveAttributionForVisitor(campaign.companyId, visitorId, campaign.id)
    : null;

  await prisma.lead.create({
    data: {
      companyId: campaign.companyId,
      campaignId: campaign.id,
      affiliateProfileId: attribution?.affiliateProfileId ?? null,
      trackingSessionId: attribution?.trackingSessionId ?? null,
      name,
      email,
      phone: phone || null,
      status: "NEW",
    },
  });

  redirect(`/c/${campaign.id}?enviado=1`);
}

const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"] as const;

export async function updateLeadStatus(formData: FormData) {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return;

  const leadId = formData.get("leadId");
  const status = formData.get("status");
  if (typeof leadId !== "string" || typeof status !== "string") return;
  if (!LEAD_STATUSES.includes(status as (typeof LEAD_STATUSES)[number])) return;

  const lead = await prisma.lead.findFirst({ where: { id: leadId, companyId: context.companyId } });
  if (!lead) return;

  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: status as (typeof LEAD_STATUSES)[number] },
  });

  revalidatePath("/empresa/leads");
}
