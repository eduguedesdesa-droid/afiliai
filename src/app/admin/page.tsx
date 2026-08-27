import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function AdminDashboardPage() {
  const [companiesCount, usersCount, affiliatesCount, campaignsCount] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.affiliateProfile.count(),
    prisma.campaign.count(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Dashboard da plataforma</h1>
        <p className="mt-1 text-sm text-zinc-500">Visão geral de todas as empresas e afiliados no Afiliai.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Empresas" value={String(companiesCount)} />
        <StatCard label="Usuários" value={String(usersCount)} />
        <StatCard label="Afiliados" value={String(affiliatesCount)} />
        <StatCard label="Campanhas" value={String(campaignsCount)} />
      </div>
    </div>
  );
}
