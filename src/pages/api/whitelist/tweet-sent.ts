import prisma from "../../../../lib/prisma";
import { NextApiHandler } from "next";
import { authOptions } from "../auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

const tweetSent: NextApiHandler = async (req: any, res) => {
  let handlesArray = req.body.handlesArray || [];
  handlesArray = handlesArray.map((handle: string) =>
    handle.replace("@", "")
  );

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  try {
    for (let i = 0; i < handlesArray.length; i++) {
      const handle = handlesArray[i];
      await prisma.user.update({
        where: {
          twitterHandle: session.user.twitterHandle as string,
        },
        data: {
          whitelisted: {
            update: {
              where: {
                whitelistedHandle_whitelistedByHandle: {
                  whitelistedHandle: handle,
                  whitelistedByHandle: session.user.twitterHandle as string,
                },
              },
              data: {
                tweetSent: true,
              },
            },
          },
        },
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error });
  }
};

export default tweetSent;
