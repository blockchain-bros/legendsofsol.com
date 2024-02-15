import React, { FC, useEffect } from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Grid,
  styled,
  Box,
} from "@mui/material";
import Image from "next/image";
import { useRecoilValue } from "recoil";
import { whitelistUserState } from "../state";
import { WLStatus } from "../types/whiteList";
import { getAllocationStatus } from "../utils";

interface UserStatusProps {
  handle: string | null | undefined;
  pfp: string | null | undefined;
  discordUsername: string | null | undefined;
}

const TableCellNB = styled(TableCell)({
  borderBottom: "none",
  textAlign: "center",
  padding: "0.5rem",
});

export const UserStatus: FC<UserStatusProps> = ({
  handle,
  pfp,
  discordUsername,
}) => {
  const userWhitelistState = useRecoilValue(whitelistUserState);

  const pfpImage = pfp
    ? pfp.replace("_normal", "_400x400")
    : "/images/thug-ph.png";
  return (
    <Grid
      container
      component={Paper}
      py={1}
      sx={{ border: `4px solid #EAEAEA` }}
    >
      <Grid
        item
        xs={12}
        sm={4}
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"center"}
        alignItems={"center"}
      >
        <Image src={pfpImage} alt="Profile Picture" width="150" height="150" />
        <Box
          width="100%"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          <Typography variant="h5" mt={1} sx={{ fontSize: 14 }} align="center">
            @{handle}
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={12} sm={8}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCellNB>
                <strong>Discord</strong>
              </TableCellNB>
              <TableCellNB>
                <Box
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  {discordUsername}
                </Box>
              </TableCellNB>
            </TableRow>
            <TableRow>
              <TableCellNB>
                <strong>Airdrop allocation</strong>
              </TableCellNB>
              {userWhitelistState?.status === WLStatus.waitlisted && (
                <TableCellNB>{WLStatus.waitlisted}</TableCellNB>
              )}
              {userWhitelistState?.status !== WLStatus.waitlisted && (
                <TableCellNB>
                  {getAllocationStatus(userWhitelistState?.invitesConfirmed)}
                </TableCellNB>
              )}
            </TableRow>
            <TableRow>
              <TableCellNB>
                <strong>Nominations verified</strong>
              </TableCellNB>
              <TableCellNB>
                {userWhitelistState?.invitesConfirmed || 0}
              </TableCellNB>
            </TableRow>
            <TableRow>
              <TableCellNB>
                <strong>Nominations remaining</strong>
              </TableCellNB>
              <TableCellNB>{userWhitelistState?.invitesLeft || 0}</TableCellNB>
            </TableRow>
          </TableBody>
        </Table>
      </Grid>
    </Grid>
  );
};
