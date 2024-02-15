-- CreateTable
CREATE TABLE "hello_moon_collections" (
    "id" SERIAL NOT NULL,
    "collectionName" TEXT NOT NULL,
    "helloMoonCollectionId" TEXT NOT NULL,
    "floorPrice" BIGINT,
    "volume" BIGINT,
    "averageWashScore" DOUBLE PRECISION,
    "slug" TEXT,
    "supply" INTEGER,
    "currentOwnerCount" INTEGER,
    "ownersAvgUsdcHoldings" INTEGER,
    "avgPriceSol" DOUBLE PRECISION,
    "collectionId" INTEGER NOT NULL,

    CONSTRAINT "hello_moon_collections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hello_moon_collections_helloMoonCollectionId_key" ON "hello_moon_collections"("helloMoonCollectionId");

-- AddForeignKey
ALTER TABLE "hello_moon_collections" ADD CONSTRAINT "hello_moon_collections_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
