import prisma from "../../../../lib/prisma";
import { NextApiHandler } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const connect: NextApiHandler = async (req: any, res) => {
  const publicKey = req?.body?.publicKey || null;
  const session = await getServerSession(req, res, authOptions).catch((err) => null);
  if (!session) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  if (!publicKey.length) {
    return res.status(401).send({ error: "Wallet is not connected" });
  }

  try {
    await prisma.account.deleteMany({
      where: {
        provider: "solana",
        userId: Number(session?.user?.id),
      },
    });
    await prisma.user.update({
      where: {
        id: Number(session?.user?.id),
      },
      data: {
        accounts: {
          create: {
            type: "crypto",
            provider: "solana",
            providerAccountId: publicKey,
            token_type: "publicKey",
          },
        },
      },
    });
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return res.status(500).send({ error });
  }
};

export default connect;
