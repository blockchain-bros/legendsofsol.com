/*
  Warnings:

  - The primary key for the `nfts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `nfts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `nftaddress` to the `nfts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "nfts" DROP CONSTRAINT "nfts_pkey";
ALTER TABLE "nfts" RENAME COLUMN "id" TO "nftAddress";
ALTER TABLE "nfts" ADD COLUMN "id" SERIAL PRIMARY KEY;

