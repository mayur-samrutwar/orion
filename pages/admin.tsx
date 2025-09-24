import React, { useMemo, useState } from "react";
import { Seo } from "@/components/layout/Seo";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useMetalPrices } from "@/hooks/useMetalPrices";
import { ORION_ADDR, mintPayload } from "@/utils/orion";

type Token = "oGold" | "oSilver";

export default function AdminMintPage() {
  const { account } = useWallet();
  const { data } = useMetalPrices();
  const [token, setToken] = useState<Token>("oGold");
  const [grams, setGrams] = useState<string>("");

  const priceUsd = useMemo(() => {
    if (token === "oGold") return data?.gold?.usdPerGram ?? 0;
    return data?.silver?.usdPerGram ?? 0;
  }, [data, token]);

  const estUsd = useMemo(() => {
    const g = parseFloat(grams);
    if (isNaN(g) || g <= 0 || priceUsd <= 0) return 0;
    return g * priceUsd;
  }, [grams, priceUsd]);

  const { signAndSubmitTransaction } = useWallet();
  
  async function onInitUSDC() {
    try {
      if (!account?.address) throw new Error("No wallet");
      const data = {
        function: `${ORION_ADDR}::usdc_admin::init_usdc`,
        typeArguments: [] as string[],
        functionArguments: [],
      };
      const res = await signAndSubmitTransaction({ sender: account.address, data: data as any });
      console.log("init usdc tx:", res);
      alert("USDC initialized successfully!");
    } catch (e) {
      console.error(e);
      alert("USDC initialization failed. Check console");
    }
  }

  async function onBackUSDC() {
    try {
      if (!account?.address) throw new Error("No wallet");
      const amount = "200000000000"; // $200,000 in 6 decimals
      const pool = token === "oGold" ? "gold" : "silver";
      const data = {
        function: `${ORION_ADDR}::orion::admin_back_usdc_${pool}`,
        typeArguments: [] as string[],
        functionArguments: [amount],
      };
      const res = await signAndSubmitTransaction({ sender: account.address, data: data as any });
      console.log("back usdc tx:", res);
      alert("USDC backing added successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to add USDC backing. Check console");
    }
  }

  async function onMint() {
    try {
      if (!account?.address) throw new Error("No wallet");
      const amt6 = grams ? String(Math.floor(parseFloat(grams) * 1_000_000)) : "0";
      const data = mintPayload(token === "oGold" ? "oGOLD" : "oSILVER", String(account.address), amt6);
      const res = await signAndSubmitTransaction({ sender: String(account.address), data: data as any });
      console.log("mint tx:", res);
      alert("Submitted mint");
    } catch (e) {
      console.error(e);
      alert("Mint failed. Check console");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <Seo title="Admin · Mint Tokens" description="Admin tools to mint oGold and oSilver." />
      <h1 className="text-2xl font-bold tracking-tight mb-6">Admin · Mint Tokens</h1>

      <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-black/60 dark:text-white/60">Select token</label>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setToken("oGold")}
                className={`h-10 px-4 rounded-full text-sm font-medium ring-1 ring-black/10 dark:ring-white/15 transition-colors ${
                  token === "oGold" 
                    ? "bg-black !text-white dark:bg-white dark:!text-black" 
                    : "bg-transparent !text-black dark:!text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                style={token === "oGold" ? { color: 'white' } : { color: 'black' }}
              >
                oGold
              </button>
              <button
                onClick={() => setToken("oSilver")}
                className={`h-10 px-4 rounded-full text-sm font-medium ring-1 ring-black/10 dark:ring-white/15 transition-colors ${
                  token === "oSilver" 
                    ? "bg-black !text-white dark:bg-white dark:!text-black" 
                    : "bg-transparent !text-black dark:!text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                style={token === "oSilver" ? { color: 'white' } : { color: 'black' }}
              >
                oSilver
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-black/60 dark:text-white/60">Amount (grams)</label>
            <input
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="mt-2 w-full h-10 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur px-3 text-base ring-1 ring-black/5 dark:ring-white/10 outline-none"
            />
          </div>
        </div>

        <div className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-4 text-sm flex items-center justify-between">
          <span className="text-black/60 dark:text-white/60">Estimated notional (USD)</span>
          <span className="font-medium">{estUsd > 0 ? `$${estUsd.toFixed(2)}` : "--"}</span>
        </div>

        <div className="pt-2 space-y-3">
          <div className="rounded-2xl ring-1 ring-green-200 dark:ring-green-800 bg-green-50 dark:bg-green-900/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Add USDC Backing</h3>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Required before minting tokens (Proof-of-Reserve)</p>
              </div>
              {account ? (
                <button
                  onClick={onBackUSDC}
                  className="h-8 px-4 rounded-full bg-green-600 text-white text-xs font-medium hover:bg-green-700"
                >
                  Add $200k
                </button>
              ) : (
                <WalletSelector />
              )}
            </div>
          </div>
          
          {account ? (
            <button
              onClick={onMint}
              disabled={!grams || parseFloat(grams) <= 0}
              className="w-full h-11 rounded-full bg-black !text-white dark:bg-white dark:!text-black text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: 'white' }}
            >
              Mint {token}
            </button>
          ) : (
            <WalletSelector />
          )}
        </div>
      </div>
    </div>
  );
}


