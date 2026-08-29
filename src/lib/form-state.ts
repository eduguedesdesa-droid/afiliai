/**
 * Formato padrão de retorno de Server Actions usadas com `useActionState`.
 * `success` é opcional e só existe pra diferenciar a cor de `message` (verde
 * vs. vermelho) em formulários que ficam na mesma página após salvar — a
 * maioria das actions não define nada em sucesso (só revalida e segue).
 */
export type FormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
      success?: boolean;
    }
  | undefined;
