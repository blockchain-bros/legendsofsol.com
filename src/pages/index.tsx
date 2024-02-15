import { PublicKey, publicKey, Umi } from "@metaplex-foundation/umi";
import {
  DigitalAssetWithToken,
  JsonMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import dynamic from "next/dynamic";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useUmi } from "../utils/cm/useUmi";
import {
  fetchCandyMachine,
  safeFetchCandyGuard,
  CandyGuard,
  CandyMachine,
  AccountVersion,
} from "@metaplex-foundation/mpl-candy-machine";
import { guardChecker } from "../utils/cm/checkAllowed";
import { ButtonList } from "../components/CandyMachine/mintButton";
import { GuardReturn } from "../utils/cm/checkerHelper";
import { ShowNft } from "../components/CandyMachine/showNft";
import { InitializeModal } from "../components/CandyMachine/initializeModal";
import { useSolanaTime } from "../utils/cm/SolanaTimeContext";
import { useSnackbar } from "../contexts/SnackbarProvider";
import {
  CardHeader,
  Box,
  Stack,
  Divider,
  Skeleton,
  Button,
  Modal,
  CardContent,
  CardMedia,
  Typography,
  Card,
  Grid,
  Tab,
  Tabs,
  lighten,
} from "@mui/material";
import theme from "../utils/theme";
import LegendScoreChecker from "../components/Airdrop";
import DropIcon from "pixelarticons/svg/drop.svg";
import ChoiceIcon from "pixelarticons/svg/tournament.svg";
import { debounce } from "lodash";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-material-ui")).WalletMultiButton,
  { ssr: false }
);

const useCandyMachine = (
  umi: Umi,
  candyMachineId: string,
  checkEligibility: boolean,
  setCheckEligibility: Dispatch<SetStateAction<boolean>>,
  firstRun: boolean,
  setfirstRun: Dispatch<SetStateAction<boolean>>
) => {
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();
  const [candyGuard, setCandyGuard] = useState<CandyGuard>();

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    (async () => {
      if (checkEligibility) {
        if (!candyMachineId) {
          console.error("No candy machine in .env!");
          enqueueSnackbar("No candy machine in .env!");
          return;
        }

        let candyMachine;
        try {
          candyMachine = await fetchCandyMachine(
            umi,
            publicKey(candyMachineId)
          );
          //verify CM Version
          if (candyMachine.version != AccountVersion.V2) {
            enqueueSnackbar("Wrong candy machine account version!");
            return;
          }
        } catch (e) {
          console.error(e);
          enqueueSnackbar("The CM from .env is invalid");
        }
        setCandyMachine(candyMachine);
        if (!candyMachine) {
          return;
        }
        let candyGuard;
        try {
          candyGuard = await safeFetchCandyGuard(
            umi,
            candyMachine.mintAuthority
          );
        } catch (e) {
          console.error(e);
          enqueueSnackbar("No Candy Guard found! Do you have one assigned?");
        }
        if (!candyGuard) {
          return;
        }
        setCandyGuard(candyGuard);
        if (firstRun) {
          setfirstRun(false);
        }
      }
    })();
  }, [umi, checkEligibility]);

  return { candyMachine, candyGuard };
};

