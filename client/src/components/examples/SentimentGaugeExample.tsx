import { SentimentGauge } from "../SentimentGauge";

export default function SentimentGaugeExample() {
  return (
    <div className="p-4 max-w-md">
      <SentimentGauge
        score={0.45}
        label="Bullish"
        positive={0.58}
        negative={0.12}
        neutral={0.30}
      />
    </div>
  );
}
