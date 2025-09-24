import Head from "next/head";
import React from "react";

type SeoProps = {
  title?: string;
  description?: string;
};

export function Seo({ title, description }: SeoProps) {
  const fullTitle = title ? `${title} · Orion` : "Orion";
  const desc = description || "Trade tokenized gold and silver on Aptos with Orion.";
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta name="twitter:card" content="summary" />
    </Head>
  );
}


