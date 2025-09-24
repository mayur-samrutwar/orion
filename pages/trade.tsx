import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { Seo } from "@/components/layout/Seo";
import { useMetalPrices } from "@/hooks/useMetalPrices";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { buyTokenPayload, sellTokenPayload, registerPayloads, fetchBalance, coinTypeFor } from "@/utils/orion";
import AssetSelect from "@/components/market/AssetSelect";

type Asset = "oGold" | "oSilver";

export default function TradePage() {
  const { data } = useMetalPrices();
  const { account, signAndSubmitTransaction } = useWallet();

  const [asset, setAsset] = useState<Asset>("oGold");
  const [pay, setPay] = useState<string>("");
  const [receive, setReceive] = useState<string>("");
  const [payIsUSDC, setPayIsUSDC] = useState<boolean>(true); // if false, paying in grams
  const [balance, setBalance] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const price = useMemo(() => {
    return asset === "oGold" ? data?.gold?.usdPerGram ?? 0 : data?.silver?.usdPerGram ?? 0;
  }, [asset, data]);

  useEffect(() => {
    const v = parseFloat(pay);
    if (!isNaN(v) && price > 0) {
      if (payIsUSDC) {
        setReceive((v / price).toString());
      } else {
        setReceive((v * price).toString());
      }
    } else if (!pay) {
      setReceive("");
    }
  }, [pay, price, payIsUSDC]);

  useEffect(() => {
    async function loadBalance() {
      if (!account?.address) return setBalance("");
      const coinType = payIsUSDC ? coinTypeFor("USDC") : coinTypeFor(asset === "oGold" ? "oGOLD" : "oSILVER");
      try {
        // Prefer serverless proxy to avoid CORS/cache issues
        const r = await fetch("/api/balance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner: String(account.address), coinType }) });
        if (!r.ok) throw new Error("api fail");
        const j = await r.json();
        const val = Number(j?.value || 0);
        setBalance((val / 1_000_000).toString());
      } catch (e) {
        try {
          const val = await fetchBalance(String(account.address), coinType);
          setBalance((val / 1_000_000).toString());
        } catch {
          setBalance("0");
        }
      }
    }
    loadBalance();
  }, [account?.address, asset, payIsUSDC]);

  function onReceiveChange(val: string) {
    setReceive(val);
    const v = parseFloat(val);
    if (!isNaN(v) && price > 0) {
      if (payIsUSDC) {
        setPay((v * price).toString());
      } else {
        setPay((v / price).toString());
      }
    } else if (!val) {
      setPay("");
    }
  }

  function onSwitchSides() {
    const newPayIsUSDC = !payIsUSDC;
    // Convert current values appropriately when flipping sides
    const p = parseFloat(pay);
    const r = parseFloat(receive);
    if (!isNaN(p) && !isNaN(r) && price > 0) {
      if (newPayIsUSDC) {
        // switching to pay USDC, receive grams: pay should be r*price, receive p/price
        setPay((r * price).toString());
        setReceive((p / price).toString());
      } else {
        // switching to pay grams, receive USDC: pay should be r/price, receive p*price
        setPay((r / price).toString());
        setReceive((p * price).toString());
      }
    }
    setPayIsUSDC(newPayIsUSDC);
  }

  return (
    <div className="min-h-[70vh] flex items-start justify-center py-12">
      <Seo title="Trade" description="Swap between USDC and tokenized metals on Orion." />
      <div className="w-full max-w-lg rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Trade</div>
          <div>
            <AssetSelect value={asset} onChange={(v) => setAsset(v)} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/15 p-4">
            <div className="text-xs text-black/60 dark:text-white/60 mb-2">Pay</div>
            <div className="flex items-center justify-between gap-3">
              <input value={pay} onChange={(e) => setPay(e.target.value)} className="bg-transparent outline-none text-2xl font-semibold w-full" placeholder="0" />
              <div className="text-right">
                <div className="text-sm flex items-center justify-end gap-2">
                  <span>{payIsUSDC ? "USDC" : asset}</span>
                  <Image src={payIsUSDC ? "/icons/usdc.png" : asset === "oGold" ? "/icons/gold.png" : "/icons/silver.png"} alt={payIsUSDC ? "USDC" : asset} width={16} height={16} />
                </div>
                {account && (
                  <div className="text-[10px] text-black/60 dark:text-white/60 flex items-center gap-2 justify-end">
                    <span>Bal: {balance || "--"}</span>
                    <button
                      className="underline hover:opacity-70"
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          const token = asset === "oGold" ? "oGOLD" : "oSILVER";
                          const regs = registerPayloads(token);
                          for (const p of regs) {
                            await signAndSubmitTransaction({ sender: String(account.address!), data: p as any }).catch(() => null);
                          }
                          // reload balance after short delay
                          setTimeout(() => {
                            (async () => {
                              const coinType = payIsUSDC ? coinTypeFor("USDC") : coinTypeFor(token);
                              try {
                                const val = await fetchBalance(String(account.address!), coinType);
                                setBalance((val / 1_000_000).toString());
                              } catch {}
                            })();
                          }, 800);
                        } catch {}
                      }}
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-center text-xs">
            <button onClick={onSwitchSides} className="h-8 px-3 rounded-full ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/10">↕</button>
          </div>

          <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/15 p-4">
            <div className="text-xs text-black/60 dark:text-white/60 mb-2">Receive</div>
            <div className="flex items-center justify-between">
              <input value={receive} onChange={(e) => onReceiveChange(e.target.value)} className="bg-transparent outline-none text-2xl font-semibold w-full" placeholder="0" />
              <div className="text-sm flex items-center justify-end gap-2">
                <span>{payIsUSDC ? asset : "USDC"}</span>
                <Image src={payIsUSDC ? (asset === "oGold" ? "/icons/gold.png" : "/icons/silver.png") : "/icons/usdc.png"} alt={payIsUSDC ? asset : "USDC"} width={16} height={16} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/15 p-4 text-xs text-black/70 dark:text-white/70">
            <div className="flex items-center justify-between">
              <span>Rate</span>
              <span>{price > 0 ? `1 ${asset} = $${price.toFixed(2)} USD` : "--"}</span>
            </div>
          </div>

          {account ? (
            <button
              className="w-full h-11 rounded-full bg-black !text-white dark:bg-white dark:!text-black text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
              onClick={async () => {
                if (isSubmitting) return;
                setIsSubmitting(true);
                try {
                  const txs = [] as any[];
                  // Ensure registration (best-effort; ignore failures if already registered)
                  for (const p of registerPayloads(asset === "oGold" ? "oGOLD" : "oSILVER")) {
                    txs.push(signAndSubmitTransaction({ sender: String(account.address), data: p as any }).catch(() => null));
                  }
                  await Promise.all(txs);

                  const amt = pay; // always use what the user is paying
                  const amt6 = amt ? String(Math.floor(parseFloat(amt) * 1_000_000)) : "0";
                  const data = payIsUSDC
                    ? buyTokenPayload(asset === "oGold" ? "oGOLD" : "oSILVER", amt6)
                    : sellTokenPayload(asset === "oGold" ? "oGOLD" : "oSILVER", amt6);

                  const res = await signAndSubmitTransaction({ sender: String(account.address), data: data as any });
                  console.log("swap tx:", res);
                  // Refresh balance after swap
                  setTimeout(async () => {
                    try {
                      const coinType = payIsUSDC ? coinTypeFor("USDC") : coinTypeFor(asset === "oGold" ? "oGOLD" : "oSILVER");
                      const val = await fetchBalance(String(account.address!), coinType);
                      setBalance((val / 1_000_000).toString());
                    } catch {}
                  }, 1000);
                } catch (e) {
                  console.error(e);
                  alert("Swap failed. Check console.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {isSubmitting ? (payIsUSDC ? `Swapping USDC → ${asset}...` : `Swapping ${asset} → USDC...`) : (payIsUSDC ? `Swap USDC → ${asset}` : `Swap ${asset} → USDC`)}
            </button>
          ) : (
            <WalletSelector />
          )}
        </div>
      </div>
    </div>
  );
}


