import { NextApiHandler } from "next";
import prisma from "../../../../lib/prisma";
import { serializedBigIntValues } from "../../../utils/backend";

const getCollections: NextApiHandler = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const nfts = await prisma.nFT.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        id: "desc",
      },
      where: {
        Collection: {
          isNot: null,
        },
      },
      select: {
        id: true,
        nftAddress: true,
        name: true,
        description: true,
        symbol: true,
        img: true,
        cdnImg: true,
        collectionKey: true,
        collectionId: true,
        Collection: {
          select: {
            name: true,
            url: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      nfts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

export default getCollections;
