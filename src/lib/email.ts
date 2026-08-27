import "server-only";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Envio de e-mail transacional via Resend (API REST direta — sem SDK, é uma
 * chamada HTTP simples). Sem `RESEND_API_KEY` configurada, cai em modo dev:
 * loga o e-mail em vez de tentar enviar. Nenhum chamador deve depender do
 * e-mail ter sido entregue de verdade para completar o fluxo (ex.:
 * recuperação de senha continua funcionando — só não chega e-mail — se o
 * provedor estiver fora do ar ou mal configurado).
 */
export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = { sent: boolean };

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!env.RESEND_API_KEY) {
    // Loga o corpo em texto puro (não o html) para dar pra copiar o link de
    // dentro dele em dev sem configurar um provedor de verdade.
    logger.info("E-mail não enviado — RESEND_API_KEY não configurada (modo dev)", {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { sent: false };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      logger.error("Falha ao enviar e-mail via Resend", { status: response.status, body, to: input.to });
      return { sent: false };
    }

    return { sent: true };
  } catch (error) {
    // Nunca deixar uma falha de rede do provedor de e-mail derrubar o fluxo
    // que chamou (ex.: recuperação de senha) — só registra e segue.
    logger.error("Erro de rede ao enviar e-mail via Resend", {
      to: input.to,
      error: error instanceof Error ? error.message : String(error),
    });
    return { sent: false };
  }
}
