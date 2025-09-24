import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useMetalPrices } from "@/hooks/useMetalPrices";

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

function Sparkline({ seed, color }: { seed: string; color: "up" | "down" }) {
  const width = 900;
  const height = 320;
  const padding = 10;
  const count = 120;

  const rnd = mulberry32(hashString(seed));
  const up = color === "up";
  const points: number[] = [];
  let val = up ? 0.5 : 0.55;
  for (let i = 0; i < count; i++) {
    const drift = (rnd() - 0.5) * 0.06 + (up ? 0.002 : -0.002);
    val = Math.min(0.97, Math.max(0.03, val + drift));
    points.push(val);
  }
  const stepX = (width - padding * 2) / (count - 1);
  const coords = points.map((p, i) => [padding + i * stepX, padding + (1 - p) * (height - padding * 2)]);
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c[0]},${c[1]}`).join(" ");
  const stroke = up ? "#059669" : "#e11d48";
  const fill = up ? "url(#gradUp)" : "url(#gradDown)";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[320px]">
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
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function AssetPage() {
  const router = useRouter();
  const slug = String(router.query.slug || "");
  const { data } = useMetalPrices();
  const meta = useMemo(() => {
    const map = {
      ogold: { name: "oGold", sub: "Tokenized Gold", icon: "/icons/gold.png" },
      osilver: { name: "oSilver", sub: "Tokenized Silver", icon: "/icons/silver.png" },
    } as const;
    const key = (slug || "").toLowerCase() as "ogold" | "osilver";
    return map[key] ?? map.ogold;
  }, [slug]);

  const [range, setRange] = useState<"1D" | "1W" | "1M" | "3M" | "1Y" | "ALL">("1D");
  const priceUsd = useMemo(() => {
    if (meta.name === "oGold") return data?.gold?.usdPerGram ?? 0;
    if (meta.name === "oSilver") return data?.silver?.usdPerGram ?? 0;
    return 0;
  }, [data, meta.name]);

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [pay, setPay] = useState<string>("");
  const [receive, setReceive] = useState<string>("");

  // derive conversions
  useEffect(() => {
    const v = parseFloat(pay);
    if (!isNaN(v) && priceUsd > 0) {
      const qty = v / priceUsd;
      setReceive(qty ? qty.toString() : "");
    } else if (!pay) {
      setReceive("");
    }
  }, [pay, priceUsd]);

  function onChangeReceive(val: string) {
    setReceive(val);
    const v = parseFloat(val);
    if (!isNaN(v) && priceUsd > 0) {
      const usdc = v * priceUsd;
      setPay(usdc ? usdc.toString() : "");
    } else if (!val) {
      setPay("");
    }
  }

  return (
    <>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid gap-8 lg:grid-cols-[1fr_380px] items-start">
      {/* Left: Chart card */}
      <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center overflow-hidden">
            <Image src={meta.icon} alt={meta.name} width={20} height={20} />
          </div>
          <div>
            <div className="text-xl font-semibold">{meta.name}</div>
            <div className="text-sm text-black/60 dark:text-white/60">{meta.sub}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-semibold">{priceUsd > 0 ? `$${priceUsd.toFixed(2)}` : "--"}</div>
            <div className="text-xs text-black/60 dark:text-white/60">USD / gram</div>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`h-8 px-3 rounded-full text-xs font-medium ring-1 ring-black/10 dark:ring-white/15 transition ${
                range === r ? "bg-black text-white dark:bg-white dark:text-black" : "bg-transparent text-black/70 dark:text-white/70"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="rounded-2xl overflow-hidden bg-emerald-50/60 dark:bg-emerald-950/20 ring-1 ring-black/5 dark:ring-white/10">
          <Sparkline seed={`${meta.name}-${range}-${new Date().toDateString()}`} color={"up"} />
        </div>
      </div>

      {/* Right: Trade panel */}
      <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-5 shadow-sm lg:sticky lg:top-24 self-start">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setSide("buy")}
              className={`h-8 px-4 rounded-full text-xs font-medium ring-1 ring-black/10 dark:ring-white/15 transition ${
                side === "buy" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-transparent text-black/70 dark:text-white/70"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide("sell")}
              className={`h-8 px-4 rounded-full text-xs font-medium ring-1 ring-black/10 dark:ring-white/15 transition ${
                side === "sell" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-transparent text-black/70 dark:text-white/70"
              }`}
            >
              Sell
            </button>
          </div>
          <div className="text-xs text-black/60 dark:text-white/60">Aptos</div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/15 p-4">
            <div className="text-xs text-black/60 dark:text-white/60 mb-2">Pay</div>
            <div className="flex items-center justify-between">
              <input value={pay} onChange={(e) => setPay(e.target.value)} className="bg-transparent outline-none text-2xl font-semibold w-full" placeholder="0" />
              <div className="text-sm">USDC</div>
            </div>
          </div>

          <div className="text-center text-xs">↓</div>

          <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/15 p-4">
            <div className="text-xs text-black/60 dark:text-white/60 mb-2">Receive</div>
            <div className="flex items-center justify-between">
              <input value={receive} onChange={(e) => onChangeReceive(e.target.value)} className="bg-transparent outline-none text-2xl font-semibold w-full" placeholder="0" />
              <div className="text-sm">{meta.name}</div>
            </div>
          </div>

          <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/15 p-4 text-xs text-black/70 dark:text-white/70">
            <div className="flex items-center justify-between">
              <span>Rate</span>
              <span>{priceUsd > 0 ? `1 ${meta.name} = $${priceUsd.toFixed(2)} USD` : "--"}</span>
            </div>
          </div>

          <button className="w-full h-11 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium">Connect Wallet</button>
        </div>
      </div>
    </div>
    {/* Info sections below the price card */}
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
        <div className="space-y-8">
          <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6">
          <h3 className="text-lg font-bold tracking-tight mb-3">About</h3>
          <p className="text-sm text-black/70 dark:text-white/70">{meta.name} provides tokenized exposure to physical {meta.name === "oGold" ? "gold" : "silver"}. Prices shown are per gram in USD. Storage, audits and proof of reserves are provided by Orion partners.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-3 flex items-center justify-between"><span className="text-black/60 dark:text-white/60">Supported Chain</span><span>Aptos</span></div>
            <div className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-3 flex items-center justify-between"><span className="text-black/60 dark:text-white/60">Category</span><span>Commodity</span></div>
            <div className="rounded-2xl ring-1 ring-black/5 dark:ring:white/10 p-3 flex items-center justify-between"><span className="text-black/60 dark:text-white/60">Unit</span><span>gram</span></div>
            <div className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-3 flex items-center justify-between"><span className="text-black/60 dark:text-white/60">Settlement</span><span>T+0</span></div>
          </div>
          </div>
          <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6">
          <h3 className="text-lg font-bold tracking-tight mb-3">Tokenholder Protections</h3>
          <div className="divide-y divide-black/5 dark:divide-white/10 text-sm">
            <div className="flex items-center justify-between py-3"><span>Security Interest in Collateral</span><span>Yes</span></div>
            <div className="flex items-center justify-between py-3"><span>Bankruptcy Remote</span><span>Yes</span></div>
            <div className="flex items-center justify-between py-3"><span>Daily Attestation Reports</span><a className="hover:underline" href="#">View Reports</a></div>
            <div className="flex items-center justify-between py-3"><span>Monthly Attestation Reports</span><a className="hover:underline" href="#">View Reports</a></div>
          </div>
          <h3 className="text-lg font-bold tracking-tight mt-6 mb-3">Mint and Redemption Capabilities</h3>
          <div className="divide-y divide-black/5 dark:divide-white/10 text-sm">
            <div className="flex items-center justify-between py-3"><span>Minimum Amount</span><span>$1</span></div>
            <div className="flex items-center justify-between py-3"><span>Supported Purchase Methods</span><span>USDC</span></div>
          </div>
          </div>
        </div>
        <div className="hidden lg:block" />
      </div>
    </div>
    </>
  );
}


