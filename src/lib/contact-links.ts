/**
 * Telefone e Instagram são salvos como texto livre (ver
 * modules/companies|affiliates/schemas.ts) — aqui só a normalização pra
 * virarem link clicável de WhatsApp/Instagram. Usado tanto nos formulários
 * de perfil (ícone ao lado do campo, atualiza ao digitar) quanto na lista de
 * afiliados da empresa.
 */

/**
 * `wa.me` exige o número completo, com código de país, só dígitos. Como o
 * público do produto é BR, assume Brasil (`55`) quando o número não já vem
 * com um DDI (mais de 11 dígitos). Não valida DDD/formato — só o suficiente
 * pra montar um link que abre o WhatsApp com o número preenchido.
 */
export function whatsappUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withCountryCode = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountryCode}`;
}

/** Aceita "@handle", "handle" ou uma URL já completa do Instagram. */
export function instagramProfileUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "").replace(/^instagram\.com\//i, "").replace(/^\//, "");
  if (!handle) return null;
  return `https://instagram.com/${handle}`;
}
