import prisma from "../../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { NextApiHandler } from "next";

const clear: NextApiHandler = async (req: any, res) => {
  const providerAccountId = req?.body?.providerAccountId || null;
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  try {
    await prisma.user.update({
      where: {
        id: Number(session?.user?.id),
      },
      data: {
        accounts: {
          update: {
            where: {
              provider_providerAccountId: {
                provider: "discord",
                providerAccountId,
              },
            },
            data: {
              access_token: null,
              expires_at: null,
            },
          }
        },
      },
    });
    return res.status(200).json({
      status: "OK",
    });
  } catch (error) {
    return res.status(500).send({ error });
  }
};

export default clear;
