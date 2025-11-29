import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PeerData {
  ticker: string;
  name: string;
  marketCap: number;
  pe: number;
  revenue: number;
  netMargin: number;
  growth: number;
}

interface PeerComparisonProps {
  targetTicker: string;
  peers: PeerData[];
  onAddPeer: (ticker: string) => void;
  onRemovePeer: (ticker: string) => void;
}

export function PeerComparison({
  targetTicker,
  peers,
  onAddPeer,
  onRemovePeer,
}: PeerComparisonProps) {
  const [newPeer, setNewPeer] = useState("");

  const handleAddPeer = () => {
    if (newPeer.trim()) {
      onAddPeer(newPeer.trim().toUpperCase());
      setNewPeer("");
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  };

  const getHighlight = (value: number, values: number[], higher: boolean = true) => {
    const best = higher ? Math.max(...values) : Math.min(...values);
    return value === best ? "font-semibold text-emerald-600 dark:text-emerald-400" : "";
  };

  const allPeers = peers;
  const peRatios = allPeers.map((p) => p.pe);
  const margins = allPeers.map((p) => p.netMargin);
  const growths = allPeers.map((p) => p.growth);

  return (
    <Card data-testid="peer-comparison">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 flex-wrap">
        <CardTitle className="text-base">Peer Comparison</CardTitle>
        <div className="flex gap-2">
          <Input
            placeholder="Add ticker..."
            value={newPeer}
            onChange={(e) => setNewPeer(e.target.value.toUpperCase())}
            className="w-28 font-mono"
            data-testid="input-add-peer"
            onKeyDown={(e) => e.key === "Enter" && handleAddPeer()}
          />
          <Button
            size="icon"
            variant="outline"
            onClick={handleAddPeer}
            data-testid="button-add-peer"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {peers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {peers.map((peer) => (
              <Badge
                key={peer.ticker}
                variant={peer.ticker === targetTicker ? "default" : "secondary"}
                className="gap-1"
              >
                {peer.ticker}
                {peer.ticker !== targetTicker && (
                  <button
                    onClick={() => onRemovePeer(peer.ticker)}
                    className="ml-1 hover:text-destructive"
                    data-testid={`button-remove-peer-${peer.ticker}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Market Cap</TableHead>
                <TableHead className="text-right">P/E</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Net Margin</TableHead>
                <TableHead className="text-right">YoY Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPeers.map((peer) => (
                <TableRow
                  key={peer.ticker}
                  className={peer.ticker === targetTicker ? "bg-muted/50" : ""}
                  data-testid={`peer-row-${peer.ticker}`}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold font-mono">{peer.ticker}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-32">
                        {peer.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(peer.marketCap)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${getHighlight(peer.pe, peRatios, false)}`}
                  >
                    {peer.pe.toFixed(1)}x
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(peer.revenue)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${getHighlight(peer.netMargin, margins)}`}
                  >
                    {peer.netMargin.toFixed(1)}%
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${getHighlight(peer.growth, growths)}`}
                  >
                    {peer.growth >= 0 ? "+" : ""}{peer.growth.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
