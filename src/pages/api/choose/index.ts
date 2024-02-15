import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { sanitizeStringForDb } from "../../../utils/backend";

interface RankResult {
  rank: number | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method === "POST") {
    const { handle, walletAddress } = req.body;
    if (!handle && !walletAddress) {
      return res.status(400).json({ message: "Invalid request" });
    }

    try {
      let score = null;
      let partnerScore = null;
      let rank: RankResult[] = [];

      if (handle) {
        score = await prisma.legendScore.findUnique({
          where: { twitterHandle: handle },
        });
        // Use parameterized query for safety
        rank = await prisma.$queryRaw<RankResult[]>`
          SELECT COUNT(*) + 1 AS rank 
          FROM "legend_scores" 
          WHERE total > (
            SELECT total 
            FROM "legend_scores" 
            WHERE "twitterHandle" = ${handle}
          )`;
      } else if (walletAddress) {
        score = await prisma.legendScore.findFirst({
          where: {
            data: {
              path: ["id"],
              equals: walletAddress,
            },
          },
        });
        partnerScore = await prisma.partnerScore.findFirst({
          where: { address: walletAddress },
        });
        // Use parameterized query for safety
        rank = await prisma.$queryRaw<RankResult[]>`
          SELECT COUNT(*) + 1 AS rank 
          FROM "legend_scores" 
          WHERE total > (
              SELECT total 
              FROM "legend_scores" 
              WHERE data->>'id' = ${walletAddress}
          )`;
      }

      if (!score && !partnerScore) {
        return res.status(404).json({ message: "Score not found" });
      }
      if (!score) {
        rank = [];
      }

      res.status(200).json(
        JSON.parse(
          JSON.stringify(
            {
              score: score?.total || 0,
              partnerDrop: partnerScore?.total || 0,
              rank: rank[0]?.rank || 0,
              claimed: partnerScore?.claimed || score?.claimed,
            },
            (key, value) =>
              typeof value === "bigint" ? value.toString() : value
          )
        )
      );
    } catch (error) {
      console.error("Failed to fetch score and rank:", error);
      res.status(500).json({ message: "Failed to fetch score and rank" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
