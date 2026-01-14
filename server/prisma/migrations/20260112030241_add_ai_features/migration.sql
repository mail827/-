-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN     "aiBridePersonality" TEXT,
ADD COLUMN     "aiCustomQna" JSONB,
ADD COLUMN     "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiGroomPersonality" TEXT,
ADD COLUMN     "aiMenuInfo" JSONB,
ADD COLUMN     "aiSecrets" JSONB,
ADD COLUMN     "aiTransportInfo" JSONB;

-- CreateTable
CREATE TABLE "AiChat" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiChat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AiChat" ADD CONSTRAINT "AiChat_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
