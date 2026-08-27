import { test, expect } from "@playwright/test";
import { uniqueEmail, uniqueName } from "./helpers/unique";

/**
 * O teste "canhão" — exercita o produto inteiro numa única jornada, o mesmo
 * cenário do exemplo usado na definição do produto (README.md): venda de
 * R$500 com 10% de comissão = R$50 pro afiliado.
 *
 * Único teste da suíte que cria uma campanha ACTIVE com attributionMethod
 * LINK — os outros specs não devem criar nenhuma, senão "Campanhas
 * disponíveis" (lista global, não filtrada por empresa) passa a ter mais de
 * um resultado e os locators por posição (`.first()`) ficam ambíguos.
 */
test("fluxo completo: campanha → afiliado → clique → venda → comissão → pagamento", async ({ browser }) => {
  test.setTimeout(60_000);

  const empresaContext = await browser.newContext();
  const empresaPage = await empresaContext.newPage();
  const afiliadoContext = await browser.newContext();
  const afiliadoPage = await afiliadoContext.newPage();

  const companyName = "Loja Core " + uniqueName("loja");
  const affiliateName = "Afiliado Core " + uniqueName("afiliado");
  const campaignName = "Campanha Core " + uniqueName("campanha");

  let campaignId = "";

  await test.step("empresa se cadastra", async () => {
    await empresaPage.goto("/cadastro/empresa");
    await empresaPage.fill("#companyName", companyName);
    await empresaPage.fill("#name", "Dona da Loja Core");
    await empresaPage.fill("#email", uniqueEmail("core-empresa"));
    await empresaPage.fill("#password", "SenhaForte123");
    await empresaPage.click('button[type="submit"]');
    await empresaPage.waitForURL((url) => url.pathname === "/empresa");
  });

  await test.step("empresa cria uma campanha (LINK, aprovação manual)", async () => {
    await empresaPage.goto("/empresa/campanhas/nova");
    await empresaPage.fill("#name", campaignName);
    await empresaPage.selectOption("#attributionMethod", "LINK");
    await empresaPage.selectOption("#conversionType", "SALE");
    await empresaPage.selectOption("#approvalMode", "MANUAL");
    await empresaPage.click('button:has-text("Criar campanha")');

    // O regex bate também na própria URL do formulário (.../campanhas/nova)
    // — precisa excluir "nova" explicitamente, senão waitForURL resolve na
    // hora (a URL atual já "bate") em vez de esperar o redirect de verdade
    // pra página de detalhe da campanha recém-criada.
    await empresaPage.waitForURL(
      (url) => /\/empresa\/campanhas\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/nova")
    );
    campaignId = new URL(empresaPage.url()).pathname.split("/").pop()!;
    expect(campaignId).toBeTruthy();
  });

  await test.step("empresa define a regra de recompensa: 10% por venda", async () => {
    await empresaPage.selectOption("#rewardType", "PERCENTAGE");
    await empresaPage.fill("#value", "10");
    await empresaPage.click('button:has-text("Definir regra de recompensa")');
    await expect(empresaPage.getByText(/Atual: Percentual.*10/)).toBeVisible();
  });

  await test.step("empresa ativa a campanha", async () => {
    await empresaPage.click('button:has-text("Ativar campanha")');
    await expect(empresaPage.getByText("Ativa", { exact: true })).toBeVisible();
  });

  await test.step("afiliado se cadastra", async () => {
    await afiliadoPage.goto("/cadastro/afiliado");
    await afiliadoPage.fill("#name", affiliateName);
    await afiliadoPage.fill("#email", uniqueEmail("core-afiliado"));
    await afiliadoPage.fill("#password", "SenhaForte123");
    await afiliadoPage.click('button[type="submit"]');
    await afiliadoPage.waitForURL((url) => url.pathname === "/afiliado");
  });

  await test.step("afiliado solicita participação na campanha", async () => {
    await afiliadoPage.goto("/afiliado/campanhas-disponiveis");
    await expect(afiliadoPage.getByText(campaignName)).toBeVisible();
    // Única campanha ativa da suíte inteira (ver comentário no topo do arquivo).
    await afiliadoPage.getByRole("button", { name: "Participar" }).first().click();
    await expect(afiliadoPage.getByText("Nenhuma campanha disponível no momento.")).toBeVisible();
  });

  await test.step("empresa aprova a solicitação", async () => {
    await empresaPage.goto("/empresa/afiliados");
    await expect(empresaPage.getByText(affiliateName)).toBeVisible();
    await empresaPage.getByRole("button", { name: "Aprovar" }).first().click();
    await expect(empresaPage.getByText("Nenhuma solicitação pendente.")).toBeVisible();
  });

  let linkCode = "";

  await test.step("afiliado vê o link gerado e um visitante anônimo é rastreado ao clicar", async () => {
    await afiliadoPage.goto("/afiliado/links");
    const linkLine = await afiliadoPage.locator(".select-all").first().textContent();
    linkCode = linkLine!.trim().split("/r/")[1]!.trim();
    expect(linkCode).toBeTruthy();

    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();
    // goto() já espera a navegação (inclusive o redirect de /r/[code])
    // terminar — não precisa de um waitForURL separado depois.
    await visitorPage.goto(`/r/${linkCode}`);
    // Sem destinationUrl configurada e sem cupom (attributionMethod=LINK não
    // gera cupom) — cai no fallback público da campanha.
    expect(visitorPage.url()).toContain(`/c/${campaignId}`);
    await visitorContext.close();

    await afiliadoPage.reload();
    await expect(afiliadoPage.getByText("1 clique(s) registrados")).toBeVisible();
  });

  await test.step("empresa registra uma venda de R$500 atribuída ao afiliado", async () => {
    await empresaPage.goto(`/empresa/vendas/nova/${campaignId}`);
    await empresaPage.selectOption("#campaignAffiliateId", { label: affiliateName });
    await empresaPage.fill("#grossAmount", "500");
    await empresaPage.click('button:has-text("Registrar venda")');

    await empresaPage.waitForURL((url) => url.pathname === "/empresa/vendas");
    const row = empresaPage.locator("tr", { hasText: affiliateName });
    await expect(row).toContainText("500,00");
  });

  await test.step("a venda gera uma comissão PENDENTE de R$50 (10%)", async () => {
    await empresaPage.goto("/empresa/comissoes");
    // .justify-between é a classe da linha inteira (ver comentário em
    // e2e/admin.spec.ts) — um filtro genérico por "div" pegaria também o
    // div interno que não contém o badge de status.
    const commissionCard = empresaPage.locator("div.justify-between", { hasText: affiliateName });
    await expect(commissionCard).toContainText("50,00");
    await expect(commissionCard.getByText("Pendente")).toBeVisible();
  });

  await test.step("empresa aprova a comissão", async () => {
    await empresaPage.getByRole("button", { name: "Aprovar" }).first().click();
    await expect(empresaPage.getByText("Aprovada").first()).toBeVisible();
  });

  await test.step("empresa gera um pagamento com a comissão aprovada", async () => {
    await empresaPage.goto("/empresa/payouts/novo");
    await empresaPage.getByText(affiliateName).click();
    await empresaPage.waitForURL(/\/empresa\/payouts\/novo\/[^/]+$/);
    await empresaPage.click('button:has-text("Gerar pagamento")');
    await empresaPage.waitForURL(/\/empresa\/payouts\/[^/]+$/);
  });

  await test.step("empresa marca o pagamento como pago", async () => {
    await empresaPage.click('button:has-text("Marcar como pago")');
    await expect(empresaPage.getByText("Pago", { exact: true })).toBeVisible();
  });

  await test.step("afiliado vê a comissão como paga em Ganhos", async () => {
    await afiliadoPage.goto("/afiliado/ganhos");
    await expect(afiliadoPage.getByText("Recebidas")).toBeVisible();
    const commissionCard = afiliadoPage.locator("div.justify-between", { hasText: "50,00" });
    await expect(commissionCard.getByText("Paga")).toBeVisible();
  });

  await empresaContext.close();
  await afiliadoContext.close();
});
