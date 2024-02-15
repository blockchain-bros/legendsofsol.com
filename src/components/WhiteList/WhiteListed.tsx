import React, { useState, useEffect } from "react";
import _ from "lodash";
import { Box, Typography, Stack, Button } from "@mui/material";
import { WhiteListInvite } from "./WhiteListInvite";
import { AirdropStatus, MaxAirdrop, MaxWL, WLStatus } from "../../types/whiteList";
import { useSession } from "next-auth/react";
import { getAllocationStatus, needsBlank } from "../../utils";
import { useRecoilState } from "recoil";
import { invitedState, whitelistUserState } from "../../state";
import { BorderBox } from "../BorderBox";

export const WhiteListed = () => {
  const { data: session } = useSession();
  const [invitedUsers, setInvitedUsers] = useRecoilState(invitedState);
  const [showButton, setShowButton] = useState(false);
  const [whitelistUser, setWhitelistUser] = useRecoilState(whitelistUserState);
  const [userAddedAlready, setUserAddedAlready] = useState(false);

  useEffect(() => {
    const existingUsers = whitelistUser?.existingUsers ?? [];
    whitelistUser &&
      setInvitedUsers([
        ...existingUsers.filter((i) => i.handle !== WLStatus.null),
        ...needsBlank(whitelistUser?.invitesUsed),
      ]);
  }, [whitelistUser]);

  useEffect(() => {
    if (
      invitedUsers.filter(
        (i) => i.status === WLStatus.invited || i.status === WLStatus.verified
      ).length < MaxWL.default
    ) {
      setShowButton(true);
    } else {
      setShowButton(false);
    }
  }, [invitedUsers]);

  const sendWhitelisted = async () => {
    setUserAddedAlready(false);
    const handlesArray = invitedUsers
      .filter((i) => i.status !== WLStatus.null)
      .map((i) => i.handle);
    const invite = await fetch("/api/whitelist/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ handlesArray }),
    });
    const data = await invite.json();
    if (
      data?.existingUsers?.filter(
        (u: any) => u.invitedBy !== session?.user?.twitterHandle
      ).length > 0
    ) {
      setUserAddedAlready(true);
    }
    const invitedUsersArr = _([
      ...(Array.isArray(data?.usersCreated) ? data?.usersCreated : []),
      ...(Array.isArray(data?.existingUsers) ? data?.existingUsers : []),
    ])
      .uniqWith((a, b) => a.handle === b.handle)
      .filter({ invitedBy: session?.user?.twitterHandle })
      .map((obj) => ({ handle: obj.handle, status: obj.status as WLStatus }))
      .value();
    setInvitedUsers([
      ...invitedUsersArr.filter((i) => i.handle !== WLStatus.null),
      ...needsBlank(invitedUsersArr?.length),
    ]);
    const prepUserStatus = _.omit(data, "existingUsers", "usersCreated");
    prepUserStatus.existingUsers = invitedUsersArr;
    const updatedWhitelistUserStatus = _.assign(
      {},
      whitelistUser,
      prepUserStatus
    );
    setWhitelistUser(updatedWhitelistUserStatus);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <BorderBox>
        <Typography variant="h6" mb={2}>
          {getAllocationStatus(whitelistUser?.invitesConfirmed)} Airdrop Secured
        </Typography>
        {whitelistUser?.invitesUsed &&
        whitelistUser?.invitesUsed >= MaxWL.default &&
        whitelistUser?.invitesConfirmed >= MaxWL.default ? (
          <>
            <Typography variant="body1">
              Maximum number of <strong>Legends of SOL</strong> have been
              nominated.
            </Typography>
            {whitelistUser?.invitesUsed - whitelistUser?.invitesConfirmed ===
            0 ? (
              <Typography variant="body1" sx={{ mb: 2 }}>
                Waiting for{" "}
                {whitelistUser?.invitesUsed - whitelistUser?.invitesConfirmed}{" "}
                to verify their nomination.
              </Typography>
            ) : null}
          </>
        ) : (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Nominate up to {MaxWL.default} of your friends to become{" "}
              <strong>Legends of SOL</strong> with you.
            </Typography>
            {getAllocationStatus(whitelistUser?.invitesConfirmed) !== AirdropStatus.max &&
              MaxAirdrop.default >= (whitelistUser?.invitesConfirmed || 0) && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Max airdrop is secured with 2 or more verified nominations.
                </Typography>
              )}
          </>
        )}
        {userAddedAlready && (
          <Typography variant="body1" sx={{ mb: 2 }} color="error">
            The twitter handle you added is already nominated
          </Typography>
        )}
        {invitedUsers.length === 0 && (
          <WhiteListInvite
            data={{
              handle: "",
              status: WLStatus.null,
            }}
          />
        )}
        <Stack spacing={1}>
          {invitedUsers.map((wl, i) => (
            <WhiteListInvite key={i} data={wl} index={i} />
          ))}
        </Stack>
        {showButton && (
          <Box mt={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={sendWhitelisted}
              disabled={
                invitedUsers.filter((i) => i.status === WLStatus.added).length <
                1
              }
            >
              Nominate these Legends
            </Button>
          </Box>
        )}
      </BorderBox>
    </Box>
  );
};
