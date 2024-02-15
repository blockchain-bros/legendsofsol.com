import { NextApiHandler } from "next";
import { CollectionNameRequest, LeaderboardStatsRequest } from "@hellomoon/api";
import prisma from "../../../../lib/prisma";
import { getHelloMoon } from "../../../../lib/hellomoon";
import { serializedBigIntValues } from "../../../utils/backend";

const collection: NextApiHandler = async (req: any, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let { challenge, collectionId, helloMoonCollectionId } = req.body;
  if (challenge !== process.env.WL_ADMIN_PASS) {
    return res.status(400).json({ error: "Password is required" });
  }
  const client = getHelloMoon();
  try {
    if (!helloMoonCollectionId) {
      const collection = await prisma.collection.findUnique({
        where: { collectionKey: collectionId },
      });
      if (!collection) {
        return res.status(400).json({ error: "Invalid collectionId" });
      }
      const moonCollection = await client.send(
        new CollectionNameRequest({
          collectionName: collection?.name,
        })
      );
      helloMoonCollectionId = moonCollection.data[0].helloMoonCollectionId;
      if (!helloMoonCollectionId) {
        return res.status(400).json({ error: "Invalid collectionId" });
      }
    }

    const moonData = await client.send(
      new LeaderboardStatsRequest({
        helloMoonCollectionId,
        limit: 1,
      })
    );
    const data = moonData.data[0];
    const nftCollectionStats = await prisma.helloMoonCollection.upsert({
      where: { helloMoonCollectionId },
      update: {
        helloMoonCollectionId,
        collectionName: data.collectionName,
        floorPrice: data.floorPrice,
        volume: data.volume,
        averageWashScore: data.average_wash_score,
        slug: data.slug,
        supply: data.supply,
        currentOwnerCount: data.current_owner_count,
        ownersAvgUsdcHoldings: data.owners_avg_usdc_holdings,
        avgPriceSol: data.avg_price_now_1_week,
      },
      create: {
        helloMoonCollectionId,
        collectionName: data.collectionName,
        floorPrice: data.floorPrice,
        volume: data.volume,
        averageWashScore: data.average_wash_score,
        slug: data.slug,
        supply: data.supply,
        currentOwnerCount: data.current_owner_count,
        ownersAvgUsdcHoldings: data.owners_avg_usdc_holdings,
        avgPriceSol: data.avg_price_now_1_week,
        collection: {
          connect: {
            collectionKey: collectionId,
          },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      nftCollectionStats: serializedBigIntValues(nftCollectionStats),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

export default collection;
