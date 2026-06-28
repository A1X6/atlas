-- AlterEnum
ALTER TYPE "TokenType" ADD VALUE 'PHONE_VERIFY';

-- AlterTable
ALTER TABLE "Phone" ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VerificationToken" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phone" TEXT;
