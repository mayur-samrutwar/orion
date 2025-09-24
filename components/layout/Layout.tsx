import React from "react";
import { Navbar } from "./Navbar";

type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}


