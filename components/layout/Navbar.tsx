import Link from "next/link";
import React, { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";

export function Navbar() {
  const { account, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  const addressString = account?.address
    ? typeof (account as any).address === "string"
      ? (account as any).address
      : (account as any).address?.toString?.() ?? ""
    : "";
  const shortAddress = addressString
    ? `${addressString.slice(0, 6)}...${addressString.slice(-4)}`
    : "";

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur bg-white/70 dark:bg-black/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link className="text-xl font-semibold tracking-tight" href="/">Orion</Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link className="hover:text-black/60 dark:hover:text-white/70" href="/trade">Trade</Link>
          <Link className="hover:text-black/60 dark:hover:text-white/70" href="/proof">Proof of Reserve</Link>
        </nav>

        <div className="relative">
          {!account ? (
            <WalletSelector>
              <button className="h-10 px-4 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium hover:opacity-90 transition">
                Connect
              </button>
            </WalletSelector>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="h-10 px-4 rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-black/50 backdrop-blur text-sm font-medium"
              >
                {shortAddress}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900 shadow-lg py-1">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    My profile
                  </Link>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                    onClick={() => {
                      setMenuOpen(false);
                      disconnect();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="md:hidden">
        <div className="px-4 py-3 flex items-center justify-center gap-6 text-sm">
          <Link className="hover:text-black/60 dark:hover:text-white/70" href="/trade">Trade</Link>
          <Link className="hover:text-black/60 dark:hover:text-white/70" href="/proof">Proof of Reserve</Link>
        </div>
      </div>
    </header>
  );
}


