export function EmBreve({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{titulo}</h1>
      <p className="max-w-lg text-sm text-zinc-500">{descricao}</p>
      <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
        Este módulo ainda não foi implementado — chega em uma próxima etapa do plano de implementação.
      </div>
    </div>
  );
}
