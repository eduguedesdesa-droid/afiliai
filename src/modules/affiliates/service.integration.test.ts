import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/db-reset";
import { createCompany, createAffiliateProfile } from "@/test/fixtures";
import { addAffiliateManually } from "@/modules/affiliates/service";

beforeEach(async () => {
  await resetDatabase();
});

function baseInput(overrides: Partial<Parameters<typeof addAffiliateManually>[0]> = {}) {
  return {
    companyId: "",
    name: "Novo Afiliado",
    email: "novo.afiliado@teste.com",
    couponCode: "NOVO10",
    phone: null,
    city: null,
    document: null,
    instagramUrl: null,
    tiktokUrl: null,
    otherSocialUrl: null,
    ...overrides,
  };
}

describe("addAffiliateManually", () => {
  it("creates a brand-new account, an invite token, the default campaign and the coupon", async () => {
    const company = await createCompany();

    const result = await addAffiliateManually(
      baseInput({ companyId: company.id, phone: "11999998888", city: "São Paulo" })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.isNewAccount).toBe(true);
    expect(result.inviteToken).not.toBeNull();

    const user = await prisma.user.findUnique({ where: { email: "novo.afiliado@teste.com" } });
    expect(user).not.toBeNull();
    expect(user?.phone).toBe("11999998888");

    const role = await prisma.userRole.findFirst({ where: { userId: user!.id, role: "AFFILIATE" } });
    expect(role).not.toBeNull();

    const affiliateProfile = await prisma.affiliateProfile.findUnique({ where: { userId: user!.id } });
    expect(affiliateProfile?.city).toBe("São Paulo");

    const campaign = await prisma.campaign.findFirst({ where: { companyId: company.id } });
    expect(campaign?.name).toBe("Divulgação geral");
    expect(campaign?.attributionMethod).toBe("COUPON");

    const campaignAffiliate = await prisma.campaignAffiliate.findFirst({
      where: { campaignId: campaign!.id, affiliateProfileId: affiliateProfile!.id },
      include: { coupons: true },
    });
    expect(campaignAffiliate?.status).toBe("APPROVED");
    expect(campaignAffiliate?.coupons[0]?.code).toBe("NOVO10");

    const token = await prisma.passwordResetToken.findFirst({ where: { userId: user!.id } });
    expect(token).not.toBeNull();
  });

  it("reuses the same default campaign across multiple manual adds for the same company", async () => {
    const company = await createCompany();

    await addAffiliateManually(baseInput({ companyId: company.id, email: "um@teste.com", couponCode: "UM10" }));
    await addAffiliateManually(baseInput({ companyId: company.id, email: "dois@teste.com", couponCode: "DOIS10" }));

    const campaigns = await prisma.campaign.findMany({ where: { companyId: company.id } });
    expect(campaigns).toHaveLength(1);
  });

  it("adds an affiliate who already has an account without creating a new user or overwriting their profile", async () => {
    const company = await createCompany();
    const existing = await createAffiliateProfile({ displayName: "Afiliado Existente" });
    const existingUser = await prisma.user.findUniqueOrThrow({ where: { id: existing.userId } });
    await prisma.affiliateProfile.update({ where: { id: existing.id }, data: { city: "Curitiba" } });

    const result = await addAffiliateManually(
      baseInput({
        companyId: company.id,
        email: existingUser.email,
        couponCode: "EXIST10",
        city: "Cidade Errada Que Não Deve Sobrescrever",
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.isNewAccount).toBe(false);
    expect(result.inviteToken).toBeNull();

    const profileAfter = await prisma.affiliateProfile.findUnique({ where: { id: existing.id } });
    expect(profileAfter?.city).toBe("Curitiba"); // não foi sobrescrito

    const campaignAffiliate = await prisma.campaignAffiliate.findFirst({
      where: { affiliateProfileId: existing.id, campaign: { companyId: company.id } },
      include: { coupons: true },
    });
    expect(campaignAffiliate?.status).toBe("APPROVED");
    expect(campaignAffiliate?.coupons[0]?.code).toBe("EXIST10");
  });

  it("grants the AFFILIATE role to an existing user who didn't have an affiliate profile yet", async () => {
    const company = await createCompany();
    const ownerUser = await prisma.user.create({
      data: { email: "dono@teste.com", passwordHash: "x", name: "Dono da Empresa" },
    });

    const result = await addAffiliateManually(
      baseInput({ companyId: company.id, email: "dono@teste.com", couponCode: "DONO10" })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.isNewAccount).toBe(false);

    const role = await prisma.userRole.findFirst({ where: { userId: ownerUser.id, role: "AFFILIATE" } });
    expect(role).not.toBeNull();
    const affiliateProfile = await prisma.affiliateProfile.findUnique({ where: { userId: ownerUser.id } });
    expect(affiliateProfile).not.toBeNull();
  });

  it("refuses a coupon code that's already in use", async () => {
    const company = await createCompany();
    await addAffiliateManually(baseInput({ companyId: company.id, email: "primeiro@teste.com", couponCode: "DUP10" }));

    const result = await addAffiliateManually(
      baseInput({ companyId: company.id, email: "segundo@teste.com", couponCode: "DUP10" })
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("COUPON_CODE_TAKEN");

    const secondUser = await prisma.user.findUnique({ where: { email: "segundo@teste.com" } });
    expect(secondUser).toBeNull(); // nada foi criado — falhou antes da transação
  });
});
