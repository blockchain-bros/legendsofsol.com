import Link from "next/link";
import React from "react";
import theme from "../../utils/theme";
import { Box, Button, styled } from "@mui/material";
import ShareIcon from "pixelarticons/svg/forward.svg";
import Image from "next/image";

const ShareIconButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary?.main,
  color: theme.palette.background?.default,
  margin: "0 0.5em",
  "&:hover": {
    backgroundColor: theme.palette.primary?.dark,
  },
}));

export const ShareButtons = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        p: 2,
        mt: 1,
        mb: 5,
        "& svg": {
          fill: theme.palette.background?.default,
          "&:hover": {
            fill: theme.palette.primary?.main,
          },
        },
      }}
    >
      <Link
        href={`
          https://twitter.com/intent/tweet
          ?url=LegendsOfSOL.com
          &text=Are%20you%20a%20Legend%20of%20Solana%3F%0A%0AFind%20out%20your%20%23LegendaryStatus%20at
          &via=legends_of_sol
        `.replace(/\s+/g, "")}
        target="_blank"
        rel="noreferrer"
      >
        <ShareIconButton aria-label="Twitter share" size="large">
          Share
          <ShareIcon alt="Share" width={30} height={30} />
        </ShareIconButton>
      </Link>
    </Box>
  );
};
