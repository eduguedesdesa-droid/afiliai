import Link from "next/link";
import { logout } from "@/modules/auth/actions";
import type { ActiveContext } from "@/lib/active-context";

type NavItem = { href: string; label: string };

export function DashboardShell({
  title,
  nav,
  userName,
  hasMultipleContexts,
  children,
}: {
  title: string;
  nav: NavItem[];
  userName: string;
  hasMultipleContexts: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="flex w-60 flex-col justify-between border-r border-zinc-200 bg-white px-4 py-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-8">
          <div>
            <span className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Afiliai</span>
            <p className="mt-0.5 text-xs text-zinc-500">{title}</p>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">{userName}</p>
          {hasMultipleContexts && (
            <Link href="/escolher-contexto" className="text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
              Trocar contexto
            </Link>
          )}
          <form action={logout}>
            <button type="submit" className="text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
              Sair
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-zinc-50 px-8 py-8 dark:bg-black">{children}</main>
    </div>
  );
}

export function contextsEqualCount(contexts: ActiveContext[]) {
  return contexts.length > 1;
}
