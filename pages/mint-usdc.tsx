import React, { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { ORION_ADDR } from "@/utils/orion";

export default function MintUSDCPage() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [amount, setAmount] = useState<string>("");
  const [to, setTo] = useState<string>("");

  async function onMint() {
    try {
      if (!account?.address) throw new Error("No wallet");
      const recipient = to || account.address;
      const amt6 = amount ? String(Math.floor(parseFloat(amount) * 1_000_000)) : "0";
      const data = {
        function: `${ORION_ADDR}::usdc_admin::mint_usdc`,
        typeArguments: [] as string[],
        functionArguments: [recipient, amt6],
      };
      const res = await signAndSubmitTransaction({ sender: account.address, data });
      console.log("mint usdc:", res);
      alert("Submitted mint");
    } catch (e) {
      console.error(e);
      alert("Mint failed. Check console");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Admin · Mint USDC (Mock)</h1>

      <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-black/60 dark:text-white/60">Amount (USDC)</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" className="mt-2 w-full h-10 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur px-3 text-base ring-1 ring-black/5 dark:ring-white/10 outline-none" />
          </div>
          <div>
            <label className="text-sm text-black/60 dark:text-white/60">Recipient (optional)</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={account?.address || "0x..."} className="mt-2 w-full h-10 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur px-3 text-base ring-1 ring-black/5 dark:ring-white/10 outline-none" />
          </div>
        </div>

        <div className="pt-2">
          {account ? (
            <button onClick={onMint} className="w-full h-11 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium">Mint USDC</button>
          ) : (
            <WalletSelector>
              <button className="w-full h-11 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium">Connect Wallet</button>
            </WalletSelector>
          )}
        </div>
      </div>
    </div>
  );
}


