-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('KAKAO', 'GOOGLE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('ROMANTIC_CLASSIC', 'MODERN_MINIMAL', 'BOHEMIAN_DREAM', 'LUXURY_GOLD', 'PLAYFUL_POP', 'SENIOR_SIMPLE', 'FOREST_GARDEN', 'OCEAN_BREEZE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "StoryType" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "Side" AS ENUM ('GROOM', 'BRIDE');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'REPLIED', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "profileImage" TEXT,
    "provider" "Provider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentKey" TEXT,
    "orderId" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wedding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "slug" TEXT NOT NULL,
    "theme" "Theme" NOT NULL DEFAULT 'ROMANTIC_CLASSIC',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "weddingDate" TIMESTAMP(3) NOT NULL,
    "weddingTime" TEXT NOT NULL,
    "groomName" TEXT NOT NULL,
    "groomNameEn" TEXT,
    "groomPhone" TEXT,
    "groomFatherName" TEXT,
    "groomMotherName" TEXT,
    "groomFatherPhone" TEXT,
    "groomMotherPhone" TEXT,
    "brideName" TEXT NOT NULL,
    "brideNameEn" TEXT,
    "bridePhone" TEXT,
    "brideFatherName" TEXT,
    "brideMotherName" TEXT,
    "brideFatherPhone" TEXT,
    "brideMotherPhone" TEXT,
    "showParents" BOOLEAN NOT NULL DEFAULT true,
    "greeting" TEXT,
    "greetingTitle" TEXT,
    "loveStory" TEXT,
    "loveStoryType" "StoryType" NOT NULL DEFAULT 'PHOTO',
    "loveStoryVideo" TEXT,
    "venue" TEXT NOT NULL,
    "venueHall" TEXT,
    "venueAddress" TEXT NOT NULL,
    "venuePhone" TEXT,
    "venueMapUrl" TEXT,
    "venueNaverMap" TEXT,
    "venueKakaoMap" TEXT,
    "venueTmap" TEXT,
    "venueLatitude" DOUBLE PRECISION,
    "venueLongitude" DOUBLE PRECISION,
    "groomAccount" TEXT,
    "groomBank" TEXT,
    "groomAccountHolder" TEXT,
    "brideAccount" TEXT,
    "brideBank" TEXT,
    "brideAccountHolder" TEXT,
    "groomFatherAccount" TEXT,
    "groomFatherBank" TEXT,
    "groomFatherAccountHolder" TEXT,
    "groomMotherAccount" TEXT,
    "groomMotherBank" TEXT,
    "groomMotherAccountHolder" TEXT,
    "brideFatherAccount" TEXT,
    "brideFatherBank" TEXT,
    "brideFatherAccountHolder" TEXT,
    "brideMotherAccount" TEXT,
    "brideMotherBank" TEXT,
    "brideMotherAccountHolder" TEXT,
    "tossLink" TEXT,
    "kakaoPayLink" TEXT,
    "closingMessage" TEXT,
    "bgMusicUrl" TEXT,
    "bgMusicAutoPlay" BOOLEAN NOT NULL DEFAULT false,
    "showDday" BOOLEAN NOT NULL DEFAULT true,
    "heroMedia" TEXT,
    "heroMediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "mainColor" TEXT,
    "accentColor" TEXT,
    "fontFamily" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gallery" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rsvp" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "side" "Side" NOT NULL DEFAULT 'GROOM',
    "attending" BOOLEAN NOT NULL,
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "mealCount" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guestbook" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guestbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "type" TEXT NOT NULL DEFAULT 'general',
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "reply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "User"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Package_slug_key" ON "Package"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "Order"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Wedding_orderId_key" ON "Wedding"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Wedding_slug_key" ON "Wedding"("slug");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatLog" ADD CONSTRAINT "ChatLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wedding" ADD CONSTRAINT "Wedding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wedding" ADD CONSTRAINT "Wedding_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guestbook" ADD CONSTRAINT "Guestbook_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
