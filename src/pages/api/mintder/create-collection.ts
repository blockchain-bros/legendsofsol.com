import { NextApiHandler } from "next";
import prisma from "../../../../lib/prisma";
import { getHeliusInstance } from "../../../../lib/helius";

const mintder: NextApiHandler = async (req: any, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { challenge, collectionKey } = req.body;
  if (challenge !== process.env.WL_ADMIN_PASS) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const collections = await Promise.all(
      collectionKey.map(async (id: string) => {
        const helius = getHeliusInstance();
        const collection = await helius.rpc.getAsset({
          id,
        });
        if (!collection || !collection.content) {
          return null;
        }
        const { metadata, files, links } = collection.content;
        if (!files || !files.length) {
          return null;
        }
        return await prisma.collection.upsert({
          where: { collectionKey: collection.id },
          update: {
            collectionKey: collection.id,
            img: files[0].uri,
            cdnImg: files[0].cdn_uri,
            mime: files[0].mime,
            description: metadata.description,
            name: metadata.name,
            symbol: metadata.symbol,
            url: links?.external_url,
          },
          create: {
            collectionKey: collection.id,
            img: files[0].uri ?? "",
            cdnImg: files[0].cdn_uri ?? "",
            mime: files[0].mime ?? "",
            description: metadata.description ?? "",
            name: metadata.name ?? "",
            symbol: metadata.symbol ?? "",
            url: links?.external_url,
          },
        });
      })
    );

    return res.status(200).json({
      status: "success",
      collections,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

export default mintder;
