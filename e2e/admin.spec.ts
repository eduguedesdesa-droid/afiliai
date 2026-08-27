import { test, expect } from "@playwright/test";
import { uniqueEmail, uniqueName } from "./helpers/unique";
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from "./helpers/e2e-admin";

test("admin suspende uma empresa e o acesso é bloqueado de verdade, não só escondido", async ({ browser }) => {
  test.setTimeout(45_000);

  const empresaContext = await browser.newContext();
  const empresaPage = await empresaContext.newPage();
  const companyName = "Loja Admin " + uniqueName("loja");

  await test.step("empresa se cadastra", async () => {
    await empresaPage.goto("/cadastro/empresa");
    await empresaPage.fill("#companyName", companyName);
    await empresaPage.fill("#name", "Dona da Loja Admin");
    await empresaPage.fill("#email", uniqueEmail("admin-empresa"));
    await empresaPage.fill("#password", "SenhaForte123");
    await empresaPage.click('button[type="submit"]');
    await empresaPage.waitForURL((url) => url.pathname === "/empresa");
  });

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  await test.step("admin da plataforma faz login e vê a empresa recém-criada", async () => {
    await adminPage.goto("/login");
    await adminPage.fill("#email", E2E_ADMIN_EMAIL);
    await adminPage.fill("#password", E2E_ADMIN_PASSWORD);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL((url) => url.pathname === "/admin");

    await adminPage.goto("/admin/empresas");
    await expect(adminPage.getByText(companyName)).toBeVisible();
  });

  // .justify-between é a classe da linha inteira (nome + badge + botão) —
  // um filtro genérico por "div" pegaria também o div interno só do
  // nome+badge (que não contém o botão, já que ele é um irmão, não
  // descendente).
  const companyRow = () => adminPage.locator("div.justify-between", { hasText: companyName });

  await test.step("admin suspende a empresa", async () => {
    await companyRow().getByRole("button", { name: "Suspender" }).click();
    await expect(companyRow().getByText("Suspensa")).toBeVisible();
  });

  await test.step("o acesso da empresa suspensa é bloqueado de verdade (não só escondido na navegação)", async () => {
    await empresaPage.goto("/empresa");
    await empresaPage.waitForURL((url) => url.pathname === "/empresa-suspensa");
    await expect(empresaPage.locator("h1")).toHaveText("Empresa suspensa");
  });

  await test.step("admin reativa a empresa e o acesso volta", async () => {
    await companyRow().getByRole("button", { name: "Reativar" }).click();
    await expect(companyRow().getByText("Ativa", { exact: true })).toBeVisible();

    await empresaPage.goto("/empresa");
    await expect(empresaPage.locator("h1")).toHaveText("Dashboard");
  });

  await empresaContext.close();
  await adminContext.close();
});
