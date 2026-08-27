import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export { slugify };

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
