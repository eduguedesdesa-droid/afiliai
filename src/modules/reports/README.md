# Módulo: Relatórios

Consultas agregadas para dashboards e exportação (CSV) de campanhas, afiliados e comissões.

**Status:** implementado (Fase 4):

- Route handlers GET protegidos (`requireContext("COMPANY_MEMBER")`) em
  `/empresa/relatorios/export/{campanhas,afiliados,vendas,comissoes}`,
  retornando CSV (`src/lib/csv.ts`) com `Content-Disposition: attachment`.
- UI em `/empresa/relatorios` com um link de download por relatório.

Não há um "módulo" de serviço próprio — cada relatório é uma consulta
direta ao Prisma dentro do seu route handler; não há lógica de negócio a
reutilizar aqui além da formatação do CSV.

Ainda não implementado: filtros por período, relatório específico do
afiliado (hoje só a empresa exporta), agendamento/envio por e-mail.
