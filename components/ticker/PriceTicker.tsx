import React, { useMemo } from "react";

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
      <span className="uppercase tracking-wide text-sm">{item.name}</span>
      <span className="text-sm">${item.price.toFixed(2)}</span>
      <span className={isUp ? "text-emerald-600" : "text-rose-600"}>
        <Arrow up={isUp} /> <span className="text-sm">{Math.abs(item.changePct).toFixed(2)}%</span>
      </span>
    </div>
  );
}

export function PriceTicker() {
  const data: PriceItem[] = useMemo(
    () => [
      { name: "gold", price: 2387.12, changePct: 0.64 },
      { name: "silver", price: 28.44, changePct: -0.23 },
      { name: "gold", price: 2387.12, changePct: 0.64 },
      { name: "silver", price: 28.44, changePct: -0.23 },
      { name: "gold", price: 2387.12, changePct: 0.64 },
      { name: "silver", price: 28.44, changePct: -0.23 },
    ],
    []
  );

  return (
    <div className="relative bg-white/60 dark:bg-black/40 backdrop-blur">
      {/* gradient fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white dark:from-black to-transparent" />
      <div className="overflow-hidden">
        <div className="flex whitespace-nowrap animate-[ticker_30s_linear_infinite]">
          {data.map((item, idx) => (
            <TickerItem key={idx} item={item} />
          ))}
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


