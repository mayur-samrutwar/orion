import React, { useEffect, useState } from "react";
import { Seo } from "@/components/layout/Seo";
import { ORION_ADDR } from "@/utils/orion";

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

async function fetchProofOfReserve(endpoint: string) {
  const mod = `${ORION_ADDR}::orion`;
  const url = (endpoint || "https://fullnode.testnet.aptoslabs.com").replace(/\/$/, "") + 
    `/v1/accounts/${ORION_ADDR}/resource/${mod}::ProofOfReserve`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("por fetch failed");
  const json = await res.json();
  return {
    total_minted_ogold: Number(json.data.total_minted_ogold),
    total_minted_osilver: Number(json.data.total_minted_osilver),
  };
}

async function fetchOraclePrices(endpoint: string) {
  const mod = `${ORION_ADDR}::orion`;
  const url = (endpoint || "https://fullnode.testnet.aptoslabs.com").replace(/\/$/, "") + 
    `/v1/accounts/${ORION_ADDR}/resource/${mod}::OracleConfig`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("oracle fetch failed");
  const json = await res.json();
  return {
    xau_usd_6: Number(json.data.xau_usd_6),
    xag_usd_6: Number(json.data.xag_usd_6),
  };
}

export default function DebugPoolsPage() {
  const endpoint = process.env.NEXT_PUBLIC_APTOS_ENDPOINT || "https://fullnode.testnet.aptoslabs.com";
  const [goldPool, setGoldPool] = useState<any>(null);
  const [silverPool, setSilverPool] = useState<any>(null);
  const [por, setPor] = useState<any>(null);
  const [oracle, setOracle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [gold, silver, porData, oracleData] = await Promise.all([
          fetchPool(endpoint, "gold"),
          fetchPool(endpoint, "silver"),
          fetchProofOfReserve(endpoint),
          fetchOraclePrices(endpoint),
        ]);
        setGoldPool(gold);
        setSilverPool(silver);
        setPor(porData);
        setOracle(oracleData);
      } catch (e) {
        console.error("Failed to fetch data:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [endpoint]);

  const totalUSDCBacking = (goldPool?.usdc || 0) + (silverPool?.usdc || 0);
  const goldPriceUSD = oracle?.xau_usd_6 ? oracle.xau_usd_6 / 1_000_000 : 0;
  const silverPriceUSD = oracle?.xag_usd_6 ? oracle.xag_usd_6 / 1_000_000 : 0;
  
  const mintedGoldValue = por?.total_minted_ogold ? (por.total_minted_ogold * goldPriceUSD) : 0;
  const mintedSilverValue = por?.total_minted_osilver ? (por.total_minted_osilver * silverPriceUSD) : 0;
  const totalMintedValue = mintedGoldValue + mintedSilverValue;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <Seo title="Debug Pools" description="Debug pool and proof-of-reserve state." />
      <h1 className="text-2xl font-bold tracking-tight mb-6">Debug Pool State</h1>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Oracle Prices */}
          <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4">Oracle Prices</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-black/60 dark:text-white/60">Gold Price</div>
                <div className="text-lg font-mono">${goldPriceUSD.toFixed(6)}/gram</div>
                <div className="text-xs text-black/50 dark:text-white/50">Raw: {oracle?.xau_usd_6}</div>
              </div>
              <div>
                <div className="text-sm text-black/60 dark:text-white/60">Silver Price</div>
                <div className="text-lg font-mono">${silverPriceUSD.toFixed(6)}/gram</div>
                <div className="text-xs text-black/50 dark:text-white/50">Raw: {oracle?.xag_usd_6}</div>
              </div>
            </div>
          </div>

          {/* Pool States */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4">Gold Pool</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-black/60 dark:text-white/60">oGOLD Reserve</span>
                  <span className="font-mono">{goldPool?.token?.toFixed(6) || "0"} grams</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-black/60 dark:text-white/60">USDC Reserve</span>
                  <span className="font-mono">${goldPool?.usdc?.toFixed(6) || "0"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-black/60 dark:text-white/60">LP Shares</span>
                  <span className="font-mono">{goldPool?.shares || "0"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4">Silver Pool</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-black/60 dark:text-white/60">oSILVER Reserve</span>
                  <span className="font-mono">{silverPool?.token?.toFixed(6) || "0"} grams</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-black/60 dark:text-white/60">USDC Reserve</span>
                  <span className="font-mono">${silverPool?.usdc?.toFixed(6) || "0"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-black/60 dark:text-white/60">LP Shares</span>
                  <span className="font-mono">{silverPool?.shares || "0"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Proof of Reserve */}
          <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4">Proof of Reserve Status</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-black/60 dark:text-white/60">Total USDC Backing</div>
                  <div className="text-xl font-mono">${totalUSDCBacking.toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-sm text-black/60 dark:text-white/60">Total Minted Value</div>
                  <div className="text-xl font-mono">${totalMintedValue.toFixed(6)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-black/60 dark:text-white/60">Minted oGOLD</div>
                  <div className="font-mono">{por?.total_minted_ogold?.toFixed(6) || "0"} grams</div>
                  <div className="text-xs text-black/50 dark:text-white/50">Value: ${mintedGoldValue.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-black/60 dark:text-white/60">Minted oSILVER</div>
                  <div className="font-mono">{por?.total_minted_osilver?.toFixed(6) || "0"} grams</div>
                  <div className="text-xs text-black/50 dark:text-white/50">Value: ${mintedSilverValue.toFixed(2)}</div>
                </div>
              </div>

              <div className={`rounded-xl p-4 ${totalMintedValue <= totalUSDCBacking ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${totalMintedValue <= totalUSDCBacking ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">
                    {totalMintedValue <= totalUSDCBacking ? '✅ Reserve Sufficient' : '❌ Reserve Insufficient'}
                  </span>
                </div>
                <div className="text-sm text-black/60 dark:text-white/60 mt-1">
                  Available for minting: ${(totalUSDCBacking - totalMintedValue).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Test Calculation */}
          <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4">Test Mint Calculation</h2>
            <div className="space-y-2 text-sm font-mono">
              <div>Test Amount: 1665 grams</div>
              <div>Gold Price: ${goldPriceUSD.toFixed(6)}/gram</div>
              <div>Value: ${(1665 * goldPriceUSD).toFixed(2)}</div>
              <div>Current Backing: ${totalUSDCBacking.toFixed(2)}</div>
              <div>Current Minted: ${totalMintedValue.toFixed(2)}</div>
              <div>After Mint: ${(totalMintedValue + (1665 * goldPriceUSD)).toFixed(2)}</div>
              <div className={`font-medium ${(totalMintedValue + (1665 * goldPriceUSD)) <= totalUSDCBacking ? 'text-green-600' : 'text-red-600'}`}>
                Result: {(totalMintedValue + (1665 * goldPriceUSD)) <= totalUSDCBacking ? '✅ PASS' : '❌ FAIL'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
