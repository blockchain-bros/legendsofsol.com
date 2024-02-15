import prisma from "../../../../lib/prisma";
import DiscordOauth2 from "discord-oauth2";
import { NextApiHandler } from "next";
import { authOptions } from "../auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { keyBy, merge, values } from "lodash";

const oauth = new DiscordOauth2({
  clientId: process.env.DISCORD_ID!,
  clientSecret: process.env.DISCORD_SECRET!,
  redirectUri: process.env.NEXTAUTH_URL!,
});

const validate: NextApiHandler = async (req: any, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(session?.user?.id),
      },
      include: {
        accounts: {
          where: {
            provider: "discord",
          },
        },
        whitelisted: true,
        whitelistedBy: true,
      },
    });
    const whitelistedHandles = user?.whitelisted.map(
      (whitelisted) => whitelisted.whitelistedHandle
    );
    const whitelisted = await prisma.user.findMany({
      where: {
        twitterHandle: { in: whitelistedHandles },
      },
      select: {
        twitterHandle: true,
        image: true,
      },
    });
    const mergedWLImage = merge(
      keyBy(user?.whitelisted, "whitelistedHandle"),
      keyBy(
        whitelisted.map((u) => ({
          whitelistedHandle: u.twitterHandle,
          image: u.image,
        })),
        "whitelistedHandle"
      )
    );
    const updatedWL = values(mergedWLImage);
    if (user) user.whitelisted = updatedWL;
    let discord;
    if (user?.accounts[0]?.access_token) {
      discord = await oauth.getUser(user?.accounts[0]?.access_token as string);
    }
    const userAccDiscord = user?.accounts[0];
    delete user?.accounts[0];
    return res.status(200).json({
      user: {
        ...user,
        discord: { ...userAccDiscord, data: discord },
        location: undefined,
      },
    });
  } catch (error) {
    return res.status(500).send({ error });
  }
};

export default validate;
