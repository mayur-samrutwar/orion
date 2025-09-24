import React from "react";
import {
  AptosWalletAdapterProvider,
} from "@aptos-labs/wallet-adapter-react";

type WalletProviderProps = {
  children: React.ReactNode;
};

// Wraps the app with Aptos wallet context. We rely on Wallet Standard compatible wallets
// being available in the browser; no explicit plugins are required here.
export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <AptosWalletAdapterProvider autoConnect>{children}</AptosWalletAdapterProvider>
  );
}


