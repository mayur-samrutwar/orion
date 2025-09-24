import React, { useMemo, useState } from "react";
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
  async function onMint() {
    try {
      if (!account?.address) throw new Error("No wallet");
      const amt6 = grams ? String(Math.floor(parseFloat(grams) * 1_000_000)) : "0";
      const data = mintPayload(token === "oGold" ? "xGOLD" : "xSILVER", account.address, amt6);
      const res = await signAndSubmitTransaction({ sender: account.address, data });
      console.log("mint tx:", res);
      alert("Submitted mint");
    } catch (e) {
      console.error(e);
      alert("Mint failed. Check console");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Admin · Mint Tokens</h1>

      <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-black/60 dark:text-white/60">Select token</label>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setToken("oGold")}
                className={`h-10 px-4 rounded-full text-sm font-medium ring-1 ring-black/10 dark:ring-white/15 ${
                  token === "oGold" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-transparent"
                }`}
              >
                oGold
              </button>
              <button
                onClick={() => setToken("oSilver")}
                className={`h-10 px-4 rounded-full text-sm font-medium ring-1 ring-black/10 dark:ring-white/15 ${
                  token === "oSilver" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-transparent"
                }`}
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

        <div className="pt-2">
          {account ? (
            <button
              onClick={onMint}
              disabled={!grams || parseFloat(grams) <= 0}
              className="w-full h-11 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mint {token}
            </button>
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


