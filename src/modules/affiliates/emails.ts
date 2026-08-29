// Template de e-mail deste módulo. Função pura — não faz I/O, só monta o
// assunto/corpo que src/lib/email.ts envia (mesmo padrão de
// src/modules/auth/emails.ts).

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Enviado quando uma empresa adiciona manualmente um afiliado que ainda não
 * tinha conta — o link usa o mesmo mecanismo de "esqueci minha senha"
 * (src/app/(auth)/redefinir-senha/[token]) pra a pessoa escolher a própria
 * senha e acessar pela primeira vez.
 */
export function affiliateInviteEmail(
  companyName: string,
  setPasswordUrl: string
): { subject: string; html: string; text: string } {
  const safeCompanyName = escapeHtml(companyName);
  const safeUrl = escapeHtml(setPasswordUrl);

  return {
    subject: `${companyName} te adicionou como afiliado — Afiliai`,
    text: `A empresa ${companyName} te cadastrou como afiliado na Afiliai.\n\nAcesse o link abaixo para escolher sua senha e entrar na plataforma (válido por 7 dias):\n${setPasswordUrl}`,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #18181b;">
        <h1 style="font-size: 18px; margin-bottom: 16px;">Você foi adicionado como afiliado</h1>
        <p style="font-size: 14px; line-height: 1.5;">
          A empresa <strong>${safeCompanyName}</strong> te cadastrou como afiliado na Afiliai.
        </p>
        <p style="margin: 24px 0;">
          <a href="${safeUrl}" style="background: #18181b; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">
            Escolher senha e acessar
          </a>
        </p>
        <p style="font-size: 13px; color: #71717a; line-height: 1.5;">
          Este link é válido por 7 dias.
        </p>
      </div>
    `.trim(),
  };
}
