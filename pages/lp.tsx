import React, { useEffect, useMemo, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { coinTypeFor, fetchBalance, ORION_ADDR } from "@/utils/orion";

async function fetchPool(endpoint: string, pool: "gold" | "silver") {
  const mod = `${ORION_ADDR}::orion`;
  const url = (endpoint || "https://fullnode.testnet.aptoslabs.com").replace(/\/$/, "") + 
    `/v1/accounts/${ORION_ADDR}/resource/${mod}::${pool === "gold" ? "PoolGold" : "PoolSilver"}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("pool fetch failed");
  const json = await res.json();
  return {
    token: Number(json.data.token_reserve.value) / 1_000_000,
    usdc: Number(json.data.usdc_reserve.value) / 1_000_000,
    shares: Number(json.data.total_lp_shares),
  };
}

export default function LPPage() {
  const endpoint = process.env.NEXT_PUBLIC_APTOS_ENDPOINT || "https://fullnode.testnet.aptoslabs.com";
  const { account, signAndSubmitTransaction } = useWallet();
  const [gold, setGold] = useState<{token:number; usdc:number; shares:number} | null>(null);
  const [silver, setSilver] = useState<{token:number; usdc:number; shares:number} | null>(null);
  const [addGoldToken, setAddGoldToken] = useState<string>("");
  const [addGoldUsdc, setAddGoldUsdc] = useState<string>("");
  const [balances, setBalances] = useState<{usdc?:number; xgold?:number; xsilver?:number}>({});

  useEffect(() => {
    (async () => {
      try {
        setGold(await fetchPool(endpoint, "gold"));
        setSilver(await fetchPool(endpoint, "silver"));
      } catch {}
    })();
  }, [endpoint]);

  useEffect(() => {
    (async () => {
      if (!account?.address) return setBalances({});
      try {
        const [usdc, xgold, xsilver] = await Promise.all([
          fetchBalance(account.address, coinTypeFor("USDC"), endpoint),
          fetchBalance(account.address, coinTypeFor("xGOLD"), endpoint),
          fetchBalance(account.address, coinTypeFor("xSILVER"), endpoint),
        ]);
        setBalances({ usdc: usdc / 1_000_000, xgold: xgold / 1_000_000, xsilver: xsilver / 1_000_000 });
      } catch {}
    })();
  }, [account?.address, endpoint]);

  async function addGoldLP() {
    if (!account?.address) return;
    const ta = Math.floor(Number(addGoldToken || 0) * 1_000_000);
    const ua = Math.floor(Number(addGoldUsdc || 0) * 1_000_000);
    const data = { function: `${ORION_ADDR}::orion::add_liquidity_xgold`, typeArguments: [], functionArguments: [String(ta), String(ua)] };
    await signAndSubmitTransaction({ sender: account.address, data });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Liquidity</h1>

      <div className="grid gap-6">
        <section className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">xGOLD / USDC</div>
            <div className="text-xs text-black/60 dark:text-white/60">Pool: {gold ? `${gold.token.toFixed(6)} xGOLD · ${gold.usdc.toFixed(6)} USDC` : "--"}</div>
          </div>
          <div className="text-xs text-black/60 dark:text-white/60 mb-3">Your balances: {balances.xgold ?? "--"} xGOLD · {balances.usdc ?? "--"} USDC</div>
          {account ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs mb-1">xGOLD amount</div>
                  <input value={addGoldToken} onChange={(e) => setAddGoldToken(e.target.value)} placeholder="0" className="w-full h-10 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur px-3 text-base ring-1 ring-black/5 dark:ring-white/10 outline-none" />
                </div>
                <div>
                  <div className="text-xs mb-1">USDC amount</div>
                  <input value={addGoldUsdc} onChange={(e) => setAddGoldUsdc(e.target.value)} placeholder="0" className="w-full h-10 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur px-3 text-base ring-1 ring-black/5 dark:ring-white/10 outline-none" />
                </div>
              </div>
              <button onClick={addGoldLP} className="w-full h-11 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium">Add Liquidity</button>
            </div>
          ) : (
            <WalletSelector>
              <button className="h-10 px-4 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm">Connect Wallet</button>
            </WalletSelector>
          )}
        </section>

        <section className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">xSILVER / USDC</div>
            <div className="text-xs text-black/60 dark:text-white/60">Pool: {silver ? `${silver.token.toFixed(6)} xSILVER · ${silver.usdc.toFixed(6)} USDC` : "--"}</div>
          </div>
          <div className="text-xs text-black/60 dark:text-white/60 mb-3">Your balances: {balances.xsilver ?? "--"} xSILVER · {balances.usdc ?? "--"} USDC</div>
          <div className="text-xs text-black/50 dark:text-white/50">(Add/remove for silver can be wired similarly.)</div>
        </section>
      </div>
    </div>
  );
}


