import { Paper, Box } from "@mui/material";
import { ElementType } from "react";

interface BorderBoxProps {
  children: React.ReactNode;
  component?: ElementType;
}

export const BorderBox = ({ children, component = Box }: BorderBoxProps) => {
  return (
    <Paper elevation={0} component={component} p={2} sx={{ border: `4px solid #EAEAEA`}}>
      {children}
    </Paper>
  );
};