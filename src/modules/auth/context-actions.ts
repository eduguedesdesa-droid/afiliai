"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, availableContexts } from "@/lib/dal";
import { setActiveContext, contextToPath, type ActiveContext } from "@/lib/active-context";

/**
 * Troca o contexto ativo (papel) da sessão atual. Sempre valida contra os
 * papéis reais do usuário no banco antes de aceitar — nunca confia no que
 * o formulário envia.
 */
export async function chooseContext(formData: FormData) {
  const type = formData.get("type");
  const companyId = formData.get("companyId");

  const user = await getCurrentUser();
  const contexts = availableContexts(user);

  const requested: ActiveContext | null =
    type === "PLATFORM_ADMIN"
      ? { type: "PLATFORM_ADMIN" }
      : type === "AFFILIATE"
        ? { type: "AFFILIATE" }
        : type === "COMPANY_MEMBER" && typeof companyId === "string"
          ? { type: "COMPANY_MEMBER", companyId }
          : null;

  const isValid =
    requested &&
    contexts.some((c) =>
      c.type === requested.type &&
      (c.type !== "COMPANY_MEMBER" ||
        (requested.type === "COMPANY_MEMBER" && c.companyId === requested.companyId))
    );

  if (!requested || !isValid) {
    redirect("/escolher-contexto");
  }

  await setActiveContext(requested);
  redirect(contextToPath(requested));
}
