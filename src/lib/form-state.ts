/** Formato padrão de retorno de Server Actions usadas com `useActionState`. */
export type FormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
    }
  | undefined;
