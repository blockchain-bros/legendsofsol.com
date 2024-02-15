import Image from "next/image";
import React from "react";
import { Grid, Box, Typography } from "@mui/material";
import Link from "next/link";

export const Footer = () => {
  return (
    <Grid item xs={12} sx={{ marginBottom: 2 }}>
      <Box>
        <Typography variant="body2" align="center" sx={{ fontSize: 10}}>
          a{" "}
          <Link href="https://twitter.com/harkl_" target="_blank">
            @harkl_
          </Link>{" "}
          joint for{" "}
          <Link href="https://twitter.com/Legends_of_SOL" target="_blank">
            @Legends_of_SOL
          </Link>
        </Typography>
      </Box>
    </Grid>
  );
};
