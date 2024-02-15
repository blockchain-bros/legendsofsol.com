import DiscordOauth2 from "discord-oauth2";
import { NextApiHandler } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const oauth = new DiscordOauth2({
  clientId: process.env.DISCORD_ID!,
  clientSecret: process.env.DISCORD_SECRET!,
  redirectUri: process.env.NEXTAUTH_URL!,
});

const auth: NextApiHandler = async (req: any, res) => {
  const session = await getServerSession(req, res, authOptions);
  const state = Math.random().toString(36).slice(2);
  if (!session) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  try {
    const url = oauth.generateAuthUrl({
      scope: ["identify", "email"],
      state,
      responseType: "token",
    });
    return res.status(200).json({
      url,
      state,
    });
  } catch (error) {
    return res.status(500).send({ error });
  }
};

export default auth;
