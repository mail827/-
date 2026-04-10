ALTER TABLE "AiSnap"
ADD COLUMN "falRequestId" TEXT,
ADD COLUMN "providerStatus" TEXT,
ADD COLUMN "providerResultUrl" TEXT,
ADD COLUMN "pollCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastPolledAt" TIMESTAMP(3),
ADD COLUMN "reconcileAfter" TIMESTAMP(3),
ADD COLUMN "errorMessage" TEXT;
