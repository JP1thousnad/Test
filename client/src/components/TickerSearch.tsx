import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TickerSearchProps {
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
}

export function TickerSearch({ onSearch, isLoading = false }: TickerSearchProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim().toUpperCase());
    }
  };

  const handleClear = () => {
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Enter stock ticker (e.g., AAPL)"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          className="pl-10 pr-10 font-mono"
          data-testid="input-ticker-search"
          autoFocus
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            data-testid="button-clear-search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" disabled={!value.trim() || isLoading} data-testid="button-search">
        {isLoading ? "Loading..." : "Analyze"}
      </Button>
    </form>
  );
}
