import { KeyHighlights } from "../KeyHighlights";

export default function KeyHighlightsExample() {
  return (
    <div className="p-4 max-w-md">
      <KeyHighlights
        highlights={[
          { type: "beat", text: "EPS beat analyst estimates by 4.2%" },
          { type: "beat", text: "Revenue exceeded expectations" },
          { type: "growth", text: "Strong 8.1% YoY revenue growth" },
          { type: "margin", text: "Net margin improved to 25.3%" },
          { type: "info", text: "Management tone: Bullish outlook" },
        ]}
      />
    </div>
  );
}
