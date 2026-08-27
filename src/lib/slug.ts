import "server-only";
import { prisma } from "@/lib/prisma";

const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

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

/** Gera um slug único para a empresa, adicionando sufixo numérico em colisões. */
export async function uniqueCompanySlug(name: string): Promise<string> {
  const base = slugify(name) || "empresa";
  let candidate = base;
  let attempt = 1;

  while (await prisma.company.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }

  return candidate;
}
