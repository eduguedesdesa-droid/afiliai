import { requireContext, availableContexts } from "@/lib/dal";
import { DashboardShell } from "@/components/dashboard/shell";

const NAV = [
  { href: "/afiliado", label: "Dashboard" },
  { href: "/afiliado/campanhas-disponiveis", label: "Campanhas disponíveis" },
  { href: "/afiliado/minhas-campanhas", label: "Minhas campanhas" },
  { href: "/afiliado/links", label: "Links" },
  { href: "/afiliado/cupons", label: "Cupons" },
  { href: "/afiliado/conversoes", label: "Conversões" },
  { href: "/afiliado/ganhos", label: "Ganhos" },
  { href: "/afiliado/perfil", label: "Perfil" },
];

export default async function AfiliadoLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireContext("AFFILIATE");
  const hasMultipleContexts = availableContexts(user).length > 1;

  return (
    <DashboardShell title="Afiliado" nav={NAV} userName={user.name} hasMultipleContexts={hasMultipleContexts}>
      {children}
    </DashboardShell>
  );
}
