import { NextApiHandler } from "next";
import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "../../../utils/prismaAdapter";
import TwitterProvider from "next-auth/providers/twitter";
import prisma from "../../../../lib/prisma";
import { WLStatus } from "../../../types/whiteList";

declare module "next-auth" {
  interface Session {
    user: {
      id: string | undefined;
      image: string | undefined;
      name: string | undefined;
      twitterHandle: string | undefined;
      valid: boolean;
      whitelisted: boolean | undefined;
    };
  }
  interface DefaultUser {
    twitterHandle: string | undefined;
    location: any;
  }

  interface Profile {
    data: {
      id: string;
      name: string;
      username: string;
      profile_image_url: string;
    };
  }
}

const authHandler: NextApiHandler = (req, res) =>
  NextAuth(req, res, authOptions);
export default authHandler;

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.X_ID!,
      clientSecret: process.env.X_SECRET!,
      version: "2.0",
      profile({ data }) {
        return {
          id: String(data.id),
          name: data.name,
          // email not returned by Twitter 2.0 API - discord picks it up
          twitterHandle: data.username.toLowerCase(),
          image: data.profile_image_url,
          location: data.location,
        };
      },
    }),
  ],
  session: {
    maxAge: 30 * 24 * 60 * 30, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async signIn({ profile }) {
      try {
        await prisma.user.upsert({
          where: { twitterHandle: profile?.data.username },
          update: {
            image: profile?.data.profile_image_url,
          },
          create: {
            image: profile?.data.profile_image_url,
            name: profile?.data.name,
            twitterHandle: profile?.data.username.toLowerCase(),
          },
        });
        return true;
      } catch (error) {
        console.log("error", error);
      }
      return true;
    },
    async session({ session, user }) {
      const hasUser = await prisma.whitelist.findMany({
        where: {
          whitelistedUser: {
            twitterHandle: user.twitterHandle,
          },
        },
      });
      // update user status to whitelisted and whitelist user
      if (hasUser.filter((u) => u.status === WLStatus.invited).length > 0) {
        session.user.whitelisted = true;
        await prisma.user.upsert({
          where: {
            twitterHandle: user.twitterHandle,
          },
          create: {},
          update: {
            whitelistedBy: {
              update: {
                where: {
                  whitelistedHandle_whitelistedByHandle: {
                    whitelistedHandle:
                      user.twitterHandle?.toLowerCase() as string,
                    whitelistedByHandle:
                      hasUser[0].whitelistedByHandle.toLowerCase(),
                  },
                },
                data: {
                  status: WLStatus.verified,
                },
              },
            },
          },
        });
      }
      // whitelist user if they have been invited
      if (hasUser.filter((u) => u.status === WLStatus.verified).length > 0) {
        session.user.whitelisted = true;
      }
      if (session && user) {
        session.user.twitterHandle = user.twitterHandle?.toLowerCase();
        session.user.id = String(user.id);
        session.user.valid = !!user?.location;
      }
      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  secret: process.env.ENV_SECRET,
};
