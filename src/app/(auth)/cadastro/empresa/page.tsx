import Link from "next/link";
import { SignupEmpresaForm } from "./signup-empresa-form";

export default function SignupEmpresaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Criar conta da empresa</h1>
        <p className="mt-1 text-sm text-zinc-500">Comece a criar suas campanhas de indicação e afiliados.</p>
      </div>
      <SignupEmpresaForm />
      <p className="text-sm text-zinc-500">
        É afiliado?{" "}
        <Link href="/cadastro/afiliado" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
          Cadastre-se como afiliado
        </Link>
      </p>
    </div>
  );
}
