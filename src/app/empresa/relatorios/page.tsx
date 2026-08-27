const REPORTS = [
  { href: "/empresa/relatorios/export/campanhas", label: "Campanhas", description: "Status, método de atribuição, afiliados, vendas e leads por campanha." },
  { href: "/empresa/relatorios/export/afiliados", label: "Afiliados", description: "Cupom, link, cliques e comissão gerada/paga por afiliado em cada campanha." },
  { href: "/empresa/relatorios/export/vendas", label: "Vendas", description: "Todas as vendas registradas, com a comissão de cada uma." },
  { href: "/empresa/relatorios/export/comissoes", label: "Comissões", description: "Todas as comissões geradas, com tipo e status." },
];

export default function RelatoriosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Relatórios</h1>
        <p className="mt-1 text-sm text-zinc-500">Exporte seus dados em CSV para abrir em qualquer planilha.</p>
      </div>

      <div className="flex flex-col gap-3">
        {REPORTS.map((report) => (
          <a
            key={report.href}
            href={report.href}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
          >
            <div>
              <p className="font-medium text-zinc-950 dark:text-zinc-50">{report.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{report.description}</p>
            </div>
            <span className="text-xs font-medium text-zinc-500 underline underline-offset-4">Baixar CSV</span>
          </a>
        ))}
      </div>
    </div>
  );
}
