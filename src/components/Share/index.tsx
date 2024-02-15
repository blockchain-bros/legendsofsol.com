import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Box, Typography, Button, Paper, Link } from "@mui/material";
import { ShareButtons } from "./ShareButtons";
import { useRecoilValue } from "recoil";
import { invitedState, whitelistUserState } from "../../state";
import { WLStatus, WhitelistUserStatus } from "../../types/whiteList";
import { BorderBox } from "../BorderBox";

const mapNominatedUsers = (wlState: WhitelistUserStatus | null) => {
  return (
    wlState?.existingUsers
      ?.filter((u) => u.status !== WLStatus.verified)
      .map((u) => `@${u.handle}`) || []
  );
};

export const ShareButton = () => {
  const wlState = useRecoilValue(whitelistUserState);
  const invited = useRecoilValue(invitedState);
  const [nominatedUsersLength, setNominatedUsersLength] = useState(0);

  useEffect(() => {
    setNominatedUsersLength(mapNominatedUsers(wlState).length);
  }, [wlState, invited]);

  const actionTweet = async () => {
    const tweet = await fetch("/api/whitelist/tweet-sent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ handlesArray: mapNominatedUsers(wlState) }),
    });
    const data = await tweet.json();
    if (data.success) {
      const sendToUsers = mapNominatedUsers(wlState);
      const users =
        sendToUsers.length > 1
          ? sendToUsers.slice(0, -1).join(", ") +
            " and " +
            sendToUsers.slice(-1)
          : sendToUsers[0];
      if (users) {
        const legendText = sendToUsers.length > 1 ? "Legends" : "a Legend";
        window.open(
          `https://twitter.com/intent/tweet?text=I%20nominate%20${users}%20for%20the%20Legends%20of%20SOL%20airdrop%20for%20being%20${legendText}%0A%0AHead%20over%20to%20LegendsOfSOL.com,%20confirm%20your%20nomination,%20and%20choose%20your%20Legends%20🫡%0A%0AYour%20nomination%20will%20lead%20to%20The%20Choice...%0A%0A%24LEGEND&hashtags=LegendsOfSOL&via=Legends_of_SOL&cashtags=LEGEND`,
          "_blank",
          "noreferrer"
        );
      } else {
        window.open(
          `https://twitter.com/intent/tweet?text=I'm%20waitlisted%20for%20the%20Legends%20of%20SOL%20airdrop!%0ANominate%20me%20at%20http://LegendsOfSOL.com%20&via=legends_of_sol`,
          "_blank",
          "noreferrer"
        );
      }
    }
  };

  return (
    <>
      {wlState?.existingUsers.length ? (
        <Paper
          elevation={0}
          component={Box}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: 2,
          }}
        >
          {nominatedUsersLength ? (
            <>
              <Typography
                variant="h6"
                align="center"
                sx={{ textTransform: "uppercase" }}
              >
                Let your Legends know to connect and verify
              </Typography>
              <Box mt={2}>
                <Button
                  aria-label="Twitter share"
                  variant="contained"
                  onClick={actionTweet}
                >
                  Tweet{" "}
                  {mapNominatedUsers(wlState).length > 1
                    ? mapNominatedUsers(wlState).slice(0, -1).join(", ") +
                      " and " +
                      mapNominatedUsers(wlState).slice(-1)
                    : mapNominatedUsers(wlState)[0]}
                </Button>
              </Box>
            </>
          ) : (
            <Typography variant="body1" align="center">
              All your nominations are verified. Legend!
            </Typography>
          )}
        </Paper>
      ) : null}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          pt: 2,
        }}
      >
        <Typography
          variant="h6"
          align="center"
          sx={{ textTransform: "uppercase" }}
        >
          Share Legends of SOL with other Legends
        </Typography>
        <ShareButtons />
        <BorderBox>
          <Typography variant="h6" gutterBottom align="center">
            What now?
          </Typography>
          <Typography>
            Congratulations, you’ve secured your spot as a bonafide Legend of
            SOL. Come and shit post and keep up with the airdrop in Discord.
          </Typography>
          <Button
            variant="contained"
            fullWidth={true}
            sx={{ marginTop: 2, marginBottom: 1 }}
            onClick={() =>
              window.open(
                "https://discord.gg/9QDdGFJN58",
                "_blank",
                "noreferrer"
              )
            }
            endIcon={
              <Image
                src="images/discord-dark.svg"
                height={20}
                width={20}
                alt="Discord Icon"
              />
            }
          >
            Join us in Discord
          </Button>
          <Typography mt={2} variant="body1" gutterBottom align="center">
            No airdrops have been sent yet, but $LEGEND is live on mainnet.
          </Typography>
          <Button
            variant="contained"
            fullWidth={true}
            sx={{ marginTop: 2, marginBottom: 1 }}
            onClick={() =>
              window.open(
                "https://birdeye.so/token/LGNDeXXXaDDeRerwwHfUtPBNz5s6vrn1NMSt9hdaCwx?chain=solana",
                "_blank",
                "noreferrer"
              )
            }
          >
            $LEGEND on Birdeye
          </Button>
        </BorderBox>
      </Box>
    </>
  );
};
