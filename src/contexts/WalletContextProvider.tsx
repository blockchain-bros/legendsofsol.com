import { AutoConnectProvider, useAutoConnect } from "./AutoConnectProvider";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { FC, ReactNode, useCallback, useMemo } from "react";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import {
  NetworkConfigurationProvider,
} from "./NetworkConfigurationProvider";
import { useSnackbar } from "./SnackbarProvider";
import { WalletError } from "@solana/wallet-adapter-base";
import { WalletDialogProvider } from "@solana/wallet-adapter-material-ui";
import { UmiProvider } from "../utils/cm/UmiProvider";
import { SolanaTimeProvider } from "../utils/cm/SolanaTimeContext";

export const WalletContext: FC<{ children: ReactNode }> = ({ children }) => {
  const { autoConnect } = useAutoConnect();
  const { enqueueSnackbar } = useSnackbar();
  const endpoint = useMemo(() => process.env.NEXT_PUBLIC_SOLANA_NETWORK!, []);

  const wallets = useMemo(
    () => [
      // Ledger and backpack use wallet standard
      new SolflareWalletAdapter(),
    ],
    []
  );

  const onError = useCallback((error: WalletError) => {
    enqueueSnackbar(
      error.message ? `${error.name}: ${error.message}` : error.name
    );
    console.error(error);
  }, []);

  return (
    <NetworkConfigurationProvider>
      <AutoConnectProvider>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider
            wallets={wallets}
            onError={onError}
            autoConnect={autoConnect}
          >
            <UmiProvider endpoint={endpoint}>
              <WalletDialogProvider>
                <SolanaTimeProvider>{children}</SolanaTimeProvider>
              </WalletDialogProvider>
            </UmiProvider>
          </WalletProvider>
        </ConnectionProvider>
      </AutoConnectProvider>
    </NetworkConfigurationProvider>
  );
};
