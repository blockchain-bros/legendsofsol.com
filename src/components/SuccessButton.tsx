import React, { FC } from "react";
import { Button, useTheme } from "@mui/material";
import { SignInResponse, useSession } from "next-auth/react";
import Checkbox from "pixelarticons/svg/checkbox.svg";
import Image from "next/image";

interface SuccessButtonProps {
  endIcon: React.ReactNode;
  validated: boolean;
  title: string;
  validatedTitle: string;
  action: () => Promise<SignInResponse | undefined>;
}

export const SuccessButton: FC<SuccessButtonProps> = ({
  endIcon,
  validated,
  title,
  validatedTitle,
  action,
}) => {
  const { data: session, status } = useSession();
  const theme = useTheme();
  return (
    <Button
      variant="contained"
      fullWidth={true}
      endIcon={endIcon}
      startIcon={
        session && <Checkbox alt="Check" width={24} height={24} />
      }
      onClick={() => !session && action}
      sx={{
        backgroundColor: validated ? theme.palette.success.main : ":default",
        "&:hover": {
          backgroundColor: validated ? theme.palette.success.dark : "default",
        },
      }}
    >
      {validated ? validatedTitle : title}
    </Button>
  );
};
