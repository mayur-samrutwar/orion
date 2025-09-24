import React, { useMemo, useState, useEffect } from "react";
import { useMetalPrices } from "@/hooks/useMetalPrices";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";

type Asset = "oGold" | "oSilver";

export default function TradePage() {
  const { data } = useMetalPrices();
  const { account } = useWallet();

  const [asset, setAsset] = useState<Asset>("oGold");
  const [pay, setPay] = useState<string>("");
  const [receive, setReceive] = useState<string>("");
  const [payIsUSDC, setPayIsUSDC] = useState<boolean>(true); // if false, paying in grams

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
      <div className="w-full max-w-lg rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Trade</div>
          <div>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value as Asset)}
              className="h-9 rounded-xl bg-white/70 dark:bg-black/40 ring-1 ring-black/10 dark:ring-white/15 px-3 text-sm"
            >
              <option value="oGold">oGold</option>
              <option value="oSilver">oSilver</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/15 p-4">
            <div className="text-xs text-black/60 dark:text-white/60 mb-2">Pay</div>
            <div className="flex items-center justify-between">
              <input value={pay} onChange={(e) => setPay(e.target.value)} className="bg-transparent outline-none text-2xl font-semibold w-full" placeholder="0" />
              <div className="text-sm">{payIsUSDC ? "USDC" : asset}</div>
            </div>
          </div>

          <div className="text-center text-xs">
            <button onClick={onSwitchSides} className="h-8 px-3 rounded-full ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/10">↕</button>
          </div>

          <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/15 p-4">
            <div className="text-xs text-black/60 dark:text-white/60 mb-2">Receive</div>
            <div className="flex items-center justify-between">
              <input value={receive} onChange={(e) => onReceiveChange(e.target.value)} className="bg-transparent outline-none text-2xl font-semibold w-full" placeholder="0" />
              <div className="text-sm">{payIsUSDC ? asset : "USDC"}</div>
            </div>
          </div>

          <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/15 p-4 text-xs text-black/70 dark:text-white/70">
            <div className="flex items-center justify-between">
              <span>Rate</span>
              <span>{price > 0 ? `1 ${asset} = $${price.toFixed(2)} USD` : "--"}</span>
            </div>
          </div>

          {account ? (
            <button className="w-full h-11 rounded-full bg-black !text-white dark:bg-white dark:!text-black text-sm font-medium">
              {payIsUSDC ? `Swap USDC → ${asset}` : `Swap ${asset} → USDC`}
            </button>
          ) : (
            <WalletSelector>
              <button className="w-full h-11 rounded-full bg-black !text-white dark:bg-white dark:!text-black text-sm font-medium">Connect Wallet</button>
            </WalletSelector>
          )}
        </div>
      </div>
    </div>
  );
}


