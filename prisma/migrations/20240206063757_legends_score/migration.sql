-- CreateTable
CREATE TABLE "legend_scores" (
    "id" SERIAL NOT NULL,
    "twitterHandle" TEXT NOT NULL,
    "whitelistedCount" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "legend_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legend_scores_twitterHandle_key" ON "legend_scores"("twitterHandle");

-- AddForeignKey
ALTER TABLE "legend_scores" ADD CONSTRAINT "legend_scores_twitterHandle_fkey" FOREIGN KEY ("twitterHandle") REFERENCES "users"("twitterHandle") ON DELETE RESTRICT ON UPDATE CASCADE;
