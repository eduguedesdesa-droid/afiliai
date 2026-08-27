import Link from "next/link";
import { SignupAfiliadoForm } from "./signup-afiliado-form";

export default function SignupAfiliadoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Criar conta de afiliado</h1>
        <p className="mt-1 text-sm text-zinc-500">Participe de campanhas e acompanhe seus ganhos.</p>
      </div>
      <SignupAfiliadoForm />
      <p className="text-sm text-zinc-500">
        É uma empresa?{" "}
        <Link href="/cadastro/empresa" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
          Cadastre sua empresa
        </Link>
      </p>
    </div>
  );
}
