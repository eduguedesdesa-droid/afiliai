import { getCurrentUser } from "@/lib/dal";
import { logout } from "@/modules/auth/actions";

export default async function EmpresaSuspensaPage() {
  // Garante que existe uma sessão válida (redireciona para /login se não) —
  // esta página só é útil para quem acabou de esbarrar no bloqueio.
  await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Empresa suspensa</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        O acesso desta empresa foi suspenso pela administração da plataforma. Entre em contato com o
        suporte do Afiliai para regularizar a situação.
      </p>
      <form action={logout}>
        <button type="submit" className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
          Sair
        </button>
      </form>
    </div>
  );
}
