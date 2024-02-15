import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { determineRank } from "../../../utils";
import { transferChecked } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { checkTxLEGEND } from "../../../utils/backend";

interface RankResult {
  rank: number | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method === "POST") {
    const { publicKey, associatedToken } = req.body;
    if (!publicKey || !associatedToken) {
      return res.status(400).json({ message: "Invalid request" });
    }
    const sourceAcc = new PublicKey(
      "7hiTK61423CjMoZRmK5s25wLgyeyxPHFRuCWdNdqry6c"
    ); // payment $LEGEND account

    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_NETWORK!,
      "confirmed"
    );

    try {
      const existingAccountInfo = await connection.getAccountInfo(
        new PublicKey(associatedToken)
      );
      if (!existingAccountInfo)
        res.status(400).json({ message: "No token account found" });
      const partnerPayment = await prisma.partnerScore.findFirst({
        where: { address: publicKey },
      });
      const legendPayment = await prisma.legendScore.findFirst({
        where: {
          data: {
            path: ["id"],
            equals: publicKey,
          },
        },
      });
      // NB return if payment claimed
      if (partnerPayment?.claimed || legendPayment?.claimed)
        res.status(200).json({ success: "true" });
      // Use parameterized query for safety
      const rank = await prisma.$queryRaw<RankResult[]>`
          SELECT COUNT(*) + 1 AS rank 
          FROM "legend_scores" 
          WHERE total > (
              SELECT total 
              FROM "legend_scores" 
              WHERE data->>'id' = ${publicKey}
          )`;

      if (!partnerPayment) {
        return res.status(404).json({ message: "Score not found" });
      }
      const rankPayment = determineRank(rank[0].rank || 0);
      const total = partnerPayment.total + rankPayment;
      // const total = 2;

      const keys = JSON.parse(process.env.NEXT_DROP!);
      const keysUint8Array = new Uint8Array(keys);
      const paymentWallet = Keypair.fromSecretKey(keysUint8Array);

      const decimals = 9;
      const signature = await transferChecked(
        connection,
        paymentWallet,
        sourceAcc,
        new PublicKey(process.env.NEXT_PUBLIC_LEGEND_TOKEN!), //
        new PublicKey(associatedToken),
        paymentWallet,
        total * LAMPORTS_PER_SOL,
        decimals,
        [],
        { skipPreflight: true }
      );
      //  Validate transaction
      const success = await checkTxLEGEND(signature);
      const totalBigInt = BigInt(total);
      const updatedLegend = BigInt(success.legend) + totalBigInt;      
      if (updatedLegend !== BigInt(0)) {
        res.status(400).json({ message: "Transaction failed" });
      }
      // console.log(partnerPayment.id, legendPayment?.id);

      if (partnerPayment.id) {
        await prisma.partnerScore.update({
          where: { id: partnerPayment.id },
          data: { claimed: true, signature },
        });
      }
      if (legendPayment?.id) {
        await prisma.legendScore.update({
          where: { id: legendPayment?.id },
          data: { claimed: true, signature },
        });
      }

      res.status(200).json({ signature });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: (error as Error).message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
