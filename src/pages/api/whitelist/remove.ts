// src/pages/api/whitelist/remove.ts
import { NextApiHandler } from "next";
import prisma from "../../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { WLStatus } from "../../../types/whiteList";

const removeWhitelist: NextApiHandler = async (req: any, res) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Get the user session
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.twitterHandle) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const { handle } = req.body;
  if (!handle) {
    return res.status(400).json({ message: "Missing handle" });
  }

  try {
    // Check if the user is the one who whitelisted this user
    const whitelistEntry = await prisma.whitelist.findFirst({
      where: {
        whitelistedHandle: handle,
        whitelistedByHandle: session.user.twitterHandle,
        status: WLStatus.invited,
      },
    });

    if (!whitelistEntry) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const deleted = await prisma.whitelist.deleteMany({
      where: {
        whitelistedHandle: handle,
        whitelistedByHandle: session.user.twitterHandle,
      },
    });
    return res.json({ status: "success", deleted });
  } catch (error) {
    return res.status(500).send({ error });
  }
};

export default removeWhitelist;
