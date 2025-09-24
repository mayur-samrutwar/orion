import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useContractPrices } from "@/hooks/useContractPrices";

type Row = {
  icon?: string; // reserved for future brand icons
  title: string;
  subtitle: string;
  price: number;
  changePct: number;
};

function List({ title, rows }: { title: string; rows: Row[] }) {
  const { data } = useContractPrices();
  return (
    <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur p-5 ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">24H</span>
      </div>
      <ul className="divide-y divide-black/5 dark:divide-white/10">
        {rows.map((r, i) => {
          const up = r.changePct >= 0;
          const price = r.title === "oGold"
            ? data?.gold?.usdPerGram ?? r.price
            : r.title === "oSilver"
            ? data?.silver?.usdPerGram ?? r.price
            : r.price;
          return (
            <li key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center overflow-hidden">
                  <Image src={r.title === "oGold" ? "/icons/gold.png" : "/icons/silver.png"} alt={r.title} width={18} height={18} />
                </div>
                <div>
                  <Link href={`/assets/${r.title.toLowerCase()}`} className="text-sm font-semibold hover:underline">
                    {r.title}
                  </Link>
                  <div className="text-xs text-black/60 dark:text-white/60">{r.subtitle}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">${price.toFixed(2)}</div>
                <div className={`text-xs ${up ? "text-emerald-600" : "text-rose-600"}`}>
                  {up ? "▲" : "▼"} {Math.abs(r.changePct).toFixed(2)}%
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function MarketOverview() {
  const ogold: Row = { title: "oGold", subtitle: "Tokenized Gold", price: 2387.12, changePct: 0.64 };
  const osilver: Row = { title: "oSilver", subtitle: "Tokenized Silver", price: 28.44, changePct: -0.23 };

  const gainers: Row[] = [ogold, osilver];
  const trending: Row[] = [ogold, osilver];
  const added: Row[] = [ogold, osilver];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <List title="Top Gainers" rows={gainers} />
        <List title="Trending" rows={trending} />
        <List title="Newly Added" rows={added} />
      </div>
    </section>
  );
}


