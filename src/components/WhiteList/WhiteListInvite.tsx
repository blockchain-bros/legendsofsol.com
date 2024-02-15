import React, { FC, useState } from "react";
import Image from "next/image";
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Card,
  FormControl,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
  alpha,
  styled,
  useTheme,
} from "@mui/material";
import { MaxWL, WLStatus, WhiteListedProps } from "../../types/whiteList";
import {
  blankAdd,
  cartoonPointer,
  needsBlank,
  twitterHandleRegex,
} from "../../utils/index";
import theme from "../../utils/theme";
import Close from "pixelarticons/svg/close.svg";
import AccessTime from "pixelarticons/svg/clock.svg";
import PersonAdd from "pixelarticons/svg/user-plus.svg";
import Checkbox from "pixelarticons/svg/checkbox.svg";
import Zap from "pixelarticons/svg/zap.svg";
import { invitedState } from "../../state";
import { useRecoilState } from "recoil";

const CardBase = styled(Card)(({ theme }) => ({
  padding: "0.5rem 0.7rem",
  backgroundColor: theme.palette.backgroundSecondary?.default,
  color: theme.palette.text.secondary,
  input: {
    color: theme.palette.text.secondary,
  },
}));

interface TwitterAvatarProps {
  status?: string;
  handle?: string;
  remove?: (e: any, handle: string) => Promise<void>;
}

const TwitterAvatar: FC<TwitterAvatarProps> = ({ status, remove, handle }) => {
  const theme = useTheme();

  if (status === WLStatus.invited && remove && handle) {
    return (
      <div>
        <Tooltip title="You can remove the user until they are verified">
          <Avatar
            onClick={(e) => remove(e, handle)}
            style={{
              cursor: cartoonPointer(),
              backgroundColor: alpha(theme.palette.error.main, 0.1),
              border: `5px solid ${theme.palette.error.main}`,
            }}
          >
            <Zap height={20} width={20} alt="Remove Icon" />
          </Avatar>
        </Tooltip>
      </div>
    );
  }

  return (
    <Avatar sx={{ backgroundColor: "#5cbdff" }}>
      <Image
        src="images/twitter.svg"
        height={20}
        width={20}
        alt="Twitter Icon"
      />
    </Avatar>
  );
};

interface WhiteListInviteProps {
  data: WhiteListedProps;
  index?: number;
}

export const WhiteListInvite: FC<WhiteListInviteProps> = ({ index, data }) => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState({ exists: false, message: "" });
  const [invited, setInvited] = useRecoilState(invitedState);

  const addinvited = ({ handle, status }: WhiteListedProps) => {
    setInvited((currentinvited) => [
      ...currentinvited.filter((i) => i.status !== WLStatus.null),
      { handle, status },
      blankAdd,
    ]);
  };

  const removeinvited = (index: number) => {
    setInvited((currentinvited) => {
      const filterInvited = currentinvited.filter((_, i) => i !== index);
      const filteredWithBlank = filterInvited.filter(
        (i) => i.status !== WLStatus.null
      );
      if (needsBlank(filteredWithBlank.length)) {
        return [...filteredWithBlank, blankAdd];
      } else {
        return filteredWithBlank;
      }
    });
  };

  const handleInputChange = (event: any) => {
    setError({ exists: false, message: "" });
    setInputValue(event.target.value);
  };

  const removeNominee = async (e: any, handle: string) => {
    e.preventDefault();
    const response = await fetch("/api/whitelist/remove", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ handle }),
    });
    const res = await response.json();
    if (res.status === "success") {
      const index = invited.findIndex((item) => item.handle === handle);
      if (index !== -1) {
        removeinvited(index);
      }
      if (invited.length < MaxWL.default) {
        addinvited(blankAdd);
      }
    }
  };

  const handleAdd = () => {
    if (invited?.length > MaxWL.default) {
      setError({ exists: true, message: `Max ${MaxWL.default} invites` });
      return;
    }
    const trimmed = inputValue.trim();
    if (twitterHandleRegex.test(trimmed)) {
      addinvited({
        handle: trimmed,
        status: WLStatus.added,
      });
      setInputValue("");
    } else {
      setError({ exists: true, message: "Invalid Twitter handle" });
    }
  };

  const ButtonState = ({ state }: { state: string }) => {
    switch (state) {
      case WLStatus.added:
        return (
          <Button onClick={() => index !== undefined && removeinvited(index)}>
            <Close alt="Share" width={30} height={30} />
          </Button>
        );
      case WLStatus.invited:
        return (
          <>
            <Typography
              variant="body2"
              display={"inline"}
              sx={{
                mr: 0.5,
                textTransform: "uppercase",
                fontSize: 12,
                color: theme.palette.secondary.main,
              }}
            >
              Nominated
            </Typography>
            <AccessTime alt="Clock" width={30} height={30} />
          </>
        );
      case WLStatus.verified:
        return (
          <>
            <Typography
              variant="body2"
              display={"inline"}
              sx={{
                mr: 0.5,
                textTransform: "uppercase",
                fontSize: 12,
                color: theme.palette.success.main,
              }}
            >
              Verified
            </Typography>
            <Checkbox alt="Check" width={30} height={30} />
          </>
        );
      default:
        return (
          <ButtonBase disabled={error.exists} onClick={handleAdd}>
            <PersonAdd alt="Add Person" width={30} height={30} />
          </ButtonBase>
        );
    }
  };

  return (
    <>
      {data.status !== WLStatus.null && (
        <CardBase sx={{ maxWidth: "90vw"}}>
          <Box
            style={{ display: "flex", alignItems: "center", maxWidth: "100%" }}
          >
            <TwitterAvatar
              status={data.status}
              remove={removeNominee}
              handle={data.handle}
            />
            <Box style={{ marginLeft: "16px", flexBasis: "auto", flexGrow: 1 }}>
              <Typography
                variant="body1"
                sx={{ 
                  mr: 2, 
                  maxWidth: "30vw", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap" 
                }}
              >
                @{data.handle}
              </Typography>
            </Box>
            <ButtonState state={data.status} />
          </Box>
        </CardBase>
      )}
      {invited?.length < MaxWL.default + 1 && data.status === WLStatus.null && (
        <CardBase>
          <Box style={{ display: "flex", alignItems: "center" }}>
            <TwitterAvatar />
            <Box ml={2}>
              <FormControl>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAdd();
                  }}
                >
                  <TextField
                    variant="outlined"
                    size="small"
                    value={inputValue}
                    onChange={handleInputChange}
                    error={error.exists}
                    helperText={error.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <strong>@</strong>
                        </InputAdornment>
                      ),
                    }}
                  />
                </form>
              </FormControl>
            </Box>
            <div style={{ flexGrow: 1 }} />
            <ButtonState state={data.status} />
          </Box>
        </CardBase>
      )}
    </>
  );
};
