"use client";

import { useState } from "react";

/**
 * Como TextField, mas com um ícone clicável ao lado que atualiza em tempo
 * real conforme a pessoa digita (ex.: telefone → WhatsApp, @ do Instagram →
 * perfil do Instagram). `buildHref` decide se/para onde o ícone aponta;
 * quando retorna `null` (campo vazio ou valor não vira link válido), o
 * ícone simplesmente não aparece.
 */
type TextFieldWithLinkProps = {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  errors?: string[];
  defaultValue?: string;
  buildHref: (value: string) => string | null;
  renderIcon: (href: string) => React.ReactNode;
};

export function TextFieldWithLink({
  id,
  name,
  label,
  type = "text",
  required = true,
  errors,
  defaultValue = "",
  buildHref,
  renderIcon,
}: TextFieldWithLinkProps) {
  const [value, setValue] = useState(defaultValue);
  const href = buildHref(value);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={errors && errors.length > 0 ? true : undefined}
          aria-describedby={errors && errors.length > 0 ? `${id}-error` : undefined}
          className="h-10 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {href && renderIcon(href)}
      </div>
      {errors?.map((error) => (
        <p key={error} id={`${id}-error`} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ))}
    </div>
  );
}
