import { JsonMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from "@metaplex-foundation/umi";
import { Box, Typography, Divider, Grid } from "@mui/material";
import React from "react";
import theme from "../../utils/theme"; // Assuming the theme file is used for consistent styling

interface TraitsProps {
  metadata: JsonMetadata;
}

const Traits = ({ metadata }: TraitsProps) => {
  if (metadata === undefined || metadata.attributes === undefined) {
    return <></>;
  }

  const traits = metadata.attributes.filter(
    (a) => a.trait_type !== undefined && a.value !== undefined
  );
  const traitList = traits.map((t) => (
    <Grid item xs={10} key={t.trait_type!} mb={1}>
      <Box width={"100%"}>
        <Typography
          variant="body2"
          sx={{ fontSize: 8, textTransform: "uppercase" }}
        >
          {t.trait_type}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: (theme) => theme.palette.divider }}
        >
          {t.value}
        </Typography>
      </Box>
    </Grid>
  ));

  return (
    <>
      <Divider sx={{ mt: theme.spacing(2), mb: theme.spacing(2) }} />
      <Grid container>{traitList}</Grid>
    </>
  );
};

export default function Card({ metadata }: { metadata: JsonMetadata }) {
  const image = metadata.animation_url ?? metadata.image;
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[3],
      }}
    >
      <Box
        key={image}
        sx={{
          height: 300,
          position: "relative",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundImage: `url(${image})`,
        }}
      />
      <Box sx={{ p: 1 }}>
        <Typography variant="h6" sx={{ fontSize: 18, mb: 1 }}>
          {metadata.name}
        </Typography>
        <Typography sx={{ fontSize: 10, lineHeight: 1.7 }} variant="body2">
          {metadata.description}
        </Typography>
        <Traits metadata={metadata} />
      </Box>
    </Box>
  );
}

type Props = {
  nfts:
    | { mint: PublicKey; offChainMetadata: JsonMetadata | undefined }[]
    | undefined;
};

export const ShowNft = ({ nfts }: Props) => {
    if (nfts === undefined) {
      return <></>;
    }

  const { mint, offChainMetadata } = nfts[nfts.length - 1];
  if (offChainMetadata === undefined) {
    return <></>;
  }
  return <Card metadata={offChainMetadata} key={mint.toString()} />;
};
