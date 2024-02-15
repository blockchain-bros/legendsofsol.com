import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  useTheme,
  Grid,
  Divider,
  Dialog,
  CircularProgress,
} from "@mui/material";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { determineRank } from "../../utils";
import { truncatePublicKey } from "../../utils/solana";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useSnackbar } from "../../contexts/SnackbarProvider";

const LegendScoreChecker: React.FC<{
  setValue: Dispatch<SetStateAction<number>>;
}> = ({ setValue }) => {
  const [dropAmount, setDropAmount] = useState<string | null>(null);
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const theme = useTheme();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  const { connection } = useConnection();

  const fetchLegendScore = async () => {
    if (!connected) return;
    try {
      const response = await fetch("/api/choose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: publicKey }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      if (data.claimed) {
        setHasClaimed(data.claimed);
        return;
      }

      const finalAmount = Number(data.partnerDrop + determineRank(data.rank));
      const airdrop = finalAmount
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      setDropAmount(airdrop);
    } catch (error) {
      console.error("Failed to fetch legend score:", error);
    }
  };

  const createLegendAccount = async () => {
    if (!publicKey) return;
    const TOKEN = process.env.NEXT_PUBLIC_LEGEND_TOKEN!;
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash({ commitment: "finalized" });

    const transaction = new Transaction({
      feePayer: publicKey,
      blockhash,
      lastValidBlockHeight,
    });
    const mint = new PublicKey(TOKEN);
    try {
      const associatedToken = await getAssociatedTokenAddress(mint, publicKey);
      const existingAccountInfo = await connection.getAccountInfo(
        associatedToken
      );
      if (existingAccountInfo === null) {
        const createInstruction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            associatedToken,
            publicKey,
            mint
          )
        );
        transaction.add(createInstruction);
      }
      // Serialize the transaction and convert to base64 to return it
      await sendTransaction(transaction, connection);
      setIsClaiming(true);

      const claim = await fetch("/api/choose/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicKey,
          associatedToken: associatedToken.toBase58(),
        }),
      });
      if (claim.ok) {
        setHasClaimed(true);
      }
    } catch (error) {
      enqueueSnackbar((error as Error).message);
      setHasClaimed(false);
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    if (!connected) setDropAmount(null);
    fetchLegendScore();
  }, [connected]);

  return (
    <Grid container>
      <Grid
        item
        xs={12}
        container
        justifyContent="center"
        alignItems="center"
        sx={{ minHeight: 150 }}
      >
        {hasClaimed && (
          <Box mb={2} sx={{ textAlign: "center" }}>
            <Typography
              variant="h6"
              sx={{ color: theme.palette.success.main, fontSize: 16, mb: 1 }}
            >
              You&apos;ve claimed your $LEGEND airdrop
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{ mb: 3, lineHeight: 2 }}
            >
              Now you can make &quot;The Choice&quot; with your $LEGEND and
              cement your status as a Legend of SOL
            </Typography>
            <Box mb={1}>
              <Button
                variant="contained"
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I've made #TheChoice and now get VIP access to the bear market enjooooying LegendsOfSOL.com💥🐐
    
`)}&hashtags=LegendsOfSOL&via=Legends_of_SOL&cashtags=LEGEND`,
                    "_blank",
                    "noreferrer"
                  );
                }}
                sx={{
                  width: "100%",
                }}
              >
                Boost The Choice
              </Button>
            </Box>
            <Box mb={1}>
              <Button
                variant="contained"
                onClick={() => setValue(1)}
                sx={{
                  width: "100%",
                  backgroundColor: theme.palette.secondary.main,
                }}
              >
                Make The Choice
              </Button>
            </Box>
          </Box>
        )}
        {!dropAmount && connected && !hasClaimed ? (
          <Grid
            item
            sx={{
              minHeight: "15em",
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              align="center"
              sx={{
                color: theme.palette.error.main,
                mb: 2,
              }}
            >
              {publicKey ? truncatePublicKey(publicKey.toBase58(), 10) : ""}
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{ mb: 3, lineHeight: 2 }}
            >
              No airdrop found. You can still make The Choice if you&apos;ve
              bought some $LEGEND tokens
            </Typography>
            <Button
              variant="contained"
              onClick={() => setValue(1)} // Assuming this opens The Choice tab
              sx={{
                backgroundColor: theme.palette.secondary.main,
              }}
            >
              Make The Choice
            </Button>
          </Grid>
        ) : !dropAmount && !hasClaimed ? (
          <Grid
            item
            sx={{
              minHeight: "15em",
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <Grid item mb={2}>
              <Typography
                variant="h6"
                align="center"
                sx={{
                  color: (theme) => theme.palette.secondary.main,
                  textTransform: "uppercase",
                  backgroundColor: theme.palette.background.default,
                  fontSize: 14,
                }}
              >
                Connect wallet to claim airdrop
              </Typography>
            </Grid>
            <Divider sx={{ mt: 0, mb: 3 }} />
            <Grid item>
              <Box
                display={"flex"}
                justifyContent={"center"}
                alignContent={"center"}
                mb={2}
              >
                <Image
                  src="/images/logo-64.svg"
                  alt="Legends of SOL"
                  priority
                  width={300}
                  height={300}
                />
              </Box>
              <Divider sx={{ mt: 3, mb: 2 }} />
              <Typography variant="body1" align="center" sx={{ lineHeight: 2 }}>
                Get ready to make The Choice!!! You are about to receive $LEGEND
                tokens for being a true Solana Bear Market enjoyoooor, surviving
                FTX, and seeing off the FUD... Well done 🐐 JOIN US
              </Typography>
            </Grid>
          </Grid>
        ) : (
          !hasClaimed &&
          dropAmount && (
            <Grid item xs={12} sx={{ mt: 2, px: 2 }}>
              <Typography
                variant="h5"
                align="center"
                sx={{ fontSize: 14, lineHeight: 2 }}
              >
                Boom! You&apos;ve scored some $LEGEND airdrop:
              </Typography>
              <Box
                my={4}
                py={4}
                sx={{ border: `4px solid ${theme.palette.divider}` }}
              >
                <Typography
                  variant="h2"
                  align="center"
                  sx={{ color: theme.palette.divider }}
                >
                  {dropAmount} $LEGEND
                </Typography>
              </Box>
              {/* <Box mb={1}>
                <Button
                  variant="contained"
                  onClick={() => createLegendAccount()}
                  sx={{
                    width: "100%",
                    backgroundColor: theme.palette.success.main,
                  }}
                >
                  Claim your $LEGEND
                </Button>
              </Box> */}
              {dropAmount && (
                <Box mb={1}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Boom! I'm about to be dropped ${dropAmount} $LEGEND on LegendsOfSOL.com for being a Legend💥🐐
    
`)}&hashtags=LegendsOfSOL&via=Legends_of_SOL&cashtags=LEGEND`,
                        "_blank",
                        "noreferrer"
                      );
                    }}
                    sx={{
                      width: "100%",
                    }}
                  >
                    Flex your airdrop
                  </Button>
                </Box>
              )}
              {!dropAmount && (
                <>
                  <Box mb={2}>
                    <Typography
                      variant="body1"
                      align="center"
                      sx={{ color: theme.palette.error.main }}
                    >
                      No allocation found for this wallet address{" "}
                      {publicKey?.toBase58() || "<wallet>"}
                    </Typography>
                  </Box>
                  <Box mb={1}>
                    <Button
                      variant="contained"
                      onClick={() => setValue(1)}
                      sx={{
                        width: "100%",
                        backgroundColor: theme.palette.secondary.main,
                      }}
                    >
                      Make The Choice
                    </Button>
                  </Box>
                </>
              )}
            </Grid>
          )
        )}
        <Dialog open={isClaiming} onClose={() => setIsClaiming(false)}>
          <Box
            p={2}
            display="flex"
            alignItems="center"
            sx={{ border: `4px solid ${theme.palette.divider}` }}
          >
            <CircularProgress size={24} style={{ marginRight: 8 }} />
            <Typography variant="body2">
              Claiming your $LEGEND airdrop...
            </Typography>
          </Box>
        </Dialog>
      </Grid>
    </Grid>
  );
};

export default LegendScoreChecker;
