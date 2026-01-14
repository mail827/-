-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "maxEdits" INTEGER NOT NULL DEFAULT -1;

-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN     "editCount" INTEGER NOT NULL DEFAULT 0;
