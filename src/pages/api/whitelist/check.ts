import prisma from "../../../../lib/prisma";
import { NextApiHandler } from "next";
import { authOptions } from "../auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { MaxWL, WLStatus } from "../../../types/whiteList";

const check: NextApiHandler = async (req: any, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  try {
    // check how many invites user has sent
    const invitesSent = await prisma.whitelist.findMany({
      where: {
        whitelistedByHandle: session.user.twitterHandle as string,
      },
    });
    // Remaining invites
    const validInvitesLeft = MaxWL.default - invitesSent.length;
    // check user airdrop/whitelist status
    const userStatus = await prisma.whitelist.findFirst({
      where: {
        whitelistedHandle: session.user.twitterHandle as string,
      },
    });
    // check if users in handlesArray already exist
    const existingUsers = await prisma.whitelist.findMany({
      where: {
        whitelistedByHandle: session.user.twitterHandle as string,
        AND: {
          status: {
            in: [WLStatus.invited, WLStatus.verified],
          },
        },
      },
      include: {
        whitelistedUser: true,
      },
    });
    const whitelistSpots = () => {
      let wlSpot = 0;
      if (session.user.whitelisted) wlSpot += 1;
      if (
        existingUsers.filter((u) => u.status === WLStatus.verified).length > 1
      )
        wlSpot += 1;
      return wlSpot;
    };
    res.json({
      status: userStatus?.status,
      invitedBy: userStatus?.whitelistedByHandle,
      invitesUsed: invitesSent.length,
      invitesLeft: validInvitesLeft,
      invitesConfirmed: existingUsers.filter(
        (u) => u.status === WLStatus.verified
      ).length,
      whitelistSpots: whitelistSpots(),
      existingUsers: existingUsers
        ? existingUsers.map((user) => ({
            handle: user.whitelistedHandle,
            invitedBy: user.whitelistedByHandle,
            status: user.status,
            image: user.whitelistedUser?.image,
            tweetSent: user.tweetSent,
          }))
        : [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error });
  }
};

export default check;
