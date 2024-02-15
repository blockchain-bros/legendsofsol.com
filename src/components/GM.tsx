import { Box, Typography, Paper, Button, useTheme } from "@mui/material";
import { signIn, useSession } from "next-auth/react";
import Checkbox from "pixelarticons/svg/checkbox.svg";
import Image from "next/image";
import { BorderBox } from "./BorderBox";

export const GM = () => {
  const { data: session, status } = useSession();
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <BorderBox>
        <Typography variant="h6" mb={2}>
          GM
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Connect with your Twitter account to see if you have been nominated as
          a Legend of SOL
        </Typography>
        <Button
          variant="contained"
          fullWidth={true}
          endIcon={
            <Image
              src="images/twitter-dark.svg"
              height={16}
              width={16}
              alt="Twitter Icon"
            />
          }
          startIcon={
            session && (
              <Checkbox alt="Check" width={24} height={24} />
            )
          }
          onClick={() => signIn("twitter")}
          sx={{
            backgroundColor:
              session && status === "authenticated"
                ? theme.palette.success.main
                : "default",
            "&:hover": {
              backgroundColor:
                session && status === "authenticated"
                  ? theme.palette.success.dark
                  : "default",
            },
          }}
        >
          {session && status ? "twitter connected" : "connect twitter"}
        </Button>
      </BorderBox>
    </Box>
  );
};
