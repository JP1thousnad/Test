import { useState } from "react";
import { PeerComparison } from "../PeerComparison";

export default function PeerComparisonExample() {
  const [peers, setPeers] = useState([
    { ticker: "AAPL", name: "Apple Inc.", marketCap: 2.89e12, pe: 29.5, revenue: 383e9, netMargin: 25.3, growth: 8.1 },
    { ticker: "MSFT", name: "Microsoft Corp.", marketCap: 2.95e12, pe: 35.2, revenue: 211e9, netMargin: 36.5, growth: 12.4 },
    { ticker: "GOOGL", name: "Alphabet Inc.", marketCap: 1.82e12, pe: 24.8, revenue: 307e9, netMargin: 23.8, growth: 9.2 },
  ]);

  return (
    <div className="p-4">
      <PeerComparison
        targetTicker="AAPL"
        peers={peers}
        onAddPeer={(ticker) => {
          console.log("Add peer:", ticker);
          setPeers([...peers, {
            ticker,
            name: `${ticker} Corp.`,
            marketCap: 500e9,
            pe: 22.0,
            revenue: 100e9,
            netMargin: 15.0,
            growth: 5.0,
          }]);
        }}
        onRemovePeer={(ticker) => {
          console.log("Remove peer:", ticker);
          setPeers(peers.filter(p => p.ticker !== ticker));
        }}
      />
    </div>
  );
}
