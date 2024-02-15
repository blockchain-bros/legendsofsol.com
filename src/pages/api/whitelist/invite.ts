import prisma from "../../../../lib/prisma";
import { NextApiHandler } from "next";
import { authOptions } from "../auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { MaxWL, WLStatus } from "../../../types/whiteList";
import { twitterHandleRegex } from "../../../utils";
import { createNewXFetch } from "../../../utils/backend";

const invite: NextApiHandler = async (req: any, res) => {
  let handlesArray = req.body.handlesArray || [];
  handlesArray = handlesArray
    .map((handle: string) => handle.trim().toLowerCase())
    .filter((trimmed: string) => twitterHandleRegex.test(trimmed));
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  try {
    // check user is whitelist verified
    const isWhitelistVerified = await prisma.whitelist.findMany({
      where: {
        whitelistedUser: {
          twitterHandle: session.user.twitterHandle as string,
        },
        status: WLStatus.verified,
      },
      select: {
        status: true,
      },
    });
    if (isWhitelistVerified[0].status !== WLStatus.verified)
      return res.status(401).send({ message: "Unauthorized" });
    // check how many invites user has sent
    const invitesSent = await prisma.whitelist.findMany({
      where: {
        whitelistedByHandle: session.user.twitterHandle as string,
      },
    });
    // Remaining invites
    const validInvitesLeft = MaxWL.default - invitesSent.length;
    // check if users in handlesArray already exist
    const existingUsers = await prisma.whitelist.findMany({
      where: {
        whitelistedHandle: {
          in: handlesArray,
        },
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
    // filter out existing users
    const nonExistingUsers = existingUsers.length
      ? handlesArray.filter(
          (handle: string) =>
            !existingUsers.find((user) => user.whitelistedHandle === handle)
        )
      : handlesArray;
    // cut array down to n remaining invites
    const nonExistingUsersToInvite = nonExistingUsers.slice(
      0,
      validInvitesLeft
    );
    // create users if the array is not empty
    if (nonExistingUsersToInvite.length > 0) {
      // crucial to use await here as the db will error if 2 idenitcal requests are sent at once
      for (let i = 0; i < nonExistingUsersToInvite.length; i++) {
        const handle = nonExistingUsersToInvite[i];
        await prisma.whitelist.deleteMany({
          where: {
            whitelistedHandle: handle,
          },
        });
        const userAcc = await prisma.user.upsert({
          where: {
            twitterHandle: handle,
          },
          create: {
            twitterHandle: handle,
            whitelistedBy: {
              connectOrCreate: {
                where: {
                  whitelistedHandle_whitelistedByHandle: {
                    whitelistedHandle: handle,
                    whitelistedByHandle: session.user.twitterHandle as string,
                  },
                },
                create: {
                  status: WLStatus.invited,
                  whitelistedByHandle: session.user.twitterHandle as string,
                },
              },
            },
          },
          update: {
            whitelistedBy: {
              connectOrCreate: {
                where: {
                  whitelistedHandle_whitelistedByHandle: {
                    whitelistedHandle: handle,
                    whitelistedByHandle: session.user.twitterHandle as string,
                  },
                },
                create: {
                  status: WLStatus.invited,
                  whitelistedByHandle: session.user.twitterHandle as string,
                },
              },
            },
          },
          include: {
            accounts: true,
          },
        });
        const hasTwitterAcc =
          userAcc.accounts.filter((acc) => acc.provider === "twitter").length >
          0;
        if (!hasTwitterAcc) {
          const twitterUser: any = await createNewXFetch(handle);
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: "twitter",
                providerAccountId: twitterUser?.id ?? "",
              },
            },
            update: {},
            create: {
              provider: "twitter",
              providerAccountId: twitterUser?.id ?? "",
              userId: userAcc.id,
              type: "oauth",
            },
          });
        }
      }
    }

    // Recalculate invitesSent and validInvitesLeft
    const updatedInvitesSent = await prisma.whitelist.findMany({
      where: {
        whitelistedByHandle: session.user.twitterHandle as string,
      },
    });
    const newValidInvitesLeft = MaxWL.default - updatedInvitesSent.length;

    res.json({
      status: WLStatus.verified,
      usersCreated: nonExistingUsersToInvite
        ? nonExistingUsersToInvite.map((user: string) => ({
            handle: user,
            invitedBy: session.user.twitterHandle as string,
            status: WLStatus.invited,
            tweetSent: false,
            image: null,
          }))
        : [],
      invitesUsed: updatedInvitesSent.length,
      invitesLeft: newValidInvitesLeft,
      existingUsers: existingUsers
        ? existingUsers.map((user) => ({
            handle: user.whitelistedHandle,
            invitedBy: user.whitelistedByHandle,
            status: user.status,
            tweetSent: user.tweetSent,
            image: user.whitelistedUser?.image,
          }))
        : [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error });
  }
};

export default invite;
