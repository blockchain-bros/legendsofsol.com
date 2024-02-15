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
    const collections = await prisma.collection.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        helloMoonCollection: true,
      },
    });

    const formattedCollections = collections.map((collection) => ({
      ...collection,
      helloMoonCollection: serializedBigIntValues(
        collection.helloMoonCollection
      ),
    }));

    return res.status(200).json({
      status: "success",
      collections: formattedCollections,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

export default getCollections;
