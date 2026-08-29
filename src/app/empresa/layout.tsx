import { requireContext, availableContexts } from "@/lib/dal";
import { DashboardShell } from "@/components/dashboard/shell";

const NAV = [
  { href: "/empresa", label: "Dashboard" },
  { href: "/empresa/campanhas", label: "Campanhas" },
  { href: "/empresa/afiliados", label: "Afiliados" },
  { href: "/empresa/produtos", label: "Produtos" },
  { href: "/empresa/leads", label: "Leads" },
  { href: "/empresa/vendas", label: "Vendas" },
  { href: "/empresa/comissoes", label: "Comissões" },
  { href: "/empresa/payouts", label: "Pagamentos" },
  { href: "/empresa/relatorios", label: "Relatórios" },
  { href: "/empresa/perfil", label: "Perfil" },
];

export default async function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireContext("COMPANY_MEMBER");
  const hasMultipleContexts = availableContexts(user).length > 1;

  return (
    <DashboardShell title="Empresa" nav={NAV} userName={user.name} hasMultipleContexts={hasMultipleContexts}>
      {children}
    </DashboardShell>
  );
}
