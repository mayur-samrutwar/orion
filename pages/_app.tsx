import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { Layout } from "@/components/layout/Layout";
import { KYCGuard } from "@/components/kyc/KYCGuard";
import "antd/dist/reset.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <Layout>
        <KYCGuard>
          <Component {...pageProps} />
        </KYCGuard>
      </Layout>
    </WalletProvider>
  );
}
