import React from "react";
import Image from "next/image";
import { useMetalPrices } from "@/hooks/useMetalPrices";

type Asset = {
  name: string;
  ticker: string;
  price: number;
  changePct24h: number;
  color: "up" | "down";
};

function AssetCard({ asset }: { asset: Asset }) {
  const { data } = useMetalPrices();
  const livePrice = asset.ticker === "oGold"
    ? data?.gold?.usdPerGram ?? asset.price
    : asset.ticker === "oSilver"
    ? data?.silver?.usdPerGram ?? asset.price
    : asset.price;
  const isUp = asset.changePct24h >= 0;
  return (
    <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-8 w-8 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center overflow-hidden">
          <Image src={asset.ticker === "oGold" ? "/icons/gold.png" : "/icons/silver.png"} alt={asset.ticker} width={18} height={18} />
        </div>
        <div>
          <div className="text-sm font-semibold">{asset.ticker}</div>
          <div className="text-xs text-black/60 dark:text-white/60">{asset.name}</div>
        </div>
      </div>
      <div className={`rounded-2xl p-5 ${isUp ? "bg-emerald-50/60 dark:bg-emerald-950/20" : "bg-rose-50/60 dark:bg-rose-950/20"}`}>
        <div className="text-3xl font-semibold mb-2">${livePrice.toFixed(2)}</div>
        <div className={`text-sm ${isUp ? "text-emerald-600" : "text-rose-600"}`}>
          {isUp ? "▲" : "▼"} ${Math.abs(livePrice * (asset.changePct24h / 100)).toFixed(2)} ({Math.abs(asset.changePct24h).toFixed(2)}%) 24H
        </div>
        <div className="mt-4 h-28 rounded-xl bg-gradient-to-tr from-black/5 to-transparent dark:from-white/10" />
      </div>
    </div>
  );
}

export function ExploreAssets() {
  const assets: Asset[] = [
    { name: "Tokenized Gold", ticker: "oGold", price: 2387.12, changePct24h: 0.64, color: "up" },
    { name: "Tokenized Silver", ticker: "oSilver", price: 28.44, changePct24h: -0.23, color: "down" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold tracking-tight">Explore Assets</h3>
      </div>
      <div className="mb-5">
        <div className="relative">
          <input
            className="w-full h-10 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur px-3 text-xs ring-1 ring-black/5 dark:ring-white/10 outline-none placeholder:text-black/40 dark:placeholder:text-white/40"
            placeholder="Search asset name or ticker"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-black/40 dark:text-white/40">⌘K</div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((a, i) => (
          <AssetCard key={i} asset={a} />
        ))}
      </div>
    </section>
  );
}


