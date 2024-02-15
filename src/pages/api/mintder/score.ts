import { NextApiHandler } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../../lib/prisma";

const score: NextApiHandler = async (req: any, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session?.user?.id) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  const userId = Number(session?.user?.id);
  try {
    const score = await prisma.vote.count({
      where: {
        userId: userId,
      },
    });

    res.json({ score });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
};

export default score;