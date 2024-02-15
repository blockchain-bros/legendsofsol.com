import { createLutForCandyMachineAndGuard } from "../../utils/cm/createLutForCandyGuard";
import {
  CandyGuard,
  CandyMachine,
  getMerkleRoot,
  route,
} from "@metaplex-foundation/mpl-candy-machine";
import {
  Umi,
  publicKey,
  sol,
  some,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import { transferSol, addMemo } from "@metaplex-foundation/mpl-toolbox";
import React from "react";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { allowLists } from "../../utils/cm/checkAllowed";

// new function createLUT that is called when the button is clicked and which calls createLutForCandyMachineAndGuard and returns a success toast
const createLut =
  (
    umi: Umi,
    candyMachine: CandyMachine,
    candyGuard: CandyGuard,
    recentSlot: number
  ) =>
  async () => {
    const [builder, AddressLookupTableInput] =
      await createLutForCandyMachineAndGuard(
        umi,
        recentSlot,
        candyMachine,
        candyGuard
      );
    try {
      const { signature } = await builder.sendAndConfirm(umi, {
        confirm: { commitment: "processed" },
        send: {
          skipPreflight: true,
        },
      });
      console.log(
        `LUT created with signature: ${AddressLookupTableInput.publicKey}`
      );
    } catch (e) {
      console.log(`Error: ${e}`);
    }
  };

const initializeGuards =
  (umi: Umi, candyMachine: CandyMachine, candyGuard: CandyGuard) =>
  async () => {
    if (!candyGuard.groups) {
      return;
    }
    candyGuard.groups.forEach(async (group) => {
      let builder = transactionBuilder();
      if (
        group.guards.freezeSolPayment.__option === "Some" ||
        group.guards.freezeTokenPayment.__option === "Some"
      ) {
        console.log(`Make sure that you ran sugar freeze initialize!`);
      }
      if (group.guards.allocation.__option === "Some") {
        builder = builder.add(
          route(umi, {
            guard: "allocation",
            candyMachine: candyMachine.publicKey,
            candyGuard: candyMachine.mintAuthority,
            group: some(group.label),
            routeArgs: {
              candyGuardAuthority: umi.identity,
              id: group.guards.allocation.value.id,
            },
          })
        );
      }
      if (builder.items.length > 0) {
        builder.sendAndConfirm(umi, {
          confirm: { commitment: "processed" },
          send: {
            skipPreflight: true,
          },
        });
        console.log(`The routes for ${group.label} were created!`);
      } else {
        console.log(`Nothing to create here for group ${group.label}`);
      }
    });
  };


type Props = {
  umi: Umi;
  candyMachine: CandyMachine;
  candyGuard: CandyGuard | undefined;
};

export const InitializeModal = ({ umi, candyMachine, candyGuard }: Props) => {
  const [recentSlot, setRecentSlot] = useState<number>(0);
  const [amount, setAmount] = useState<string>("5");
  console.log(`modal ${candyMachine}`);
  console.log(`candyGuard ${candyGuard}`);
  console.log(`umi ${umi}`);
  useEffect(() => {
    (async () => {
      setRecentSlot(await umi.rpc.getSlot());
    })();
  }, [umi]);

  if (!candyGuard) {
    console.error("no guard defined!");
    return <></>;
  }

  //key value object with label and roots
  const roots = new Map<string, string>();

  allowLists.forEach((value, key) => {
    //@ts-ignore
    const root = getMerkleRoot(value).toString("hex");
    if (!roots.has(key)) {
      roots.set(key, root);
    }
  });

  //put each root into a <Text> element
  const rootElements = Array.from(roots).map(([key, value]) => {
    return (
      <Box key={key}>
        <Typography variant="subtitle1" component="h2">
          {key}:
        </Typography>
        <Typography>{value}</Typography>
      </Box>
    );
  });

  return (
    <>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={createLut(umi, candyMachine, candyGuard, recentSlot)}
          >
            Create LUT
          </Button>
          <Typography>Reduces transaction size errors</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={initializeGuards(umi, candyMachine, candyGuard)}
          >
            Initialize Guards
          </Button>
          <Typography>Required for some guards</Typography>
        </Stack>
        {rootElements.length > 0 && (
          <Typography variant="h6">
            Merkle trees for your config.json:
          </Typography>
        )}
        {rootElements.length > 0 && rootElements}
      </Stack>
    </>
  );
};
