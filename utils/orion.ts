export const ORION_ADDR = "0x7d0d430388dce99d6352098f0e029454f8fcef7458a68328f533b78df5072379";
export const ORION_MOD = `${ORION_ADDR}::orion`;

export type Token = "xGOLD" | "xSILVER";

export function toU64_6dec(value: string): string {
  const n = Number(value || 0);
  const scaled = Math.floor(n * 1_000_000);
  return String(scaled);
}

export function buyTokenPayload(token: Token, usdcAmount6: string) {
  const func = token === "xGOLD" ? `${ORION_MOD}::buy_token_xgold` : `${ORION_MOD}::buy_token_xsilver`;
  return {
    function: func,
    typeArguments: [] as string[],
    functionArguments: [usdcAmount6],
  };
}

export function sellTokenPayload(token: Token, tokenAmount6: string) {
  const func = token === "xGOLD" ? `${ORION_MOD}::sell_token_xgold` : `${ORION_MOD}::sell_token_xsilver`;
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
  if (token === "xGOLD") regs.push({ function: `${ORION_MOD}::register_xgold`, typeArguments: [], functionArguments: [] });
  else regs.push({ function: `${ORION_MOD}::register_xsilver`, typeArguments: [], functionArguments: [] });
  return regs;
}

export function coinTypeFor(tokenOrUsdc: "USDC" | Token) {
  if (tokenOrUsdc === "USDC") return `${ORION_ADDR}::orion::USDC`;
  if (tokenOrUsdc === "xGOLD") return `${ORION_ADDR}::orion::XGOLD`;
  return `${ORION_ADDR}::orion::XSILVER`;
}

export function mintPayload(token: Token, to: string, amount6: string) {
  const func = token === "xGOLD" ? `${ORION_MOD}::mint_xgold` : `${ORION_MOD}::mint_xsilver`;
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


