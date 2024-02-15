import prisma from "../../../lib/prisma";
import { NextApiHandler } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const invite: NextApiHandler = async (req: any, res) => {
  const { location } = req.body;
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  try {
    const userRecord = await prisma.user.findUnique({
      where: {
        twitterHandle: session.user.twitterHandle as string,
      },
    });
    if (userRecord && !userRecord?.location) {
      await prisma.user.update({
        where: {
          twitterHandle: session.user.twitterHandle as string,
        },
        data: {
          location,
        },
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error });
  }
};

export default invite;
