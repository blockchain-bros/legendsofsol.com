// src/pages/api/mintder/vote.ts
import { NextApiHandler } from "next";
import prisma from "../../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const MAX_VOTES_PER_HOUR = 60 * 60;

const vote: NextApiHandler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session?.user?.id) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  const userId = Number(session?.user?.id);
  const { nftId, status, weight } = req.body;
  if (!nftId || !status || !weight) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Check the number of votes in the last hour for this user
  const oneHourAgo = new Date(new Date().getTime() - 60 * 60 * 1000);

  const voteCount = await prisma.vote.count({
    where: {
      userId,
      createdAt: {
        gte: oneHourAgo,
      },
    },
  });

  if (voteCount >= MAX_VOTES_PER_HOUR) {
    return res
      .status(429)
      .json({ error: "Vote limit exceeded. Try again later." });
  }

  // Check if collectionId exists in the Collection table
  const nft = await prisma.nFT.findUnique({
    where: {
      id: nftId,
    },
  });

  if (!nft || nft?.collectionId === null) {
    return res.status(400).json({ error: "Invalid nft for collection vote" });
  }

  try {
    await prisma.vote.create({
      data: {
        status,
        weight,
        userId,
        collectionId: nft?.collectionId,
        nft: {
          connect: {
            id: nft.id,
          },
        },
      },
    });

    return res.status(200).json({
      status: "success",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

export default vote;
