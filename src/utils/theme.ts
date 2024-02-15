import { Press_Start_2P } from "next/font/google";
import { createTheme } from "@mui/material";
import { cartoonPointer } from ".";

export const spaceGrotesk = Press_Start_2P({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin"],
});

declare module "@mui/material/styles" {
  interface Palette {
    backgroundSecondary?: {
      default?: string;
    };
  }
  interface PaletteOptions {
    backgroundSecondary?: {
      default?: string;
    };
  }
}

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: "#D9D9D9",
    },
    secondary: {
      main: "#bb00da",
      dark: "#9300ab",
    },
    error: {
      main: "#e70000",
    },
    success: {
      main: "#3ccd00",
      dark: "#2fa000",
    },
    background: {
      default: "#01061a",
      paper: "#091236",
    },
    backgroundSecondary: {
      default: "#f1f1f1",
    },
    text: {
      primary: "#FFF",
      secondary: "#555",
    },
    divider: "#fdd553",
  },
  typography: {
    fontFamily: `${spaceGrotesk.style.fontFamily}, "Helvetica", "Arial", sans-serif`,
    h1: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
      fontSize: "40px",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
      fontSize: "30px",
    },
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
      fontSize: 22,
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
      fontSize: 20,
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
      fontSize: 18,
    },
    h6: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        html {
          cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABFklEQVRYR9WXURLDIAhE6/0PbSdOtUpcd1Gnpv1KGpTHBpCE1/cXq+vrMph7dGvXZTtpfW10DCA5jrH1H0Jhs5E0hnZdCR+vb5S8Nn8mQCeS9BdSalYJqMBjAGzq59xAESN7VFVUgV8AZB/dZBR7QTFDCqGquvUBVVoEtgIwpQRzmANSFHgWQKExHdIrPeuMvQNDarXe6nC/AutgV3JW+6bgqQLeV8FekRtgV+ToDKEKnACYKsfZjjkam7a0ZpYTytwmgainpC3HvwBocgKOxqRjehoR9DFKNFYtOwCGYCszobeCbl26N6yyQ6g8X/Wex/rBPsNEV6qAMaJPMynIHQCoSqS9JSMmwef51LflTgCRszU7DvAGiV6mHWfsaVUAAAAASUVORK5CYII='), auto;
        }
        html, body {
          height: 100vh;
        }
        a {
          color: #bb00da;
        }
      `,
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          padding: 20,
          position: "relative",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          cursor: cartoonPointer(),
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          cursor: cartoonPointer(),
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          fill: "#000",
        },
      },
    },
  },
});

export default theme;
