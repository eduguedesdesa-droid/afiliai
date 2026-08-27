import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-8 py-24 text-center">
        <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-zinc-100 dark:text-black">
          Afiliai
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Marketing de indicação e afiliados para o seu negócio
        </h1>
        <p className="max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Crie campanhas, distribua cupons e links rastreáveis, e acompanhe
          conversões e comissões de clientes, creators e parceiros em um só
          lugar.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/cadastro/empresa"
            className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
          >
            Sou uma empresa
          </Link>
          <Link
            href="/cadastro/afiliado"
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-6 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Sou afiliado
          </Link>
        </div>
        <Link href="/login" className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
          Já tenho conta — entrar
        </Link>
      </main>
    </div>
  );
}
