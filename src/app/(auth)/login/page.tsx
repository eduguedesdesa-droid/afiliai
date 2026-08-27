import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ senhaRedefinida?: string }>;
}) {
  const { senhaRedefinida } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Entrar</h1>
        <p className="mt-1 text-sm text-zinc-500">Acesse sua conta Afiliai.</p>
      </div>
      {senhaRedefinida && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          Senha redefinida com sucesso. Entre com sua nova senha.
        </p>
      )}
      <LoginForm />
      <p className="text-sm text-zinc-500">
        Ainda não tem conta?{" "}
        <Link href="/cadastro/empresa" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
