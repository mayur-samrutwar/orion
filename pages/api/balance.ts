import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { owner, coinType } = req.body || {};
    if (!owner || !coinType) return res.status(400).json({ error: "owner and coinType required" });
    const endpoint = process.env.NEXT_PUBLIC_APTOS_ENDPOINT || "https://fullnode.testnet.aptoslabs.com";
    const url = endpoint.replace(/\/$/, "") + "/v1/view";
    const body = {
      function: "0x1::coin::balance",
      type_arguments: [coinType],
      arguments: [owner],
    };
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: "view failed", status: r.status, body: t });
    }
    const json = await r.json();
    const raw = Array.isArray(json) ? json[0] : 0;
    const val = typeof raw === "string" ? raw : String(raw || 0);
    res.status(200).json({ value: val });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}


