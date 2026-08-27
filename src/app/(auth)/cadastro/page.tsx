import Link from "next/link";

export default function CadastroPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Criar conta</h1>
        <p className="mt-1 text-sm text-zinc-500">Como você quer usar o Afiliai?</p>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/cadastro/empresa"
          className="rounded-md border border-zinc-200 p-4 text-left transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <span className="block font-medium text-zinc-950 dark:text-zinc-50">Sou uma empresa</span>
          <span className="mt-1 block text-sm text-zinc-500">
            Quero criar campanhas de indicação/afiliados para o meu negócio.
          </span>
        </Link>
        <Link
          href="/cadastro/afiliado"
          className="rounded-md border border-zinc-200 p-4 text-left transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <span className="block font-medium text-zinc-950 dark:text-zinc-50">Sou afiliado</span>
          <span className="mt-1 block text-sm text-zinc-500">
            Quero divulgar campanhas e ganhar comissão por indicação.
          </span>
        </Link>
      </div>
      <p className="text-sm text-zinc-500">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
          Entrar
        </Link>
      </p>
    </div>
  );
}
