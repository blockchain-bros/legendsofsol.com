-- CreateTable
CREATE TABLE "_NFTToVote" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_NFTToVote_AB_unique" ON "_NFTToVote"("A", "B");

-- CreateIndex
CREATE INDEX "_NFTToVote_B_index" ON "_NFTToVote"("B");

-- AddForeignKey
ALTER TABLE "_NFTToVote" ADD CONSTRAINT "_NFTToVote_A_fkey" FOREIGN KEY ("A") REFERENCES "nfts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NFTToVote" ADD CONSTRAINT "_NFTToVote_B_fkey" FOREIGN KEY ("B") REFERENCES "votes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
