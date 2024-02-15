import React, { FC, useState } from "react";
import { Box, Typography, Paper, Button, Stack } from "@mui/material";
import { useRecoilState } from "recoil";
import { whitelistUserState } from "../state";
import { WLStatus } from "../types/whiteList";
import { assign } from "lodash";
import { ShareButtons } from "./Share/ShareButtons";
import Image from "next/image";

interface RequestAccessProps {
  handle: string | undefined;
}

export const RequestAccess: FC<RequestAccessProps> = ({ handle }) => {
  const [wlState, setWlState] = useRecoilState(whitelistUserState);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (event: any) => {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/whitelist/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ handle }),
    });
    const data = await response.json();
    const updatedWhitelistUserStatus = assign({}, wlState, {
      status: data.tokens[0].status,
      tweetSent: data.tokens[0].tweetSent,
    });
    setWlState(updatedWhitelistUserStatus);
    setLoading(false);
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {wlState?.status !== WLStatus.waitlisted && (
        <Paper elevation={0} component={Box} p={2}>
          <Typography variant="h6" mb={2}>
            {`SAD NEWS, @${handle || "fren"} :(`}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Unfortunately, you have not been nominated by anyone yet.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Let the team know you&apos;re a Legend of Solana.
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="contained"
              fullWidth={true}
              onClick={handleRequest}
              disabled={loading}
            >
              Request Legendary Status
            </Button>
          </Stack>
        </Paper>
      )}
      {wlState?.status === WLStatus.waitlisted && (
        <Paper elevation={0} component={Box} p={2}>
          <Typography variant="h6" mb={2}>
            {`GREAT NEWS, @${handle || "fren"} :)`}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your Legendary status is being reviewed!
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Increase your chances of being verified by notifying other Legends.
          </Typography>
          <Stack spacing={2}>
            <ShareButtons />
          </Stack>
        </Paper>
      )}
    </Box>
  );
};
