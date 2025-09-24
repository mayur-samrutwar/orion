import React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className={`${geistSans.className} ${geistMono.className} font-sans min-h-screen bg-white text-black dark:bg-black dark:text-white`}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <Footer />
    </div>
  );
}


