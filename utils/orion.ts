export const ORION_ADDR = "0x2aa2969a01ebf3231144c1100d15a0642533c3ec55e889d0e7c168deb071643d";
export const ORION_MOD = `${ORION_ADDR}::orion`;

export type Token = "oGOLD" | "oSILVER";

export function toU64_6dec(value: string): string {
  const n = Number(value || 0);
  const scaled = Math.floor(n * 1_000_000);
  return String(scaled);
}

export function buyTokenPayload(token: Token, usdcAmount6: string) {
  const func = token === "oGOLD" ? `${ORION_MOD}::buy_token_xgold` : `${ORION_MOD}::buy_token_xsilver`;
  return {
    function: func,
    typeArguments: [] as string[],
    functionArguments: [usdcAmount6],
  };
}

export function sellTokenPayload(token: Token, tokenAmount6: string) {
  const func = token === "oGOLD" ? `${ORION_MOD}::sell_token_xgold` : `${ORION_MOD}::sell_token_xsilver`;
  return {
    function: func,
    typeArguments: [] as string[],
    functionArguments: [tokenAmount6],
  };
}

export function registerPayloads(token: Token) {
  const regs = [
    { function: `${ORION_MOD}::register_usdc`, typeArguments: [], functionArguments: [] },
  ];
  if (token === "oGOLD") regs.push({ function: `${ORION_MOD}::register_xgold`, typeArguments: [], functionArguments: [] });
  else regs.push({ function: `${ORION_MOD}::register_xsilver`, typeArguments: [], functionArguments: [] });
  return regs;
}

export function coinTypeFor(tokenOrUsdc: "USDC" | Token) {
  if (tokenOrUsdc === "USDC") return `${ORION_ADDR}::orion::USDC`;
  if (tokenOrUsdc === "oGOLD") return `${ORION_ADDR}::orion::OGOLD`;
  return `${ORION_ADDR}::orion::OSILVER`;
}

export function mintPayload(token: Token, to: string, amount6: string) {
  const func = token === "oGOLD" ? `${ORION_MOD}::mint_xgold` : `${ORION_MOD}::mint_xsilver`;
  return { function: func, typeArguments: [] as string[], functionArguments: [to, amount6] };
}

// Fetch coin::balance<CoinType>(owner) via node view API
export async function fetchBalance(owner: string, coinType: string, endpoint = process.env.NEXT_PUBLIC_APTOS_ENDPOINT || "https://fullnode.testnet.aptoslabs.com") {
  const url = endpoint.replace(/\/$/, "") + "/v1/view";
  const body = {
    function: "0x1::coin::balance",
    type_arguments: [coinType],
    arguments: [owner],
  };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(body), cache: "no-store" as any });
  if (!res.ok) throw new Error(`balance view failed: ${res.status}`);
  const json = await res.json();
  // returns [u64]
  const raw = Array.isArray(json) ? json[0] : 0;
  const val = typeof raw === "string" ? Number(raw) : Number(raw || 0);
  return val; // in 6 decimals
}


