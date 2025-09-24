import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

type Asset = "oGold" | "oSilver";

type Props = {
  value: Asset;
  onChange: (a: Asset) => void;
};

const OPTIONS: { label: Asset; icon: string }[] = [
  { label: "oGold", icon: "/icons/gold.png" },
  { label: "oSilver", icon: "/icons/silver.png" },
];

export default function AssetSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const current = OPTIONS.find((o) => o.label === value)!;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 rounded-xl ring-1 ring-black/10 dark:ring-white/15 px-3 text-sm flex items-center gap-2"
      >
        <Image src={current.icon} alt={current.label} width={16} height={16} />
        <span>{current.label}</span>
        <span className="ml-1 text-xs opacity-70">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-white/80 dark:bg-black/40 backdrop-blur p-1 z-20">
          {OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                onChange(opt.label);
                setOpen(false);
              }}
              className={`w-full px-2 py-2 rounded-lg text-left text-sm flex items-center gap-2 hover:ring-1 hover:ring-black/10 dark:hover:ring-white/20 ${
                opt.label === value ? "font-semibold" : ""
              }`}
            >
              <Image src={opt.icon} alt={opt.label} width={16} height={16} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


