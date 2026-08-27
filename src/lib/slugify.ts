const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

/**
 * Função pura (sem `server-only`, sem Prisma) — separada de `slug.ts` de
 * propósito, para poder ser testada sem carregar o client do banco.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "") // remove acentos (marcas diacríticas após NFD)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
