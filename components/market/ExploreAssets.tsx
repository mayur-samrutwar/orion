import React from "react";
import Image from "next/image";
import { useContractPrices } from "@/hooks/useContractPrices";
import Link from "next/link";

type Asset = {
  name: string;
  ticker: string;
  price: number;
  changePct24h: number;
  color: "up" | "down";
};

function AssetCard({ asset }: { asset: Asset }) {
  const { data } = useContractPrices();
  const livePrice = asset.ticker === "oGold"
    ? data?.gold?.usdPerGram ?? asset.price
    : asset.ticker === "oSilver"
    ? data?.silver?.usdPerGram ?? asset.price
    : asset.price;
  const isUp = asset.changePct24h >= 0;
  return (
    <Link href={`/assets/${asset.ticker.toLowerCase()}`} className="block rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:ring-black/10 dark:hover:ring-white/20 transition">
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
        <div className="mt-4 rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
          <Sparkline ticker={asset.ticker} isUp={isUp} />
        </div>
      </div>
    </Link>
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

// Small, dependency-free sparkline with seeded randomness
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}

function Sparkline({ ticker, isUp }: { ticker: string; isUp: boolean }) {
  const width = 360;
  const height = 100;
  const padding = 6;
  const count = 32;

  const seed = hashString(`${ticker}-${new Date().toDateString()}`);
  const rnd = mulberry32(seed);
  const points: number[] = [];
  let val = isUp ? 0.4 : 0.6; // bias start
  for (let i = 0; i < count; i++) {
    const drift = (rnd() - 0.5) * 0.08 + (isUp ? 0.01 : -0.01);
    val = Math.min(0.95, Math.max(0.05, val + drift));
    points.push(val);
  }

  const stepX = (width - padding * 2) / (count - 1);
  const coords = points.map((p, i) => [padding + i * stepX, padding + (1 - p) * (height - padding * 2)]);
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c[0]},${c[1]}`).join(" ");
  const stroke = isUp ? "#059669" : "#e11d48";
  const fill = isUp ? "url(#gradUp)" : "url(#gradDown)";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28">
      <defs>
        <linearGradient id="gradUp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gradDown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}


