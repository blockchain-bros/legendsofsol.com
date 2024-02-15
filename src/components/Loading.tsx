"use client";
import { Stack, Skeleton, Box } from "@mui/material";
import React from "react";

export const PageLoading = () => {
  return (
    <>
      <Stack
        component={Box}
        spacing={1}
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Skeleton variant="rectangular" width={300} height={30} />
        <Skeleton variant="rectangular" width={300} height={30} />
        <Skeleton variant="rectangular" width={300} height={30} />
      </Stack>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Skeleton variant="rounded" height={150} width={300} />
      </Box>
    </>
  );
};
