import prisma from "../../../../lib/prisma";
import { NextApiHandler } from "next";
import { getSession } from "next-auth/react";

const verifyUser: NextApiHandler = async (req: any, res) => {
  const token = await getSession({req});
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  try {
    const hasUser = await prisma.whitelist.findMany({
      where: {
        whitelistedUser: {
          twitterHandle: token?.user?.twitterHandle,
        },
      },
    });
    if (hasUser?.length > 0) {
      return res.json({ status: "hasWhitelist" });
    }
    return res.json({ status: "noWhitelist" });
  } catch (error) {
    // return error;
    return res.status(500).send({ error });
  }
};

export default verifyUser;
