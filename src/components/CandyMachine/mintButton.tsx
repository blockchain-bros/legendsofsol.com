import {
  CandyGuard,
  CandyMachine,
  mintV2,
} from "@metaplex-foundation/mpl-candy-machine";
import { GuardReturn } from "../../utils/cm/checkerHelper";
import {
  AddressLookupTableInput,
  KeypairSigner,
  PublicKey,
  Transaction,
  Umi,
  createBigInt,
  generateSigner,
  none,
  publicKey,
  signAllTransactions,
  sol,
  some,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import {
  DigitalAsset,
  DigitalAssetWithToken,
  JsonMetadata,
  fetchDigitalAsset,
  fetchJsonMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  fetchAddressLookupTable,
  setComputeUnitLimit,
  transferSol,
} from "@metaplex-foundation/mpl-toolbox";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  chooseGuardToUse,
  routeBuilder,
  mintArgsBuilder,
  GuardButtonList,
} from "../../utils/cm/mintHelper";
import { useSolanaTime } from "../../utils/cm/SolanaTimeContext";
import { verifyTx } from "../../utils/cm/verifyTx";
import { base58 } from "@metaplex-foundation/umi/serializers";
import {
  Box,
  Button,
  Divider,
  Grid,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import theme from "../../utils/theme";

const updateLoadingText = (
  loadingText: string | undefined,
  guardList: GuardReturn[],
  label: string,
  setGuardList: Dispatch<SetStateAction<GuardReturn[]>>
) => {
  const guardIndex = guardList.findIndex((g) => g.label === label);
  if (guardIndex === -1) {
    console.error("guard not found");
    return;
  }
  const newGuardList = [...guardList];
  newGuardList[guardIndex].loadingText = loadingText;
  setGuardList(newGuardList);
};

const fetchNft = async (umi: Umi, nftAdress: PublicKey) => {
  let digitalAsset: DigitalAsset | undefined;
  let jsonMetadata: JsonMetadata | undefined;
  try {
    digitalAsset = await fetchDigitalAsset(umi, nftAdress);
    jsonMetadata = await fetchJsonMetadata(umi, digitalAsset.metadata.uri);
  } catch (e) {
    console.error(e);
  }

  return { digitalAsset, jsonMetadata };
};

const mintClick = async (
  umi: Umi,
  guard: GuardReturn,
  candyMachine: CandyMachine,
  candyGuard: CandyGuard,
  ownedTokens: DigitalAssetWithToken[],
  mintAmount: number,
  mintsCreated:
    | {
        mint: PublicKey;
        offChainMetadata: JsonMetadata | undefined;
      }[]
    | undefined,
  setMintsCreated: Dispatch<
    SetStateAction<
      | { mint: PublicKey; offChainMetadata: JsonMetadata | undefined }[]
      | undefined
    >
  >,
  guardList: GuardReturn[],
  setGuardList: Dispatch<SetStateAction<GuardReturn[]>>,
  onOpen: () => void,
  setCheckEligibility: Dispatch<SetStateAction<boolean>>
) => {
  const guardToUse = chooseGuardToUse(guard, candyGuard);
  if (!guardToUse.guards) {
    console.error("no guard defined!");
    return;
  }

  try {
    //find the guard by guardToUse.label and set minting to true
    const guardIndex = guardList.findIndex((g) => g.label === guardToUse.label);
    if (guardIndex === -1) {
      console.error("guard not found");
      return;
    }
    const newGuardList = [...guardList];
    newGuardList[guardIndex].minting = true;
    setGuardList(newGuardList);

    let routeBuild = await routeBuilder(umi, guardToUse, candyMachine);
    if (routeBuild) {
      await routeBuild.sendAndConfirm(umi, {
        confirm: { commitment: "processed" },
        send: {
          skipPreflight: true,
        },
      });
    }

    // fetch LUT
    let tables: AddressLookupTableInput[] = [];
    const lut = process.env.NEXT_PUBLIC_LUT;
    if (lut) {
      const lutPubKey = publicKey(lut);
      const fetchedLut = await fetchAddressLookupTable(umi, lutPubKey);
      tables = [fetchedLut];
    } else {
      console.log("The developer should really set a lookup table!");
    }

    const mintTxs: Transaction[] = [];
    let nftsigners = [] as KeypairSigner[];

    const latestBlockhash = (await umi.rpc.getLatestBlockhash()).blockhash;

    for (let i = 0; i < mintAmount; i++) {
      const nftMint = generateSigner(umi);
      nftsigners.push(nftMint);

      const mintArgs = mintArgsBuilder(candyMachine, guardToUse, ownedTokens);
      let tx = transactionBuilder().add(
        mintV2(umi, {
          candyMachine: candyMachine.publicKey,
          collectionMint: candyMachine.collectionMint,
          collectionUpdateAuthority: candyMachine.authority,
          nftMint,
          group:
            guardToUse.label === "default" ? none() : some(guardToUse.label),
          candyGuard: candyGuard.publicKey,
          mintArgs,
          tokenStandard: candyMachine.tokenStandard,
        })
      );

      tx = tx.prepend(setComputeUnitLimit(umi, { units: 800_000 }));
      tx = tx.setAddressLookupTables(tables);
      tx = tx.setBlockhash(latestBlockhash);
      const transaction = tx.build(umi);
      mintTxs.push(transaction);
    }
    if (!mintTxs.length) {
      console.error("no mint tx built!");
      return;
    }

    updateLoadingText(`Please sign`, guardList, guardToUse.label, setGuardList);
    const signedTransactions = await signAllTransactions(
      mintTxs.map((transaction, index) => ({
        transaction,
        signers: [umi.payer, nftsigners[index]],
      }))
    );

    let signatures: Uint8Array[] = [];
    let amountSent = 0;
    const sendPromises = signedTransactions.map((tx, index) => {
      return umi.rpc
        .sendTransaction(tx)
        .then((signature) => {
          console.log(
            `Transaction ${index + 1} resolved with signature: ${
              base58.deserialize(signature)[0]
            }`
          );
          amountSent = amountSent + 1;
          signatures.push(signature);
          return { status: "fulfilled", value: signature };
        })
        .catch((error) => {
          console.error(`Transaction ${index + 1} failed:`, error);
          return { status: "rejected", reason: error };
        });
    });

    await Promise.allSettled(sendPromises);

    if (!(await sendPromises[0]).status === true) {
      // throw error that no tx was created
      throw new Error("no tx was created");
    }
    updateLoadingText(
      `finalizing transaction(s)`,
      guardList,
      guardToUse.label,
      setGuardList
    );

    const successfulMints = await verifyTx(umi, signatures);

    updateLoadingText(
      "Fetching your NFT",
      guardList,
      guardToUse.label,
      setGuardList
    );

    // Filter out successful mints and map to fetch promises
    const fetchNftPromises = successfulMints.map((mintResult) =>
      fetchNft(umi, mintResult).then((nftData) => ({
        mint: mintResult,
        nftData,
      }))
    );

    const fetchedNftsResults = await Promise.all(fetchNftPromises);

    // Prepare data for setting mintsCreated
    let newMintsCreated: { mint: PublicKey; offChainMetadata: JsonMetadata }[] =
      [];
    fetchedNftsResults.map((acc) => {
      if (acc.nftData.digitalAsset && acc.nftData.jsonMetadata) {
        newMintsCreated.push({
          mint: acc.mint,
          offChainMetadata: acc.nftData.jsonMetadata,
        });
      }
      return acc;
    }, []);

    // Update mintsCreated only if there are new mints
    if (newMintsCreated.length > 0) {
      setMintsCreated(newMintsCreated);
      onOpen();
    }
  } catch (e) {
    console.error(`minting failed because of ${e}`);
  } finally {
    //find the guard by guardToUse.label and set minting to true
    const guardIndex = guardList.findIndex((g) => g.label === guardToUse.label);
    if (guardIndex === -1) {
      console.error("guard not found");
      return;
    }
    const newGuardList = [...guardList];
    newGuardList[guardIndex].minting = false;
    setGuardList(newGuardList);
    setCheckEligibility(true);
    updateLoadingText(undefined, guardList, guardToUse.label, setGuardList);
  }
};
// new component called timer that calculates the remaining Time based on the bigint solana time and the bigint toTime difference.
const Timer = ({
  solanaTime,
  toTime,
  setCheckEligibility,
}: {
  solanaTime: bigint;
  toTime: bigint;
  setCheckEligibility: Dispatch<SetStateAction<boolean>>;
}) => {
  const [remainingTime, setRemainingTime] = useState<bigint>(
    toTime - solanaTime
  );
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        return prev - BigInt(1);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  //convert the remaining time in seconds to the amount of days, hours, minutes and seconds left
  const days = remainingTime / BigInt(86400);
  const hours = (remainingTime % BigInt(86400)) / BigInt(3600);
  const minutes = (remainingTime % BigInt(3600)) / BigInt(60);
  const seconds = remainingTime % BigInt(60);
  if (days > BigInt(0)) {
    return (
      <Typography variant="body2" sx={{ fontSize: "12px", color: theme.palette.success.main }}>
        {days.toLocaleString("en-US", {
          minimumIntegerDigits: 2,
          useGrouping: false,
        })}
        d{" "}
        {hours.toLocaleString("en-US", {
          minimumIntegerDigits: 2,
          useGrouping: false,
        })}
        h{" "}
        {minutes.toLocaleString("en-US", {
          minimumIntegerDigits: 2,
          useGrouping: false,
        })}
        m{" "}
        {seconds.toLocaleString("en-US", {
          minimumIntegerDigits: 2,
          useGrouping: false,
        })}
        s
      </Typography>
    );
  }
  if (hours > BigInt(0)) {
    return (
      <Typography variant="body2" sx={{ fontSize: "12px", color: theme.palette.success.main }}>
        {hours.toLocaleString("en-US", {
          minimumIntegerDigits: 2,
          useGrouping: false,
        })}
        h{" "}
        {minutes.toLocaleString("en-US", {
          minimumIntegerDigits: 2,
          useGrouping: false,
        })}
        m{" "}
        {seconds.toLocaleString("en-US", {
          minimumIntegerDigits: 2,
          useGrouping: false,
        })}
        s
      </Typography>
    );
  }
  if (minutes > BigInt(0) || seconds > BigInt(0)) {
    return (
      <Typography variant="body2" sx={{ fontSize: "12px", color: theme.palette.success.main }}>
        {minutes.toLocaleString("en-US", {
          minimumIntegerDigits: 2,
          useGrouping: false,
        })}
        m{" "}
        {seconds.toLocaleString("en-US", {
          minimumIntegerDigits: 2,
          useGrouping: false,
        })}
        s
      </Typography>
    );
  }
  if (remainingTime === BigInt(0)) {
    setCheckEligibility(true);
  }
  return <></>;
};

type Props = {
  umi: Umi;
  guardList: GuardReturn[];
  candyMachine: CandyMachine | undefined;
  candyGuard: CandyGuard | undefined;
  ownedTokens: DigitalAssetWithToken[] | undefined;
  setGuardList: Dispatch<SetStateAction<GuardReturn[]>>;
  mintsCreated:
    | {
        mint: PublicKey;
        offChainMetadata: JsonMetadata | undefined;
      }[]
    | undefined;
  setMintsCreated: Dispatch<
    SetStateAction<
      | { mint: PublicKey; offChainMetadata: JsonMetadata | undefined }[]
      | undefined
    >
  >;
  onOpen: () => void;
  setCheckEligibility: Dispatch<SetStateAction<boolean>>;
};

export function ButtonList({
  umi,
  guardList,
  candyMachine,
  candyGuard,
  ownedTokens = [],
  setGuardList,
  mintsCreated,
  setMintsCreated,
  onOpen,
  setCheckEligibility,
}: Props): JSX.Element {
  const solanaTime = useSolanaTime();
  const [numberInputValues, setNumberInputValues] = useState<{
    [label: string]: number;
  }>({});
  if (!candyMachine || !candyGuard) {
    return <></>;
  }

  const handleNumberInputChange = (label: string, value: number) => {
    setNumberInputValues((prev) => ({ ...prev, [label]: value }));
  };

  let filteredGuardlist = guardList.filter(
    (elem, index, self) =>
      index === self.findIndex((t) => t.label === elem.label)
  );
  if (filteredGuardlist.length === 0) {
    return <></>;
  }
  if (filteredGuardlist.length > 1) {
    filteredGuardlist = guardList.filter((elem) => elem.label != "default");
  }
  let buttonGuardList = [];
  for (const guard of filteredGuardlist) {
    const group = candyGuard.groups.find((elem) => elem.label === guard.label);
    let startTime = createBigInt(0);
    let endTime = createBigInt(0);
    if (group) {
      if (group.guards.startDate.__option === "Some") {
        startTime = group.guards.startDate.value.date;
      }
      if (group.guards.endDate.__option === "Some") {
        endTime = group.guards.endDate.value.date;
      }
    }

    let buttonElement: GuardButtonList = {
      label: guard ? guard.label : "default",
      allowed: guard.allowed,
      header: "Make The Choice",
      mintText:
        "This is your last chance. After this, there is no turning back. You choose the blue pill, the story ends. You wake up in your bed and believe whatever you want to. You choose the red pill, you stay in Wonderland, and I show you how deep the rabbit hole goes. Remember, all I'm offering is the truth. Nothing more.",
      buttonLabel: "Choose the red pill",
      startTime,
      endTime,
      tooltip: guard.reason,
      maxAmount: guard.maxAmount,
    };
    buttonGuardList.push(buttonElement);
  }

  const listItems = buttonGuardList.map((buttonGuard, index) => (
    <Box key={index}>
      <Grid container direction="column">
        <Grid item>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ textTransform: "uppercase" }}
              width="100%"
            >
              {buttonGuard.header}
            </Typography>
          </Box>
        </Grid>
        <Grid item width={"100%"}>
          <Box my={1} sx={{ display: "flex", alignItems: "center" }}>
            {buttonGuard.endTime > createBigInt(0) &&
              buttonGuard.endTime - solanaTime > createBigInt(0) &&
              (!buttonGuard.startTime ||
                buttonGuard.startTime - solanaTime <= createBigInt(0)) && (
                <>
                  <Typography
                    variant="body2"
                    sx={{ marginRight: "8px", fontSize: "12px" }}
                  >
                    Ending in:{" "}
                  </Typography>
                  <Timer
                    toTime={buttonGuard.endTime}
                    solanaTime={solanaTime}
                    setCheckEligibility={setCheckEligibility}
                  />
                </>
              )}
            {buttonGuard.startTime > createBigInt(0) &&
              buttonGuard.startTime - solanaTime > createBigInt(0) &&
              (!buttonGuard.endTime ||
                solanaTime - buttonGuard.endTime <= createBigInt(0)) && (
                <>
                  <Typography
                    variant="body2"
                    sx={{ marginRight: "8px", fontSize: "12px", color: theme.palette.success.main }}
                  >
                    Starting in:{" "}
                  </Typography>
                  <Timer
                    toTime={buttonGuard.startTime}
                    solanaTime={solanaTime}
                    setCheckEligibility={setCheckEligibility}
                  />
                </>
              )}
          </Box>
        </Grid>
      </Grid>
      <Grid container spacing={4} direction="column">
        <Grid item>
          <Typography pt="2" variant="body2">
            {buttonGuard.mintText}
          </Typography>
        </Grid>

        {process.env.NEXT_PUBLIC_MULTIMINT && buttonGuard.allowed ? (
          <Grid
            item
            xs={12}
            md={6}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <TextField
              type="number"
              value={numberInputValues[buttonGuard.label] || 1}
              inputProps={{
                min: 1,
                max: buttonGuard.maxAmount < 1 ? 1 : buttonGuard.maxAmount,
              }}
              size="small"
              disabled={!buttonGuard.allowed}
              onChange={(e) =>
                handleNumberInputChange(
                  buttonGuard.label,
                  parseInt(e.target.value)
                )
              }
              variant="outlined"
              sx={{
                border: (theme) =>
                  `1px solid ${theme?.palette?.backgroundSecondary?.default}`,
                minWidth: "65%",
                "& .MuiInputBase-input": {
                  "&:hover": {
                    borderColor: (theme) =>
                      theme?.palette?.backgroundSecondary?.default,
                  },
                  "&.Mui-focused": {
                    borderColor: (theme) =>
                      theme?.palette?.backgroundSecondary?.default,
                  },
                  "&.Mui-disabled": {
                    backgroundColor: (theme) =>
                      theme?.palette?.backgroundSecondary?.default,
                  },
                },
              }}
            />
          </Grid>
        ) : null}
        <Grid
          item
          xs={12}
          md={6}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <Tooltip
            title={buttonGuard.tooltip}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <span>
              <Button
                variant="contained"
                onClick={() =>
                  mintClick(
                    umi,
                    buttonGuard,
                    candyMachine,
                    candyGuard,
                    ownedTokens,
                    numberInputValues[buttonGuard.label] || 1,
                    mintsCreated,
                    setMintsCreated,
                    guardList,
                    setGuardList,
                    onOpen,
                    setCheckEligibility
                  )
                }
                key={buttonGuard.label}
                size="large"
                sx={{
                  backgroundColor: (theme) => theme.palette.error.main,
                  "&.Mui-disabled": {
                    color: (theme) => theme.palette.error.main,
                    backgroundColor: (theme) =>
                      theme.palette.background.default,
                  },
                }}
                disabled={
                  !buttonGuard.allowed ||
                  guardList.find((elem) => elem.label === buttonGuard.label)
                    ?.minting
                }
              >
                {guardList.find((elem) => elem.label === buttonGuard.label)
                  ?.minting
                  ? "Loading..."
                  : buttonGuard.buttonLabel}
              </Button>
            </span>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  ));

  return <>{listItems}</>;
}
