import "server-only";
import { cookies } from "next/headers";

/**
 * Aviso dispensável nos dashboards convidando a completar o perfil (ver
 * /empresa/perfil e /afiliado/perfil). "Agora não" não marca como resolvido
 * pra sempre — só evita insistir por um tempo; o perfil segue incompleto até
 * a pessoa realmente preencher, então o aviso volta a aparecer depois do
 * prazo abaixo.
 */
const DISMISS_COOKIE = "afiliai_profile_prompt_dismissed";
const DISMISS_DAYS = 14;

export async function isProfilePromptDismissed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(DISMISS_COOKIE)?.value === "1";
}

/** Server Action: usuário clicou em "Agora não" no aviso de perfil incompleto. */
export async function dismissProfilePrompt() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.set(DISMISS_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * DISMISS_DAYS,
  });
}
