"use client";

/**
 * Export an array of objects as a CSV file download.
 * Automatically generates headers from object keys.
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string = "trading-os-export"
) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);

  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          const str = val === null || val === undefined ? "" : String(val);
          // Escape commas and quotes
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    ),
  ];

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Formats a trade object for CSV export with flattened fields.
 */
export function formatTradeForExport(trade: {
  date: string;
  market: string;
  instrument: string;
  session: string;
  setup: string;
  bias: string;
  outcome: string;
  pnl: number;
  rMultiple: number;
  actualEntry: number | string;
  actualExit: number | string;
  stopLoss: number | string;
  target: number | string;
  rulesFollowed?: boolean;
}) {
  return {
    Date: trade.date,
    Market: trade.market,
    Instrument: trade.instrument,
    Session: trade.session,
    Setup: trade.setup,
    Bias: trade.bias,
    Outcome: trade.outcome,
    "PnL ($)": trade.pnl,
    "R-Multiple": trade.rMultiple,
    Entry: trade.actualEntry,
    Exit: trade.actualExit,
    "Stop Loss": trade.stopLoss,
    Target: trade.target,
    "Rules Followed": trade.rulesFollowed ? "Yes" : "No",
  };
}
