import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { USER_STATUS_LABEL, USER_STATUS_TONE } from "@/modules/admin/labels";
import { suspendUser, reactivateUser } from "@/modules/admin/actions";

function roleLabel(role: { role: string; company: { name: string } | null }): string {
  if (role.role === "PLATFORM_ADMIN") return "Admin da plataforma";
  if (role.role === "AFFILIATE") return "Afiliado";
  return `Empresa: ${role.company?.name ?? "?"}`;
}

export default async function AdminUsuariosPage() {
  const currentAdmin = await getCurrentUser();

  const users = await prisma.user.findMany({
    include: { roles: { select: { role: true, company: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Usuários</h1>
        <p className="mt-1 text-sm text-zinc-500">Todos os usuários e seus papéis na plataforma.</p>
      </div>

      <div className="flex flex-col gap-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div>
              <div className="flex items-center gap-3">
                <p className="font-medium text-zinc-950 dark:text-zinc-50">{user.name}</p>
                <Badge tone={USER_STATUS_TONE[user.status]}>{USER_STATUS_LABEL[user.status]}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">{user.email}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {user.roles.map((role, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                  >
                    {roleLabel(role)}
                  </span>
                ))}
              </div>
            </div>
            {user.id === currentAdmin.id ? (
              <span className="text-xs text-zinc-400">você</span>
            ) : user.status === "SUSPENDED" ? (
              <form action={reactivateUser}>
                <input type="hidden" name="userId" value={user.id} />
                <button
                  type="submit"
                  className="h-9 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                >
                  Reativar
                </button>
              </form>
            ) : (
              <form action={suspendUser}>
                <input type="hidden" name="userId" value={user.id} />
                <button
                  type="submit"
                  className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Suspender
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
