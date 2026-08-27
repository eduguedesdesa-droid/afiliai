-- DropIndex
DROP INDEX "tracking_sessions_companyId_visitorId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "tracking_sessions_companyId_visitorId_key" ON "tracking_sessions"("companyId", "visitorId");
