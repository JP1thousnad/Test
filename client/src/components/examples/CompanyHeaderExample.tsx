import { CompanyHeader } from "../CompanyHeader";

export default function CompanyHeaderExample() {
  return (
    <div className="p-4">
      <CompanyHeader
        ticker="AAPL"
        companyName="Apple Inc."
        sector="Technology"
        industry="Consumer Electronics"
        currentPrice={185.42}
        priceChange={2.35}
        priceChangePercent={1.28}
        marketCap={2.89e12}
        onRefresh={() => console.log("Refresh clicked")}
        onExport={() => console.log("Export clicked")}
      />
    </div>
  );
}
