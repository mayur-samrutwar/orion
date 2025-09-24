import type { NextApiRequest, NextApiResponse } from "next";

type AugmontResponse = {
  message: string;
  rate: {
    rates: {
      gBuy: string;
      gSell: string;
      sBuy: string;
      sSell: string;
      gBuyGst?: string;
      sBuyGst?: string;
    };
    blockId?: string;
  };
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await fetch(
      "https://goldapi.augmont.com/api/digital-gold/rates",
      {
        // If an API key is required, set it via env var in headers.
        headers: process.env.AUGMONT_API_KEY
          ? { Authorization: process.env.AUGMONT_API_KEY }
          : undefined,
        // Ensure fresh data on request
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Augmont request failed: ${response.status}`);
    }
    const json = (await response.json()) as AugmontResponse;

    const INR_PER_USD = 88; // conversion ratio provided by user
    const gInr = Number(json.rate.rates.gBuy);
    const sInr = Number(json.rate.rates.sBuy);
    const goldUsdPerGram = gInr / INR_PER_USD;
    const silverUsdPerGram = sInr / INR_PER_USD;

    res.status(200).json({
      gold: {
        usdPerGram: goldUsdPerGram,
        inrPerGram: gInr,
      },
      silver: {
        usdPerGram: silverUsdPerGram,
        inrPerGram: sInr,
      },
      source: "augmont",
      blockId: json.rate.blockId ?? null,
      ts: Date.now(),
    });
  } catch (error: any) {
    res.status(200).json({
      gold: { usdPerGram: 2387.12 / 88, inrPerGram: 2387.12 },
      silver: { usdPerGram: 28.44 / 88, inrPerGram: 28.44 },
      source: "fallback",
      error: error?.message ?? "unknown",
      ts: Date.now(),
    });
  }
}


