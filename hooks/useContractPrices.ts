import { useEffect, useState } from "react";
import { ORION_ADDR } from "@/utils/orion";

export type ContractPrices = {
  gold: { usdPerGram: number };
  silver: { usdPerGram: number };
  ts: number;
  source: string;
};

async function fetchContractPrices(): Promise<ContractPrices> {
  const endpoint = process.env.NEXT_PUBLIC_APTOS_ENDPOINT || "https://fullnode.testnet.aptoslabs.com";
  const mod = `${ORION_ADDR}::orion`;
  
  try {
    // Fetch oracle prices from contract
    const url = endpoint.replace(/\/$/, "") + `/v1/accounts/${ORION_ADDR}/resource/${mod}::OracleConfig`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("oracle fetch failed");
    const json = await res.json();
    
    const goldPrice6 = Number(json.data.xau_usd_6);
    const silverPrice6 = Number(json.data.xag_usd_6);
    
    return {
      gold: { usdPerGram: goldPrice6 / 1_000_000 },
      silver: { usdPerGram: silverPrice6 / 1_000_000 },
      source: "contract-oracle",
      ts: Date.now(),
    };
  } catch (error) {
    console.error("Failed to fetch contract prices:", error);
    // Fallback to default prices if contract fetch fails
    return {
      gold: { usdPerGram: 120 }, // Your set price
      silver: { usdPerGram: 0.8 }, // Your set price
      source: "fallback",
      ts: Date.now(),
    };
  }
}

export function useContractPrices() {
  const [data, setData] = useState<ContractPrices | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const prices = await fetchContractPrices();
        if (mounted) setData(prices);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "failed");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 30_000); // refresh every 30 seconds
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return { data, loading, error };
}
