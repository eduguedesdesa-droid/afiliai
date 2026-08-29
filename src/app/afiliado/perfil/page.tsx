import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AffiliateProfileForm } from "./affiliate-profile-form";

export default async function AfiliadoPerfilPage() {
  const { user, context } = await requireContext("AFFILIATE");
  if (context.type !== "AFFILIATE") return null;

  const [account, affiliateProfile] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { name: true, email: true, phone: true },
    }),
    prisma.affiliateProfile.findUniqueOrThrow({
      where: { userId: user.id },
      select: {
        displayName: true,
        bio: true,
        document: true,
        city: true,
        instagramUrl: true,
        tiktokUrl: true,
        otherSocialUrl: true,
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Perfil</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Seus dados de contato e das suas redes. Ficam visíveis pra empresas quando avaliam sua participação numa
          campanha. Você pode alterar quando quiser.
        </p>
      </div>
      <AffiliateProfileForm profile={{ ...account, ...affiliateProfile }} />
    </div>
  );
}
