import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/db-reset";
import { createApprovedCampaignScenario, createCampaignAffiliate, createAffiliateLink } from "@/test/fixtures";
import { hashIp, registerClickAndAttribute, resolveAttributionForVisitor } from "@/modules/tracking/service";

beforeEach(async () => {
  await resetDatabase();
});

describe("hashIp", () => {
  it("hashes a non-null IP deterministically and never returns the raw value", () => {
    const hashed = hashIp("203.0.113.1");
    expect(hashed).not.toBeNull();
    expect(hashed).not.toBe("203.0.113.1");
    expect(hashed).toBe(hashIp("203.0.113.1"));
  });

  it("returns null for a null IP", () => {
    expect(hashIp(null)).toBeNull();
  });
});

describe("registerClickAndAttribute", () => {
  it("records a click, increments the link's counter and creates a tracking session", async () => {
    const scenario = await createApprovedCampaignScenario();

    const result = await registerClickAndAttribute({
      code: scenario.affiliateLink.code,
      visitorId: "visitor-1",
      ipHash: hashIp("203.0.113.1"),
      userAgent: "vitest",
      referrer: null,
      utm: null,
    });

    expect(result?.campaign.id).toBe(scenario.campaign.id);

    const clicks = await prisma.click.findMany({ where: { affiliateLinkId: scenario.affiliateLink.id } });
    expect(clicks).toHaveLength(1);

    const link = await prisma.affiliateLink.findUniqueOrThrow({ where: { id: scenario.affiliateLink.id } });
    expect(link.clicksCount).toBe(1);

    const session = await prisma.trackingSession.findUniqueOrThrow({
      where: { companyId_visitorId: { companyId: scenario.company.id, visitorId: "visitor-1" } },
    });
    expect(session.affiliateLinkId).toBe(scenario.affiliateLink.id);
  });

  it("applies last-click: a second click from a different affiliate overwrites the session", async () => {
    const scenario = await createApprovedCampaignScenario();
    const otherAffiliate = await createApprovedCampaignScenario();
    // segundo afiliado, mesma empresa/campanha não é trivial de montar com o
    // scenario helper (ele cria empresa própria) — em vez disso, criamos um
    // segundo CampaignAffiliate na MESMA campanha do primeiro cenário.
    const secondCampaignAffiliate = await createCampaignAffiliate({
      campaignId: scenario.campaign.id,
      affiliateProfileId: otherAffiliate.affiliateProfile.id,
      status: "APPROVED",
    });
    const secondLink = await createAffiliateLink(secondCampaignAffiliate.id);

    await registerClickAndAttribute({
      code: scenario.affiliateLink.code,
      visitorId: "visitor-1",
      ipHash: null,
      userAgent: null,
      referrer: null,
      utm: null,
    });
    await registerClickAndAttribute({
      code: secondLink.code,
      visitorId: "visitor-1",
      ipHash: null,
      userAgent: null,
      referrer: null,
      utm: null,
    });

    const session = await prisma.trackingSession.findUniqueOrThrow({
      where: { companyId_visitorId: { companyId: scenario.company.id, visitorId: "visitor-1" } },
    });
    expect(session.affiliateLinkId).toBe(secondLink.id);
  });

  it("returns null and creates nothing for a code that doesn't exist", async () => {
    const result = await registerClickAndAttribute({
      code: "CODIGO-INEXISTENTE",
      visitorId: "visitor-1",
      ipHash: null,
      userAgent: null,
      referrer: null,
      utm: null,
    });

    expect(result).toBeNull();
    expect(await prisma.click.count()).toBe(0);
  });

  it("returns null when the affiliate is not (or no longer) APPROVED on the campaign", async () => {
    const scenario = await createApprovedCampaignScenario();
    await prisma.campaignAffiliate.update({
      where: { id: scenario.campaignAffiliate.id },
      data: { status: "REMOVED" },
    });

    const result = await registerClickAndAttribute({
      code: scenario.affiliateLink.code,
      visitorId: "visitor-1",
      ipHash: null,
      userAgent: null,
      referrer: null,
      utm: null,
    });

    expect(result).toBeNull();
  });

  it("returns null when the company is suspended", async () => {
    const scenario = await createApprovedCampaignScenario();
    await prisma.company.update({ where: { id: scenario.company.id }, data: { status: "SUSPENDED" } });

    const result = await registerClickAndAttribute({
      code: scenario.affiliateLink.code,
      visitorId: "visitor-1",
      ipHash: null,
      userAgent: null,
      referrer: null,
      utm: null,
    });

    expect(result).toBeNull();
  });
});

describe("resolveAttributionForVisitor", () => {
  it("resolves the affiliate for a visitor with a valid, unexpired session", async () => {
    const scenario = await createApprovedCampaignScenario();
    await registerClickAndAttribute({
      code: scenario.affiliateLink.code,
      visitorId: "visitor-1",
      ipHash: null,
      userAgent: null,
      referrer: null,
      utm: null,
    });

    const attribution = await resolveAttributionForVisitor(scenario.company.id, "visitor-1", scenario.campaign.id);

    expect(attribution).not.toBeNull();
    expect(attribution?.campaignAffiliateId).toBe(scenario.campaignAffiliate.id);
    expect(attribution?.affiliateProfileId).toBe(scenario.affiliateProfile.id);
  });

  it("returns null when the tracking session has expired", async () => {
    const scenario = await createApprovedCampaignScenario({ attributionWindowDays: 1 });
    await registerClickAndAttribute({
      code: scenario.affiliateLink.code,
      visitorId: "visitor-1",
      ipHash: null,
      userAgent: null,
      referrer: null,
      utm: null,
    });
    await prisma.trackingSession.update({
      where: { companyId_visitorId: { companyId: scenario.company.id, visitorId: "visitor-1" } },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const attribution = await resolveAttributionForVisitor(scenario.company.id, "visitor-1", scenario.campaign.id);
    expect(attribution).toBeNull();
  });

  it("returns null when the session points to a different campaign", async () => {
    const scenario = await createApprovedCampaignScenario();
    await registerClickAndAttribute({
      code: scenario.affiliateLink.code,
      visitorId: "visitor-1",
      ipHash: null,
      userAgent: null,
      referrer: null,
      utm: null,
    });

    const attribution = await resolveAttributionForVisitor(scenario.company.id, "visitor-1", "outra-campanha-id");
    expect(attribution).toBeNull();
  });

  it("returns null when there is no session at all for the visitor", async () => {
    const scenario = await createApprovedCampaignScenario();
    const attribution = await resolveAttributionForVisitor(scenario.company.id, "visitante-desconhecido", scenario.campaign.id);
    expect(attribution).toBeNull();
  });
});
