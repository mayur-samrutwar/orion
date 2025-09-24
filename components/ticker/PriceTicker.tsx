import React, { useMemo } from "react";
import Image from "next/image";
import { useMetalPrices } from "@/hooks/useMetalPrices";

type PriceItem = {
  name: string;
  price: number;
  changePct: number; // percent change
};

function Arrow({ up }: { up: boolean }) {
  // Rounded triangle-like arrow via SVG for smooth appearance
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="inline-block align-[-2px]">
      {up ? (
        <path d="M12 5 L20 17 Q12 15 4 17 Z" fill="#059669" />
      ) : (
        <path d="M12 19 L20 7 Q12 9 4 7 Z" fill="#e11d48" />
      )}
    </svg>
  );
}

function TickerItem({ item }: { item: PriceItem }) {
  const isUp = item.changePct >= 0;
  return (
    <div className="flex items-center gap-2 px-6">
      <span className="capitalize tracking-wide text-sm">{item.name}</span>
      <span className="text-sm">${item.price.toFixed(2)}</span>
      <span className={isUp ? "text-emerald-600" : "text-rose-600"}>
        <Arrow up={isUp} /> <span className="text-sm">{Math.abs(item.changePct).toFixed(2)}%</span>
      </span>
    </div>
  );
}

export function PriceTicker() {
  const { data } = useMetalPrices();
  const dataItems: PriceItem[] = useMemo(() => {
    const gold = data?.gold?.usdPerGram ?? 2387.12 / 88;
    const silver = data?.silver?.usdPerGram ?? 28.44 / 88;
    return [
      { name: "oGold", price: gold, changePct: 0.0 },
      { name: "oSilver", price: silver, changePct: 0.0 },
      { name: "oGold", price: gold, changePct: 0.0 },
      { name: "oSilver", price: silver, changePct: 0.0 },
      { name: "oGold", price: gold, changePct: 0.0 },
      { name: "oSilver", price: silver, changePct: 0.0 },
    ];
  }, [data]);

  return (
    <div className="relative bg-white/60 dark:bg-black/40 backdrop-blur">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* gradient fades aligned to container padding */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-12 lg:w-16 bg-gradient-to-r from-white dark:from-black to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-12 lg:w-16 bg-gradient-to-l from-white dark:from-black to-transparent" />
        <div className="overflow-hidden">
          <div className="flex whitespace-nowrap animate-[ticker_30s_linear_infinite]">
            {dataItems.map((item, idx) => (
              <div key={idx} className="flex items-center">
                <TickerItem item={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}


