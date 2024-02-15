import * as React from "react";
import Head from "next/head";
import createEmotionCache from "../utils/createEmotionCache";
import theme from "../utils/theme";
import { AppProps } from "next/app";
import { CacheProvider, EmotionCache } from "@emotion/react";
import { Box, CssBaseline, Grid, ThemeProvider } from "@mui/material";
import { SessionProvider } from "next-auth/react";
import { SnackbarProvider } from "../contexts/SnackbarProvider";
import { WalletContext } from "../contexts/WalletContextProvider";
import { RecoilRoot } from "recoil";
import Starfield from "../components/NightSky";

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  return (
    <RecoilRoot>
      <SessionProvider session={pageProps.session}>
        <SnackbarProvider>
          <WalletContext>
            <CacheProvider value={emotionCache}>
              <Head>
                <meta
                  name="viewport"
                  content="initial-scale=1, width=device-width"
                />
              </Head>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <Grid
                  container
                  spacing={2}
                  sx={{ position: "absolute", top: 0, zIndex: -1 }}
                >
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        position: "fixed",
                        width: "100vw",
                        height: "100vh",
                      }}
                    >
                      <Starfield />
                    </Box>
                  </Grid>
                </Grid>
                <Component {...pageProps} />
              </ThemeProvider>
            </CacheProvider>
          </WalletContext>
        </SnackbarProvider>
      </SessionProvider>
    </RecoilRoot>
  );
}
