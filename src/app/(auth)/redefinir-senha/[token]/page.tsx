import { ResetPasswordForm } from "./reset-password-form";

export default async function RedefinirSenhaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Redefinir senha</h1>
        <p className="mt-1 text-sm text-zinc-500">Escolha uma nova senha para sua conta.</p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
