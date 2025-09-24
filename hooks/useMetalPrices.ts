import { useEffect, useState } from "react";

export type MetalPrices = {
  gold: { usdPerGram: number; inrPerGram: number };
  silver: { usdPerGram: number; inrPerGram: number };
  ts: number;
  source: string;
};

export function useMetalPrices() {
  const [data, setData] = useState<MetalPrices | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/rates", { cache: "no-store" });
        const json = (await res.json()) as MetalPrices;
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "failed");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 60_000); // refresh every minute
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return { data, loading, error };
}


