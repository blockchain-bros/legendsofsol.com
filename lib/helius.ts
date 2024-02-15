// lib/helius.ts
import { Helius } from "helius-sdk";
import { getCluster } from "../src/utils/backend";

let helius: Helius;

export function getHeliusInstance(): Helius {
  if (!helius) {
    helius = new Helius(process.env.NEXT_HELIUS_RPC_KEY!, getCluster());
  }
  return helius;
}
