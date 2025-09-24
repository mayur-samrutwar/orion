import React, { useState } from "react";
import { Seo } from "@/components/layout/Seo";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { ORION_ADDR } from "@/utils/orion";

export default function SetPricesPage() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [goldPrice, setGoldPrice] = useState<string>("120");
  const [silverPrice, setSilverPrice] = useState<string>("0.8");

  async function onSetPrices() {
    try {
      if (!account?.address) throw new Error("No wallet");
      
      // Convert prices to 6 decimals (multiply by 1,000,000)
      const goldPrice6 = String(Math.floor(parseFloat(goldPrice) * 1_000_000));
      const silverPrice6 = String(Math.floor(parseFloat(silverPrice) * 1_000_000));
      
      const data = {
        function: `${ORION_ADDR}::orion::admin_set_oracle_prices`,
        typeArguments: [] as string[],
        functionArguments: [goldPrice6, silverPrice6],
      };
      
      const res = await signAndSubmitTransaction({ sender: account.address, data: data as any });
      console.log("set prices tx:", res);
      alert("Prices set successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to set prices. Check console");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <Seo title="Admin · Set Prices" description="Admin tool to set oracle prices for gold and silver." />
      <h1 className="text-2xl font-bold tracking-tight mb-6">Admin · Set Oracle Prices</h1>

      <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6 space-y-6">
        <div className="rounded-2xl ring-1 ring-blue-200 dark:ring-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Required Before Minting</h3>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Oracle prices must be set before minting oGOLD or oSILVER tokens. 
            The contract uses these prices for proof-of-reserve calculations.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-black/60 dark:text-white/60">Gold Price (USD per gram)</label>
            <input 
              value={goldPrice} 
              onChange={(e) => setGoldPrice(e.target.value)} 
              inputMode="decimal" 
              placeholder="120" 
              className="mt-2 w-full h-10 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur px-3 text-base ring-1 ring-black/5 dark:ring-white/10 outline-none" 
            />
            <div className="text-xs text-black/50 dark:text-white/50 mt-1">
              Current market: ~$120/gram
            </div>
          </div>
          <div>
            <label className="text-sm text-black/60 dark:text-white/60">Silver Price (USD per gram)</label>
            <input 
              value={silverPrice} 
              onChange={(e) => setSilverPrice(e.target.value)} 
              inputMode="decimal" 
              placeholder="0.8" 
              className="mt-2 w-full h-10 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur px-3 text-base ring-1 ring-black/5 dark:ring-white/10 outline-none" 
            />
            <div className="text-xs text-black/50 dark:text-white/50 mt-1">
              Current market: ~$0.8/gram
            </div>
          </div>
        </div>

        <div className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-4 text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-black/60 dark:text-white/60">Gold Price (6 decimals)</span>
            <span className="font-mono text-xs">{goldPrice ? String(Math.floor(parseFloat(goldPrice) * 1_000_000)) : "0"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-black/60 dark:text-white/60">Silver Price (6 decimals)</span>
            <span className="font-mono text-xs">{silverPrice ? String(Math.floor(parseFloat(silverPrice) * 1_000_000)) : "0"}</span>
          </div>
        </div>

        <div className="pt-2">
          {account ? (
            <button 
              onClick={onSetPrices}
              disabled={!goldPrice || !silverPrice || parseFloat(goldPrice) <= 0 || parseFloat(silverPrice) <= 0}
              className="w-full h-11 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set Oracle Prices
            </button>
          ) : (
            <WalletSelector />
          )}
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6">
        <h2 className="text-lg font-semibold mb-4">Next Steps</h2>
        <div className="space-y-3 text-sm text-black/60 dark:text-white/60">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-medium text-green-600 dark:text-green-400">1</div>
            <div>
              <div className="font-medium">Set Oracle Prices</div>
              <div className="text-xs">Configure gold and silver prices in the contract</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">2</div>
            <div>
              <div className="font-medium">Mint USDC</div>
              <div className="text-xs">Mint mock USDC for liquidity provision</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-400">3</div>
            <div>
              <div className="font-medium">Mint Tokens</div>
              <div className="text-xs">Mint oGOLD and oSILVER tokens</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-medium text-orange-600 dark:text-orange-400">4</div>
            <div>
              <div className="font-medium">Add Liquidity</div>
              <div className="text-xs">Provide liquidity to AMM pools</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
