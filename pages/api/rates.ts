import type { NextApiRequest, NextApiResponse } from "next";

type HermesLatestResp = {
  parsed: Array<{
    id: string;
    price: { price: string; conf: string; expo: number; publish_time: number };
    ema_price?: { price: string; conf: string; expo: number; publish_time: number };
  }>;
};

const HERMES_BASE = process.env.PYTH_HERMES_BASE || "https://hermes.pyth.network";
const GOLD_FEED_ID = process.env.PYTH_XAUUSD_FEED_ID || "765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2";
const SILVER_FEED_ID = process.env.PYTH_XAGUSD_FEED_ID || "f2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e";
const INR_PER_USD = Number(process.env.INR_PER_USD || 89);
const OUNCES_TO_GRAMS = 31.1034768;

function toNumberFromPyth(price: { price: string; expo: number }) {
  const p = Number(price.price);
  const expo = price.expo;
  // value = p * 10^expo
  return p * Math.pow(10, expo);
}

async function fetchPythLatest(feedId: string): Promise<HermesLatestResp> {
  const url = `${HERMES_BASE.replace(/\/$/, "")}/v2/updates/price/latest?ids%5B%5D=${feedId}`;
  const res = await fetch(url, { 
    headers: { "accept": "application/json" },
    cache: "no-store" as any 
  });
  if (!res.ok) throw new Error(`pyth hermes ${res.status}`);
  return (await res.json()) as HermesLatestResp;
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!GOLD_FEED_ID || !SILVER_FEED_ID) throw new Error("missing PYTH feed IDs");

    const [goldResp, silverResp] = await Promise.all([
      fetchPythLatest(GOLD_FEED_ID),
      fetchPythLatest(SILVER_FEED_ID),
    ]);

    const goldData = goldResp.parsed[0];
    const silverData = silverResp.parsed[0];
    
    if (!goldData || !silverData) throw new Error("no price data returned");

    const goldUsdPerOunce = toNumberFromPyth(goldData.price);
    const silverUsdPerOunce = toNumberFromPyth(silverData.price);

    const goldUsdPerGram = goldUsdPerOunce / OUNCES_TO_GRAMS;
    const silverUsdPerGram = silverUsdPerOunce / OUNCES_TO_GRAMS;

    res.status(200).json({
      gold: { usdPerGram: goldUsdPerGram, inrPerGram: goldUsdPerGram * INR_PER_USD },
      silver: { usdPerGram: silverUsdPerGram, inrPerGram: silverUsdPerGram * INR_PER_USD },
      source: "pyth-hermes",
      ts: Date.now(),
      publishTimes: { gold: goldData.price.publish_time, silver: silverData.price.publish_time },
    });
  } catch (error: any) {
    res.status(200).json({
      gold: { usdPerGram: 70, inrPerGram: 70 * INR_PER_USD },
      silver: { usdPerGram: 0.8, inrPerGram: 0.8 * INR_PER_USD },
      source: "fallback",
      error: error?.message ?? "unknown",
      ts: Date.now(),
    });
  }
}


