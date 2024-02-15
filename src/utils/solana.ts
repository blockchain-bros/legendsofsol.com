export const getCluster = () => {
  if (process.env.NEXT_PUBLIC_SOLANA_NETWORK!.includes("devnet")) {
    return "devnet";
  } else {
    return "mainnet-beta";
  }
};

export const truncatePublicKey = (publicKey: string, sliceLength: number = 4) => {
  return publicKey.slice(0, sliceLength) + '...' + publicKey.slice(-sliceLength);
};