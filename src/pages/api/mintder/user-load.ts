import { NextApiHandler } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../../lib/prisma";
import { getHeliusInstance } from "../../../../lib/helius";

const mintder: NextApiHandler = async (req: any, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session?.user?.id) {
    return res.status(401).send({ error: "Unauthorized" });
  }

  const helius = getHeliusInstance();
  let nfts;
  try {
    const userId = await prisma.user.findUnique({
      where: {
        id: Number(session?.user?.id),
      },
      select: {
        id: true,
      },
    });
    if (!userId) {
      return res.status(401).send({ error: "Unauthorized" });
    }
    const account = await prisma.account.findFirst({
      where: {
        userId: userId?.id,
        type: "crypto",
      },
      select: {
        providerAccountId: true,
      },
    });
    const pubKey = account?.providerAccountId;
    if (!pubKey) {
      return res.status(200).json({
        status: "no load required",
      });
    }
    nfts = await helius.rpc.getAssetsByOwner({
      ownerAddress: pubKey,
      page: 1,
      limit: 1000,
    });
    if (!nfts?.items.length) {
      return res.status(200).json({
        status: "no load required",
      });
    }
    await Promise.all(
      nfts.items.map(async (nft) => {
        const metadata = nft.content?.metadata;
        const files = nft.content?.files;
        if (!files || !files.length || !metadata || !nft.grouping?.length) {
          return null;
        }
        const collectionKey = nft?.grouping[0]?.group_value ?? "";
        const collection = await prisma.collection.findUnique({
          where: { collectionKey },
          select: { id: true },
        });
        const existingNFT = await prisma.nFT.findFirst({
          where: { nftAddress: nft.id },
        });

        if (existingNFT) {
          // Update existing record
          return await prisma.nFT.update({
            where: { id: existingNFT.id },
            data: {
              cdnImg: files[0].cdn_uri,
              collectionKey,
              description: metadata.description,
              img: files[0].uri,
              metadata: nft as any,
              mime: files[0].mime,
              name: metadata.name,
              symbol: metadata.symbol,
              collectionId: collection?.id,
            },
          });
        } else {
          return await prisma.nFT.create({
            data: {
              cdnImg: files[0].cdn_uri,
              collectionKey,
              description: metadata.description,
              img: files[0].uri ?? "",
              metadata: nft as any,
              mime: files[0].mime,
              name: metadata.name,
              nftAddress: nft.id,
              symbol: metadata.symbol,
              userId: userId?.id,
              collectionId: collection?.id,
            },
          });
        }
      })
    );

    return res.status(200).json({
      status: "success",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

export default mintder;
