import { test, expect } from "@playwright/test";
import { uniqueEmail, uniqueName } from "./helpers/unique";

test.describe("cadastro e login", () => {
  test("cadastro de empresa cria a conta e entra direto no dashboard", async ({ page }) => {
    const email = uniqueEmail("empresa");

    await page.goto("/cadastro/empresa");
    await page.fill("#companyName", "Loja E2E " + uniqueName("loja"));
    await page.fill("#name", "Dona da Loja");
    await page.fill("#email", email);
    await page.fill("#password", "SenhaForte123");
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => url.pathname === "/empresa");
    await expect(page.locator("h1")).toHaveText("Dashboard");
  });

  test("cadastro de afiliado cria a conta e entra direto no dashboard", async ({ page }) => {
    const email = uniqueEmail("afiliado");

    await page.goto("/cadastro/afiliado");
    await page.fill("#name", "Afiliado E2E");
    await page.fill("#email", email);
    await page.fill("#password", "SenhaForte123");
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => url.pathname === "/afiliado");
    await expect(page.locator("h1")).toHaveText("Dashboard");
  });

  test("logout e login novamente com as mesmas credenciais funciona", async ({ page }) => {
    const email = uniqueEmail("relogin");
    const password = "SenhaForte123";

    await page.goto("/cadastro/afiliado");
    await page.fill("#name", "Vai Sair E Entrar");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === "/afiliado");

    await page.click('button:has-text("Sair")');
    await page.waitForURL((url) => url.pathname === "/login");

    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => url.pathname === "/afiliado");
    await expect(page.locator("h1")).toHaveText("Dashboard");
  });

  test("login com senha errada mostra mensagem genérica, sem revelar se o e-mail existe", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "ninguem-com-esse-email-existe@e2e.afiliai.local");
    await page.fill("#password", "qualquer-coisa");
    await page.click('button[type="submit"]');

    await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
