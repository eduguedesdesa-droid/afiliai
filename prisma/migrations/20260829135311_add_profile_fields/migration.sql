-- AlterTable
ALTER TABLE "affiliate_profiles" ADD COLUMN     "city" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "otherSocialUrl" TEXT,
ADD COLUMN     "tiktokUrl" TEXT;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "city" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "otherSocialUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tiktokUrl" TEXT;
