import React, { useEffect, useMemo, useState } from "react";
import { Seo } from "@/components/layout/Seo";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { coinTypeFor, fetchBalance, ORION_ADDR, registerPayloads } from "@/utils/orion";

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
  const [balances, setBalances] = useState<{usdc?:number; ogold?:number; osilver?:number}>({});

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
      const owner = String(account.address);
      async function viaApi(coinType: string) {
        const r = await fetch("/api/balance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner: String(owner), coinType }) });
        if (!r.ok) throw new Error("api fail");
        const j = await r.json();
        return Number(j?.value || 0);
      }
      try {
        const [usdc, ogold, osilver] = await Promise.all([
          viaApi(coinTypeFor("USDC")).catch(() => fetchBalance(owner, coinTypeFor("USDC"), endpoint)),
          viaApi(coinTypeFor("oGOLD")).catch(() => fetchBalance(owner, coinTypeFor("oGOLD"), endpoint)),
          viaApi(coinTypeFor("oSILVER")).catch(() => fetchBalance(owner, coinTypeFor("oSILVER"), endpoint)),
        ]);
        setBalances({ usdc: usdc / 1_000_000, ogold: ogold / 1_000_000, osilver: osilver / 1_000_000 });
      } catch {
        setBalances({ usdc: 0, ogold: 0, osilver: 0 });
      }
    })();
  }, [account?.address, endpoint]);

  async function addGoldLP() {
    if (!account?.address) return;
    const ta = Math.floor(Number(addGoldToken || 0) * 1_000_000);
    const ua = Math.floor(Number(addGoldUsdc || 0) * 1_000_000);
    const data = { function: `${ORION_ADDR}::orion::add_liquidity_xgold`, typeArguments: [], functionArguments: [String(ta), String(ua)] };
    await signAndSubmitTransaction({ sender: String(account.address), data: data as any });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <Seo title="Liquidity" description="Provide liquidity to Orion pools." />
      <h1 className="text-2xl font-bold tracking-tight mb-6">Liquidity</h1>

      <div className="grid gap-6">
        <section className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">oGOLD / USDC</div>
            <div className="text-xs text-black/60 dark:text-white/60">Pool: {gold ? `${gold.token.toFixed(6)} oGOLD · ${gold.usdc.toFixed(6)} USDC` : "--"}</div>
          </div>
          <div className="text-xs text-black/60 dark:text-white/60 mb-3 flex items-center gap-3">
            <span>Your balances: {balances.ogold ?? "--"} oGOLD · {balances.usdc ?? "--"} USDC</span>
            {account && (
              <button
                className="underline hover:opacity-70"
                onClick={async () => {
                  try {
                    const regs = registerPayloads("oGOLD");
                    for (const p of regs) await signAndSubmitTransaction({ sender: String(account.address!), data: p as any }).catch(() => null);
                    // refresh
                    const [usdc, ogold] = await Promise.all([
                      fetchBalance(String(account.address!), coinTypeFor("USDC")),
                      fetchBalance(String(account.address!), coinTypeFor("oGOLD")),
                    ]);
                    setBalances((b) => ({ ...b, usdc: usdc / 1_000_000, ogold: ogold / 1_000_000 }));
                  } catch {}
                }}
              >Register</button>
            )}
          </div>
          {account ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs mb-1">oGOLD amount</div>
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
            <WalletSelector />
          )}
        </section>

        <section className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">oSILVER / USDC</div>
            <div className="text-xs text-black/60 dark:text-white/60">Pool: {silver ? `${silver.token.toFixed(6)} oSILVER · ${silver.usdc.toFixed(6)} USDC` : "--"}</div>
          </div>
          <div className="text-xs text-black/60 dark:text-white/60 mb-3 flex items-center gap-3">
            <span>Your balances: {balances.osilver ?? "--"} oSILVER · {balances.usdc ?? "--"} USDC</span>
            {account && (
              <button
                className="underline hover:opacity-70"
                onClick={async () => {
                  try {
                    const regs = registerPayloads("oSILVER");
                    for (const p of regs) await signAndSubmitTransaction({ sender: String(account.address!), data: p as any }).catch(() => null);
                    const [usdc, osilver] = await Promise.all([
                      fetchBalance(String(account.address!), coinTypeFor("USDC")),
                      fetchBalance(String(account.address!), coinTypeFor("oSILVER")),
                    ]);
                    setBalances((b) => ({ ...b, usdc: usdc / 1_000_000, osilver: osilver / 1_000_000 }));
                  } catch {}
                }}
              >Register</button>
            )}
          </div>
          <div className="text-xs text-black/50 dark:text-white/50">(Add/remove for silver can be wired similarly.)</div>
        </section>
      </div>
    </div>
  );
}


