import { NextApiHandler } from "next";
import { CollectionNameRequest, LeaderboardStatsRequest } from "@hellomoon/api";
import prisma from "../../../../lib/prisma";
import { getHelloMoon } from "../../../../lib/hellomoon";
import { filter } from "lodash";
import { serializedBigIntValues } from "../../../utils/backend";

const collection: NextApiHandler = async (req: any, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let { challenge } = req.body;
  if (challenge !== process.env.WL_ADMIN_PASS) {
    return res.status(400).json({ error: "Password is required" });
  }
  const client = getHelloMoon();
  try {
    const collections = await prisma.collection.findMany();
    const statsPromises = collections.map(async ({ name, collectionKey }) => {
      const moonCollection = await client.send(
        new CollectionNameRequest({
          collectionName: name,
        })
      );
      const helloMoonCollectionId =
        moonCollection?.data[0]?.helloMoonCollectionId;
      if (!helloMoonCollectionId) {
        return null;
      }
      // Perform the upsert operation as before, using the helloMoonCollectionId
      const moonData = await client.send(
        new LeaderboardStatsRequest({
          helloMoonCollectionId,
          limit: 1,
        })
      );
      const data = moonData.data[0];
      return prisma.helloMoonCollection.upsert({
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
              collectionKey,
            },
          },
        },
      });
    });

    const allStats = filter(await Promise.all(statsPromises), Boolean);

    return res.status(200).json({
      status: "success",
      nftCollectionStats: serializedBigIntValues(allStats),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

export default collection;
