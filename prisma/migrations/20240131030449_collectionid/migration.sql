-- AlterTable
ALTER TABLE "nfts" RENAME COLUMN "collectionId" TO "collectionKey";

-- AlterTable
ALTER TABLE "nfts" ADD COLUMN     "collectionId" INTEGER;

-- AddForeignKey
ALTER TABLE "nfts" ADD CONSTRAINT "nfts_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update relations in "nfts"
UPDATE "nfts" SET "collectionId" = "collections"."id" FROM "collections" WHERE "nfts"."collectionKey" = "collections"."collectionKey";
