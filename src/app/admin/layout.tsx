import { requireContext, availableContexts } from "@/lib/dal";
import { DashboardShell } from "@/components/dashboard/shell";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/empresas", label: "Empresas" },
  { href: "/admin/usuarios", label: "Usuários" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireContext("PLATFORM_ADMIN");
  const hasMultipleContexts = availableContexts(user).length > 1;

  return (
    <DashboardShell title="Admin da plataforma" nav={NAV} userName={user.name} hasMultipleContexts={hasMultipleContexts}>
      {children}
    </DashboardShell>
  );
}
