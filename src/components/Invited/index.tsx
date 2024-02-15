import Image from "next/image";
import React, { FC, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  useTheme,
  Grid,
  styled,
} from "@mui/material";
import { signIn, useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import dayjs from "dayjs";
import { DiscordTokens, splitURLString } from "../../utils";
import { useRecoilValue } from "recoil";
import { pageLoadingState, whitelistUserState } from "../../state";
import { useSnackbar } from "../../contexts/SnackbarProvider";
import { PageLoading } from "../Loading";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-material-ui")).WalletMultiButton,
  { ssr: false }
);

interface InvitedProps {
  handle: string | string[] | undefined;
  invitedBy: string | string[] | undefined;
  discordVerified: boolean;
  setDiscordVerified: React.Dispatch<React.SetStateAction<boolean>>;
}

const ConnectButton = styled(Button)(() => ({
  justifyContent: "flex-start",
  "& .MuiButton-endIcon": {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
}));

export const Invited: FC<InvitedProps> = ({
  handle,
  invitedBy,
  discordVerified,
  setDiscordVerified,
}) => {
  const { data: session, status } = useSession();
  const theme = useTheme();
  const { publicKey, connected } = useWallet();
  const [discordTokens, setDiscordTokens] = useState<DiscordTokens | null>(
    null
  );
  const wlState = useRecoilValue(whitelistUserState);
  const { enqueueSnackbar } = useSnackbar();
  const pageLoading = useRecoilValue(pageLoadingState);

  useEffect(() => {
    const tokens = splitURLString(window.location.href) || null;
    if (tokens) {
      const { access_token, state, expires_in = 0 } = tokens;
      const currentTimestamp = dayjs().valueOf();
      const newTimestamp = currentTimestamp + expires_in * 1000;
      setDiscordTokens({
        access_token,
        state,
        expires_in: dayjs(newTimestamp).unix(),
      });
    }
  }, []);

  useEffect(() => {
    discordTokens &&
      (async () => {
        try {
          const connected = await fetch("/api/discord/connect", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(discordTokens),
          });
          const connectedDiscord = await connected.json();          
          if (connectedDiscord?.error && connectedDiscord?.error?.meta?.target[0] === "email") {
            enqueueSnackbar("This email is already connected to a discord account");
          }
          if (connectedDiscord?.userDiscord?.access_token) {
            setDiscordVerified(true);
          }
        } catch (error) {
          throw new Error(`Error connecting discord: ${error}`);
        }
      })();
  }, [discordTokens]);

  useEffect(() => {
    connected &&
      (async () => {
        try {
          await fetch("/api/wallet/connect", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ publicKey }),
          });
        } catch (error) {
          throw new Error("Error connecting wallet");
        }
      })();
  }, [connected, publicKey]);

  const whoInvited = () => {
    switch (true) {
      case wlState?.invitedBy && wlState?.invitedBy === "//self":
        return "request from the Legend of SOL team";
      case wlState?.invitedBy && wlState?.invitedBy === "//admin":
        return "@harkl_";
      case wlState?.invitedBy && wlState?.invitedBy.length > 0:
        return wlState?.invitedBy;
      case invitedBy && invitedBy?.length > 0:
        return invitedBy;
      default:
        return "a fren";
    }
  };

  const verifyDiscord = async () => {
    const genDiscordAuth = await fetch("/api/discord/auth", {
      method: "POST",
    }).then((res) => res.json());
    location.href = genDiscordAuth.url;
  };

  const WalletButton = styled(WalletMultiButtonDynamic)(() => ({
    justifyContent: "flex-start",
    backgroundColor: publicKey ? theme.palette.success.main : ":default",
    "&:hover": {
      backgroundColor: publicKey ? theme.palette.success.dark : "default",
    },
    "& .MuiButton-endIcon": {
      flexGrow: 1,
      justifyContent: "end",
    },
  }));

  if (pageLoading) return (<PageLoading />);

  return (
    <Grid
      item
      xs={12}
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        p={2}
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" mb={2}>
          GM {handle ? `@${handle}` : ""}
        </Typography>
        {(!session || !discordVerified || !publicKey) && (
          <Typography variant="body1" sx={{ mb: 2 }}>
            You were nominated by <strong>{whoInvited()}</strong>, link your
            discord and wallet below to <strong>secure your LoS airdrop</strong>
          </Typography>
        )}
        <Grid item xs={12} sm={8} sx={{ width: "100%" }}>
          {" "}
          <Stack spacing={2}>
            <ConnectButton
              variant="contained"
              fullWidth={true}
              endIcon={
                <Image
                  src={
                    discordVerified
                      ? "images/twitter.svg"
                      : "images/twitter-dark.svg"
                  }
                  height={20}
                  width={20}
                  alt="Twitter Icon"
                />
              }
              onClick={() => !session && signIn("twitter")}
              sx={{
                backgroundColor:
                  session && status === "authenticated"
                    ? theme.palette.success.main
                    : ":default",
                "&:hover": {
                  backgroundColor:
                    session && status === "authenticated"
                      ? theme.palette.success.dark
                      : "default",
                },
              }}
            >
              {session && status === "authenticated"
                ? "Connected"
                : "Connect Twitter"}
            </ConnectButton>
            {session && (
              <>
                <ConnectButton
                  variant="contained"
                  fullWidth={true}
                  endIcon={
                    <Image
                      src={
                        discordVerified
                          ? "images/discord.svg"
                          : "images/discord-dark.svg"
                      }
                      height={20}
                      width={20}
                      alt="Discord Icon"
                    />
                  }
                  onClick={verifyDiscord}
                  sx={{
                    backgroundColor: discordVerified
                      ? theme.palette.success.main
                      : ":default",
                    "&:hover": {
                      backgroundColor: discordVerified
                        ? theme.palette.success.dark
                        : "default",
                    },
                  }}
                >
                  {discordVerified ? "Connected" : "Connect Discord"}
                </ConnectButton>
                <WalletButton
                  fullWidth={true}
                  startIcon={null}
                  endIcon={
                    <Image
                    src={
                      connected
                        ? "images/solana.svg"
                        : "images/solana-dark.svg"
                    }
                      height={20}
                      width={20}
                      alt="Solana Icon"
                    />
                  }
                >
                  {publicKey ? "Connected" : "Connect Solana"}
                </WalletButton>
              </>
            )}
          </Stack>
        </Grid>
      </Box>
    </Grid>
  );
};
