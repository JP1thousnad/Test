import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface EarningsRecord {
  period: string;
  reportDate: string;
  revenue: number;
  eps: number;
  epsEstimate: number | null;
  beat: boolean | null;
  surprise?: number | null;
}

interface EarningsTableProps {
  data: EarningsRecord[];
}

export function EarningsTable({ data }: EarningsTableProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <Card data-testid="earnings-table">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Earnings History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Report Date</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">EPS</TableHead>
                <TableHead className="text-right">Estimate</TableHead>
                <TableHead className="text-right">Surprise</TableHead>
                <TableHead className="text-center">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((record, index) => (
                <TableRow key={index} data-testid={`earnings-row-${index}`}>
                  <TableCell className="font-medium">{record.period}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.reportDate}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(record.revenue)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${record.eps.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {record.epsEstimate !== null
                      ? `$${record.epsEstimate.toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${
                      record.surprise != null && record.surprise > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : record.surprise != null && record.surprise < 0
                        ? "text-red-600 dark:text-red-400"
                        : ""
                    }`}
                  >
                    {record.surprise != null
                      ? `${record.surprise >= 0 ? "+" : ""}${record.surprise.toFixed(1)}%`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {record.beat !== null ? (
                      <Badge
                        variant={record.beat ? "default" : "destructive"}
                        className={record.beat ? "bg-emerald-600" : ""}
                      >
                        {record.beat ? "Beat" : "Miss"}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
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