function CustomTabPanel({
  children,
  value,
  index,
  ...other
}: {
  children: React.ReactNode;
  value: number;
  index: number;
  [key: string]: any;
}) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`custom-tabpanel-${index}`}
      aria-labelledby={`custom-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function CustomTab({
  icon,
  label,
}: {
  icon: React.ReactElement;
  label: string;
}) {
  return (
    <Tab
      icon={icon}
      aria-label={label}
      sx={{
        "&.MuiTab-root": {
          backgroundColor: (theme) => theme.palette.background?.paper,
          border: (theme) => `2px solid ${theme.palette.divider}`,
        },
      }}
    />
  );
}

export default function CM() {
  const umi = useUmi();
  const solanaTime = useSolanaTime();
  const { enqueueSnackbar } = useSnackbar();
  const [isShowNftOpen, setShowNftOpen] = useState(false);
  const onShowNftOpen = () => setShowNftOpen(true);
  const onShowNftClose = () => setShowNftOpen(false);

  const [isInitializerOpen, setInitializerOpen] = useState(false);
  const onInitializerOpen = () => setInitializerOpen(true);
  const onInitializerClose = () => setInitializerOpen(false);
  const [mintsCreated, setMintsCreated] = useState<
    | { mint: PublicKey; offChainMetadata: JsonMetadata | undefined }[]
    | undefined
  >();
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [ownedTokens, setOwnedTokens] = useState<DigitalAssetWithToken[]>();
  const [guards, setGuards] = useState<GuardReturn[]>([
    { label: "startDefault", allowed: false, maxAmount: 10 },
  ]);
  const [firstRun, setFirstRun] = useState(true);
  const [checkEligibility, setCheckEligibility] = useState<boolean>(true);
  const [value, setValue] = useState(0);

  if (!process.env.NEXT_PUBLIC_CANDY_MACHINE_ID) {
    console.error("No candy machine in .env!");
    enqueueSnackbar("No candy machine in .env!");
  }
  const candyMachineId: PublicKey = useMemo(() => {
    if (process.env.NEXT_PUBLIC_CANDY_MACHINE_ID) {
      return publicKey(process.env.NEXT_PUBLIC_CANDY_MACHINE_ID);
    } else {
      console.error(`NO CANDY MACHINE IN .env FILE DEFINED!`);
      enqueueSnackbar("NO CANDY MACHINE IN .env FILE DEFINED!");
      return publicKey("11111111111111111111111111111111");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { candyMachine, candyGuard } = useCandyMachine(
    umi,
    candyMachineId,
    checkEligibility,
    setCheckEligibility,
    firstRun,
    setFirstRun
  );

  useEffect(() => {
    const checkEligibilityFunc = async () => {
      if (!candyMachine || !candyGuard || !checkEligibility || isShowNftOpen) {
        return;
      }
      setFirstRun(false);

      const { guardReturn, ownedTokens } = await guardChecker(
        umi,
        candyGuard,
        candyMachine,
        solanaTime
      );

      setOwnedTokens(ownedTokens);
      setGuards(guardReturn);
      setIsAllowed(false);

      let allowed = false;
      for (const guard of guardReturn) {
        if (!guard.allowed) {
          enqueueSnackbar(guard.reason as string);
        }
        if (guard.allowed) {
          allowed = true;
          break;
        }
      }

      setIsAllowed(allowed);
      setLoading(false);
    };

    // Debounce the function
    const debouncedCheck = debounce(checkEligibilityFunc, 1000);

    debouncedCheck();

    // Cleanup function to cancel the debounced call if the component unmounts
    return () => {
      debouncedCheck.cancel();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [umi, checkEligibility, firstRun]);

  const PageContent = () => {
    return (
      <>
        <Card sx={{ p: 0 }}>
          <CardHeader
            title="Total Choices Remaining:"
            sx={{ px: 2, color: theme.palette.divider }}
            action={
              !loading && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Typography fontWeight="fontWeightMedium">
                    {Number(candyMachine?.data.itemsAvailable) -
                      Number(candyMachine?.itemsRedeemed)}
                  </Typography>
                </Box>
              )
            }
          />
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box sx={{ borderRadius: "lg", position: "relative" }}>
                <CardMedia
                  component="img"
                  sx={{ borderRadius: "lg", height: 230, objectFit: "cover" }}
                  image={"/images/choose.gif"}
                  alt={"Make The Choice"}
                />
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            {loading ? (
              <Box width={"100%"}>
                <Divider sx={{ my: 1 }} />
                <Skeleton variant="rectangular" height={30} sx={{ my: 1 }} />
                <Skeleton variant="rectangular" height={30} sx={{ my: 1 }} />
                <Skeleton variant="rectangular" height={30} sx={{ my: 1 }} />
              </Box>
            ) : (
              <ButtonList
                guardList={guards}
                candyMachine={candyMachine}
                candyGuard={candyGuard}
                umi={umi}
                ownedTokens={ownedTokens}
                setGuardList={setGuards}
                mintsCreated={mintsCreated}
                setMintsCreated={setMintsCreated}
                onOpen={onShowNftOpen}
                setCheckEligibility={setCheckEligibility}
              />
            )}
          </CardContent>
        </Card>
        {umi.identity.publicKey === candyMachine?.authority ? (
          <>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Button
                variant="contained"
                sx={{ bgcolor: "error.light", mt: 2 }}
                onClick={onInitializerOpen}
              >
                Initialize Everything!
              </Button>
            </Box>
            <Modal
              open={isInitializerOpen}
              onClose={onInitializerClose}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 600,
                  bgcolor: "background.paper",
                  boxShadow: 24,
                  p: 4,
                }}
              >
                <Typography id="modal-modal-title" variant="h6" component="h2">
                  Initializer
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <InitializeModal
                    umi={umi}
                    candyMachine={candyMachine}
                    candyGuard={candyGuard}
                  />
                </Box>
              </Box>
            </Modal>
          </>
        ) : (
          <></>
        )}
        <Modal
          open={isShowNftOpen}
          onClose={onShowNftClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              p: 1,
              border: (theme) => `2px solid ${theme.palette.divider}`,
              backgroundColor: (theme) => theme.palette.background.paper,
            }}
          >
            <Typography
              id="modal-modal-title"
              align="center"
              component="h2"
              sx={{ fontSize: 10, textTransform: "uppercase" }}
            >
              Your minted NFT:
            </Typography>
            <Box sx={{ mt: 1 }}>
              <ShowNft nfts={mintsCreated} />
            </Box>
          </Box>
        </Modal>
      </>
    );
  };

  return (
    <Grid container justifyContent="center">
      <Grid item xs={12} sm={8} md={6} lg={5}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          <Box sx={{ my: 2, pb: 3 }}>
            <WalletMultiButtonDynamic />
          </Box>
          <Tabs
            value={value}
            onChange={(e: any, newValue: number) => setValue(newValue)}
            aria-label="tab menu icons"
            TabIndicatorProps={{
              style: { backgroundColor: theme.palette.divider },
            }}
            sx={{
              position: "absolute",
              left: 10,
              top: 58,
            }}
          >
            <Tab
              icon={
                <DropIcon
                  style={{
                    color:
                      value === 0
                        ? theme.palette.background.default
                        : theme.palette.divider,
                    fill: "currentcolor",
                    width: 24,
                  }}
                />
              }
              aria-label="airdrop-check"
              sx={{
                "&.MuiTab-root": {
                  backgroundColor: (theme) => theme.palette.background?.default,
                  "&.Mui-selected": {
                    borderTop: (theme) => `2px solid ${theme.palette.divider}`,
                    backgroundColor: (theme) => theme.palette.divider,
                  },
                },
              }}
            />
            <Tab
              icon={
                <ChoiceIcon
                  style={{
                    color:
                      value === 1
                        ? theme.palette.background.default
                        : theme.palette.divider,
                    fill: "currentcolor",
                    width: 24,
                  }}
                />
              }
              aria-label="nft-mint"
              sx={{
                "&.MuiTab-root": {
                  backgroundColor: (theme) => theme.palette.background?.default,
                  "&.Mui-selected": {
                    borderTop: (theme) => `2px solid ${theme.palette.divider}`,
                    backgroundColor: (theme) => theme.palette.divider,
                  },
                },
              }}
            />
          </Tabs>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              border: (theme) => `2px solid ${theme.palette.divider}`,
              minWidth: "100%",
              backgroundColor: (theme) => theme.palette.background.paper,
              mt: "15.5px",
            }}
          >
            <CustomTabPanel value={value} index={0}>
              <LegendScoreChecker setValue={setValue} />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
              <PageContent key="content" />
            </CustomTabPanel>
          </Box>
        </Box>
      </Grid>
      <Grid
        item
        xs={12}
        container
        justifyContent="center"
        alignItems="center"
        sx={{ my: 2 }}
      >
        <Typography variant="h6" align="center" sx={{ fontSize: 10 }}>
          <a
            href="https://jup.ag/swap/SOL-LEGEND_LGNDeXXXaDDeRerwwHfUtPBNz5s6vrn1NMSt9hdaCwx"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: lighten("#0000FF", 0.15) }}
          >
            $LEGEND TOKENS ON JUPITER
          </a>
        </Typography>
      </Grid>
    </Grid>
  );
}
