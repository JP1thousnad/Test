import { TickerSearch } from "../TickerSearch";

export default function TickerSearchExample() {
  return (
    <div className="p-4 flex justify-center">
      <TickerSearch onSearch={(ticker) => console.log("Search:", ticker)} />
    </div>
  );
}
