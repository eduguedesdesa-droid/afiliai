import { getCurrentUser, availableContexts } from "@/lib/dal";
import { chooseContext } from "@/modules/auth/context-actions";
import { logout } from "@/modules/auth/actions";

function contextLabel(context: ReturnType<typeof availableContexts>[number], user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (context.type === "PLATFORM_ADMIN") return "Administrador da plataforma";
  if (context.type === "AFFILIATE") return `Afiliado — ${user.affiliateProfile?.displayName ?? user.name}`;
  const role = user.roles.find((r) => r.role === "COMPANY_MEMBER" && r.companyId === context.companyId);
  return `Empresa — ${role?.company?.name ?? "empresa"}`;
}

export default async function EscolherContextoPage() {
  const user = await getCurrentUser();
  const contexts = availableContexts(user);

  if (contexts.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Nenhum acesso configurado
        </h1>
        <p className="max-w-sm text-sm text-zinc-500">
          Sua conta ainda não tem um papel de empresa ou afiliado. Entre em contato com o suporte.
        </p>
        <form action={logout}>
          <button type="submit" className="text-sm text-zinc-500 underline underline-offset-4">
            Sair
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Como você quer entrar?</h1>
        <p className="mt-1 text-sm text-zinc-500">Sua conta tem mais de um tipo de acesso.</p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        {contexts.map((context) => (
          <form
            key={context.type === "COMPANY_MEMBER" ? `company-${context.companyId}` : context.type}
            action={chooseContext}
          >
            <input type="hidden" name="type" value={context.type} />
            {context.type === "COMPANY_MEMBER" && (
              <input type="hidden" name="companyId" value={context.companyId} />
            )}
            <button
              type="submit"
              className="w-full rounded-md border border-zinc-200 p-4 text-left text-sm font-medium text-zinc-950 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-50 dark:hover:border-zinc-600"
            >
              {contextLabel(context, user)}
            </button>
          </form>
        ))}
      </div>
      <form action={logout}>
        <button type="submit" className="text-sm text-zinc-500 underline underline-offset-4">
          Sair
        </button>
      </form>
    </div>
  );
}
