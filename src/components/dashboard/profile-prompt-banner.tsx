import Link from "next/link";
import { isProfilePromptDismissed, dismissProfilePrompt } from "@/lib/profile-prompt";

/** Banner dispensável sugerindo completar o perfil — ver src/lib/profile-prompt.ts. */
export async function ProfilePromptBanner({ href, incomplete }: { href: string; incomplete: boolean }) {
  if (!incomplete) return null;
  if (await isProfilePromptDismissed()) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
      <p>Complete seu perfil (contato, cidade, redes sociais) pra deixar seu cadastro mais completo.</p>
      <div className="flex shrink-0 items-center gap-4">
        <Link href={href} className="font-medium underline underline-offset-4">
          Preencher agora
        </Link>
        <form action={dismissProfilePrompt}>
          <button
            type="submit"
            className="text-amber-700 underline underline-offset-4 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
          >
            Agora não
          </button>
        </form>
      </div>
    </div>
  );
}
