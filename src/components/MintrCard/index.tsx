import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Slide,
  Stack,
  Typography,
  lighten,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Zap from "pixelarticons/svg/zap.svg";
import Favorite from "pixelarticons/svg/heart.svg";
import Info from "pixelarticons/svg/eye.svg";
import InfoClose from "pixelarticons/svg/eye-closed.svg";
import Moon from "pixelarticons/svg/moon-star.svg";
import { collectionsState, highScoreState } from "../../state";
import { useRecoilValue } from "recoil";
import Link from "next/link";
import Image from "next/image";
import { CardEnterEvent, CardEvent, SwipeDirection } from "../../types/swiper";
import { useCardSwiper } from "../../hooks/useCardSwiper";
import { Swiper } from "../../utils/swiper";

interface MintrCardProps {
  setTooManyRequests: (value: boolean) => void;
}

const MintderCard: React.FC<MintrCardProps> = ({ setTooManyRequests }) => {
  const [showDescription, setShowDescription] = useState(false);
  const data = useRecoilValue(collectionsState);
  const highScore = useRecoilValue(highScoreState);
  const theme = useTheme();

  const isLg = useMediaQuery(theme.breakpoints.up("lg"));
  let imageSize: number = 350;
  if (isLg) {
    imageSize = 500;
  }

  const onDismiss: CardEvent = (el, id, action, operation) => {
    fetch(`/api/mintder/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nftId: id,
        status: action,
        weight: 1,
      }),
    }).then((response) => {
      if (response.status === 429) {
        setTooManyRequests(true);
      }
    });
  };

  const onFinish = (status: string) => {
    // console.log("lll", status); // 'finished'
  };

  const onEnter: CardEnterEvent = (el, id) => {
    // console.log("enter", el, id);
  };

  const {
    handleEnter,
    handleClickEvents,
    handleNewCardSwiper,
    isFinish,
    swiperElements,
  } = useCardSwiper({
    onDismiss,
    onFinish,
    onEnter,
  });

  const [currentSwiper, setCurrentSwiper] = useState<Swiper | undefined>(
    swiperElements.current[data.length]
  );
  const [hideActionButtons, setHideActionButtons] = useState("");

  useEffect(() => {
    setCurrentSwiper(swiperElements.current[data.length - 1]);
  }, [swiperElements, data]);

  useEffect(() => {
    currentSwiper && handleEnter(currentSwiper.element, currentSwiper.id);
  }, [currentSwiper]);

  useEffect(() => {
    if (isFinish) setHideActionButtons("hide-action-buttons");
  }, [isFinish]);

  useEffect(() => {
    const handleWindowBlur = () => {
      currentSwiper?.handleTouchEnd();
      currentSwiper?.handleMoveUp();
    };
    window.addEventListener("blur", handleWindowBlur);
    return () => window.removeEventListener("blur", handleWindowBlur);
  }, [currentSwiper]);

  return (
    <Grid item xs={12}>
      <Box
        sx={{
          position: "relative",
          minHeight: isLg ? "530px" : "400px",
        }}
      >
        <Box sx={{ width: "100%" }}>
          {data.map(
            ({ id, nftAddress, cdnImg, description, name, symbol, url }) => (
              <Box
                key={nftAddress}
                ref={(ref: HTMLDivElement | null) =>
                  handleNewCardSwiper(ref, id)
                }
                sx={{
                  border: `4px solid #EAEAEA`,
                  borderRadius: "20px",
                  background: theme.palette.background.paper,
                  position: "absolute",
                  maxHeight: "80vh",
                  maxWidth: imageSize,
                  overflow: "hidden",
                  top: 0,
                  left: 0,
                  right: 0,
                  margin: "auto",
                  userSelect: "none",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <Box
                    className={"ribbon-like"}
                    sx={{
                      position: "absolute",
                      top: "1em",
                      left: "1em",
                      rotate: "-15deg",
                      opacity: 0,
                      "&.show": {
                        opacity: 1,
                      },
                    }}
                  >
                    <Image
                      alt="Drake-yes"
                      src={"/images/drake-yes.png"}
                      width={80}
                      height={80}
                    />
                  </Box>
                  <Box
                    className={"ribbon-dislike"}
                    sx={{
                      position: "absolute",
                      top: "1em",
                      right: "1em",
                      rotate: "15deg",
                      opacity: 0,
                      "&.show": {
                        opacity: 1,
                      },
                    }}
                  >
                    <Image
                      alt="Drake-no"
                      src={"/images/drake-no.png"}
                      width={80}
                      height={80}
                    />
                  </Box>
                  <Box
                    sx={{
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: showDescription ? "90%" : "30%",
                        background: `linear-gradient(0deg, rgba(0,0,0,1), rgba(0,0,0,0))`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        px: 1.5,
                        pb: showDescription ? 0 : 1,
                      }}
                    >
                      <Box
                        display="inline-flex"
                        alignItems="center"
                        justifyContent={"space-between"}
                        sx={{
                          width: "100%",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="h2"
                            sx={{
                              fontSize: isLg ? 22 : 14,
                              maxWidth: `calc(${imageSize}px - 4em)`,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              textTransform: "uppercase",
                            }}
                          >
                            {name}
                          </Typography>
                        </Box>
                        <Box>
                          <IconButton
                            aria-label="info"
                            size="small"
                            onClick={() => setShowDescription(!showDescription)}
                            sx={{
                              backgroundColor: lighten(
                                theme.palette.secondary.dark,
                                0.5
                              ),
                              border: `2px solid ${theme.palette.secondary.dark}`,
                              "&:hover": {
                                backgroundColor: lighten(
                                  theme.palette.secondary.dark,
                                  0.7
                                ),
                              },
                            }}
                          >
                            {showDescription ? (
                              <InfoClose
                                alt="Info"
                                width={16}
                                height={16}
                              />
                            ) : (
                              <Info
                                alt="Info"
                                width={16}
                                height={16}
                              />
                            )}
                          </IconButton>
                        </Box>
                      </Box>
                      <Slide
                        direction="up"
                        in={showDescription}
                        mountOnEnter
                        unmountOnExit
                      >
                        <Box>
                          {symbol && (
                            <Typography py={0.5} sx={{ fontSize: 10 }}>
                              ${symbol}
                            </Typography>
                          )}
                          {url && (
                            <Typography
                              sx={{
                                fontSize: 10,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                pb: 0.5,
                              }}
                              gutterBottom
                            >
                              <Link target="_blank" href={url}>
                                {url}
                              </Link>
                            </Typography>
                          )}
                          <Typography
                            pb={2}
                            sx={{
                              fontSize: 13,
                              maxHeight: "70%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {description}
                          </Typography>
                        </Box>
                      </Slide>
                    </Box>
                  </Box>
                  {String(cdnImg).endsWith("//") ? (
                    <Image
                      src={"/images/rugged.png"}
                      alt={name}
                      width={imageSize}
                      height={imageSize}
                    />
                  ) : (
                    <Image
                      src={cdnImg}
                      alt={name}
                      width={imageSize}
                      height={imageSize}
                      placeholder="blur"
                      loading="eager"
                      blurDataURL="/images/rugged.png"
                    />
                  )}
                </Box>
              </Box>
            )
          )}
        </Box>
        {isFinish && (
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
            <Typography variant="h5" align="center" mb={2}>
              You have reached the end of the metaverse
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just got a new high score of ${highScore} on tinder, but for NFTS at LegendsOfSOL.com/mintr!

`)}&hashtags=LegendsOfSOL&via=Legends_of_SOL&cashtags=LEGEND`,
                  "_blank",
                  "noreferrer"
                );
              }}
            >
              Tweet High Score
            </Button>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {!isFinish && (
          <Stack direction={"row"} spacing={7}>
            <IconButton
              disabled={isFinish || data.length === 0}
              aria-label="dislike"
              onClick={() => handleClickEvents(SwipeDirection.LEFT)}
              sx={{
                backgroundColor: lighten(theme.palette.error.main, 0.9),
                border: `4px solid ${theme.palette.error.main}`,
                "&:hover": {
                  backgroundColor: lighten(theme.palette.error.main, 0.7),
                },
              }}
            >
              <Zap alt="Zap" width={30} height={30} />
            </IconButton>
            {/* <IconButton
            aria-label="moon"
            onClick={() => handleClickEvents(SwipeDirection.RIGHT)}
            sx={{
              backgroundColor: lighten(theme.palette.secondary.main, 0.9),
              border: `4px solid ${theme.palette.secondary.main}`,
              "&:hover": {
                backgroundColor: lighten(theme.palette.secondary.main, 0.7),
              },
            }}
          >
            <Moon alt="Moon" width={30} height={30} />
          </IconButton> */}
            <IconButton
              disabled={isFinish || data.length === 0}
              aria-label="like"
              onClick={() => handleClickEvents(SwipeDirection.RIGHT)}
              sx={{
                backgroundColor: lighten(theme.palette.success.main, 0.9),
                border: `4px solid ${theme.palette.success.main}`,
                "&:hover": {
                  backgroundColor: lighten(theme.palette.success.main, 0.7),
                },
              }}
            >
              <Favorite alt="Favorite" width={30} height={30} />
            </IconButton>
          </Stack>
        )}
      </Box>
    </Grid>
  );
};

export default MintderCard;
