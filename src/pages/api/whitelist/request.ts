import { NextApiHandler } from "next";
import { authOptions } from "../auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import prisma from "../../../../lib/prisma";
import { WLStatus } from "../../../types/whiteList";
import { twitterHandleRegex } from "../../../utils";
import { createNewXFetch } from "../../../utils/backend";

const requestWhitelist: NextApiHandler = async (req: any, res) => {
  let { handle, type, challenge } = req.body;
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  if (!session?.user?.twitterHandle) {
    return res
      .status(401)
      .send({ message: "Your Twitter user handle is undefined" });
  }
  handle = handle.trim().toLowerCase();
  if (!twitterHandleRegex.test(handle)) {
    return res.status(400).send({ message: "Invalid handle" });
  }
  if (type === "add-user") {    
    try {
      // Create user if not exists
      const userAcc = await prisma.user.upsert({
        where: { twitterHandle: handle },
        update: {
          twitterHandle: handle,
        },
        create: {
          twitterHandle: handle,
        },
        include: {
          accounts: true,
        },
      });
      // Create twitter account if not exists
      const hasTwitterAcc =
        userAcc.accounts.filter((acc) => acc.provider === "twitter").length > 0;
      if (!hasTwitterAcc) {
        const twitterUser: any = await createNewXFetch(handle);
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: "twitter",
              providerAccountId: twitterUser.id,
            },
          },
          update: {},
          create: {
            provider: "twitter",
            providerAccountId: twitterUser.id,
            userId: userAcc.id,
            type: "oauth",
          },
        });
      }
      // Invite user to whitelist by admin
      if (challenge === process.env.WL_ADMIN_PASS) {
        await prisma.whitelist.deleteMany({
          where: {
            whitelistedHandle: handle,
          },
        });
        const result = await prisma.whitelist.create({
          data: {
            status: WLStatus.invited,
            // use non-twitter handle chars for admin
            whitelistedByHandle: session?.user?.twitterHandle,
            whitelistedHandle: handle,
          },
        });        
        return res.json({ ...result });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send({ error });
    }
  }
  if (type === "delete-user") {
    try {
      if (challenge === process.env.WL_ADMIN_PASS) {
        const deleted = await prisma.whitelist.deleteMany({
          where: {
            whitelistedHandle: handle,
          },
        });
        return res.json({ status: "success", deleted });
      } else {
        return res.status(401).send({ message: "Unauthorized" });
      }
    } catch (error) {
      return res.status(500).send({ error });
    }
  }
  if (!type && !challenge) {
    try {
      // Request whitelist place if twitter connected and no whitelist status
      if (session) {
        const hasUser = await prisma.whitelist.findMany({
          where: {
            whitelistedUser: {
              twitterHandle: session?.user?.twitterHandle,
            },
          },
        });
        if (hasUser?.length > 0) {
          return res.json({ status: "success", tokens: hasUser });
        }
        const result = await prisma.whitelist.create({
          data: {
            status: WLStatus.waitlisted,
            // use non-twitter handle chars for self
            whitelistedByHandle: "//self",
            whitelistedHandle: session?.user?.twitterHandle as string,
          },
        });
        return res.json({ status: "success", tokens: [result] });
      }
    } catch (error) {
      return res.status(500).send({ error });
    }
  }
  return res.status(500).send({ message: "Something went wrong" });
};

export default requestWhitelist;
