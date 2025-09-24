import { PriceTicker } from "@/components/ticker/PriceTicker";
import { MarketOverview } from "@/components/market/MarketOverview";
import { ExploreAssets } from "@/components/market/ExploreAssets";

export default function Home() {
  return (
    <div>
      <PriceTicker />
      <div className="w-full space-y-10">
        <MarketOverview />
        <ExploreAssets />
      </div>
      
    </div>
  );
}
