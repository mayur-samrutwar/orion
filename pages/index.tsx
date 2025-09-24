import { PriceTicker } from "@/components/ticker/PriceTicker";
import { Seo } from "@/components/layout/Seo";
import { MarketOverview } from "@/components/market/MarketOverview";
import { ExploreAssets } from "@/components/market/ExploreAssets";

export default function Home() {
  return (
    <div>
      <Seo title="Home" description="Discover and trade tokenized metals on Orion." />
      <PriceTicker />
      <div className="w-full space-y-10">
        <MarketOverview />
        <ExploreAssets />
      </div>
      
    </div>
  );
}
