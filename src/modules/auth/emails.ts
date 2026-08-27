// Templates de e-mail do módulo auth. Funções puras — não fazem I/O, só
// montam o assunto/corpo que src/lib/email.ts envia. Novo fluxo de e-mail
// (convite de membro, verificação de e-mail) entra aqui do mesmo jeito.

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function passwordResetEmail(resetUrl: string): { subject: string; html: string; text: string } {
  const safeUrl = escapeHtml(resetUrl);

  return {
    subject: "Redefinir sua senha — Afiliai",
    text: `Recebemos um pedido para redefinir a senha da sua conta Afiliai.\n\nAcesse o link abaixo para escolher uma nova senha (válido por 1 hora):\n${resetUrl}\n\nSe você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.`,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #18181b;">
        <h1 style="font-size: 18px; margin-bottom: 16px;">Redefinir sua senha</h1>
        <p style="font-size: 14px; line-height: 1.5;">
          Recebemos um pedido para redefinir a senha da sua conta Afiliai.
        </p>
        <p style="margin: 24px 0;">
          <a href="${safeUrl}" style="background: #18181b; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">
            Escolher nova senha
          </a>
        </p>
        <p style="font-size: 13px; color: #71717a; line-height: 1.5;">
          Este link é válido por 1 hora. Se você não pediu isso, pode ignorar
          este e-mail — sua senha continua a mesma.
        </p>
      </div>
    `.trim(),
  };
}
