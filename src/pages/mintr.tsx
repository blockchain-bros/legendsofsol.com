import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  collectionsPageState,
  collectionsState,
  highScoreState,
} from "../state";
import MintderCard from "../components/MintrCard";
import dayjs from "dayjs";
import { formatScore, isDate30DaysOld } from "../utils";
import { ApiPagination } from "../types/api";
import { sortBy } from "lodash";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

function Mintder() {
  const [tooManyRequests, setTooManyRequests] = useState(false);

  const setCollections = useSetRecoilState(collectionsState);
  const page = useRecoilValue(collectionsPageState);
  const [highScore, setHighScore] = useRecoilState(highScoreState);

  const { data: session } = useSession();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    const fetchScore = async () => {
      const res = await fetch(`/api/mintder/score`);
      const data = await res.json();
      setHighScore(data.score);
    };
    fetchScore();

    const fetchCollections = async () => {
      const res = await fetch(
        `/api/mintder?page=${page - 1}&limit=${
          ApiPagination.limit
        }`
      );
      const data = await res.json();
      setCollections(sortBy(data.nfts, "id"));
    };
    fetchCollections();

    const userLoaded = window.localStorage.getItem("userLoaded");
    if (!userLoaded || isDate30DaysOld(userLoaded)) {
      const getUser = async () => {
        const res = await fetch("/api/mintder/user-load");
        const data = await res.json();
        if (data.status === "success")
          window.localStorage.setItem("userLoaded", dayjs().toISOString());
      };
      getUser();
    }
  }, []);

  return (
    <Container maxWidth="sm">
      <Grid container>
        {session && (
          <>
            <Typography
              variant="h5"
              component="h1"
              gutterBottom
              align="center"
              width={"100%"}
              pt={3}
              pb={1}
              textTransform={"uppercase"}
            >
              {tooManyRequests
                ? "Vote Limit Reached"
                : `High score: ${formatScore(highScore)}`}
            </Typography>
            <MintderCard setTooManyRequests={setTooManyRequests} />
          </>
        )}
        {!session && (
          <Box
            sx={{
              height: "100%",
              width: "100%",
              minHeight: "20em",
              p: 2,
              mt: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.palette.background.paper,
              border: `4px solid #EAEAEA`,
            }}
          >
            <Typography align="center" mb={2}>
              You need to be verified to play mintr. Head over to the
              verification page.
            </Typography>
            <Button variant="contained" onClick={() => router.push("/")}>
              Login for verification
            </Button>
          </Box>
        )}
      </Grid>
    </Container>
  );
}

export default Mintder;
