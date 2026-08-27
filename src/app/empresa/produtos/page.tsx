import { requireContext } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { toggleProductActive } from "@/modules/products/actions";
import { formatCentsBRL } from "@/components/dashboard/stat-card";
import { NewProductForm } from "./new-product-form";

export default async function ProdutosPage() {
  const { context } = await requireContext("COMPANY_MEMBER");
  const companyId = context.type === "COMPANY_MEMBER" ? context.companyId : "";

  const products = await prisma.product.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Produtos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Cadastre os produtos ou serviços que podem ser vinculados às campanhas.
        </p>
      </div>

      <NewProductForm />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">SKU</th>
              <th className="px-4 py-2 font-medium">Categoria</th>
              <th className="px-4 py-2 font-medium">Preço</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  Nenhum produto cadastrado ainda.
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                <td className="px-4 py-2 text-zinc-950 dark:text-zinc-50">{product.name}</td>
                <td className="px-4 py-2 text-zinc-500">{product.sku ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-500">{product.category ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-500">
                  {product.priceCents != null ? formatCentsBRL(product.priceCents) : "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      product.active
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900"
                    }
                  >
                    {product.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={toggleProductActive}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button type="submit" className="text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
                      {product.active ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
