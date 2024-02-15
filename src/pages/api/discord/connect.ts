import prisma from "../../../../lib/prisma";
import DiscordOauth2 from "discord-oauth2";
import { NextApiHandler } from "next";
import { authOptions } from "../auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

const oauth = new DiscordOauth2({
  clientId: process.env.DISCORD_ID!,
  clientSecret: process.env.DISCORD_SECRET!,
  redirectUri: process.env.NEXTAUTH_URL!,
});

const connect: NextApiHandler = async (req: any, res) => {
  const access_token = req?.body?.access_token || null;
  let expires_at = req?.body?.expires_in || null;

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  if (!access_token) {
    return res.status(401).send({ error: "No Discord Access" });
  }
  try {
    const user = await oauth.getUser(access_token);
    await prisma.user.update({
      where: {
        id: Number(session?.user?.id),
      },
      data: {
        email: user.email,
        accounts: {
          upsert: {
            where: {
              provider_providerAccountId: {
                provider: "discord",
                providerAccountId: user.id,
              },
            },
            create: {
              type: "oauth",
              provider: "discord",
              providerAccountId: user.id,
              scope: "identify email",
              token_type: "bearer",
              expires_at,
              access_token,
            },
            update: {
              expires_at,
              access_token,
            },
          },
        },
      },
    });
    const discordAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "discord",
          providerAccountId: user.id,
        },
      },
    });
    return res.status(200).json({
      userDiscord: discordAccount,
    });
  } catch (error) {
    return res.status(500).send({ error });
  }
};

export default connect;
