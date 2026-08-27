import Link from "next/link";
import { RequestResetForm } from "./request-reset-form";

export default function RecuperarSenhaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Recuperar senha</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>
      <RequestResetForm />
      <Link href="/login" className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
        Voltar para o login
      </Link>
    </div>
  );
}
