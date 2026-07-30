"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, BookOpen, ChevronRight, Download } from "lucide-react";
import { exportToCSV, formatTradeForExport } from "@/lib/export-csv";
import { MOCK_TRADES } from "@/lib/data/mock-trades";
import { formatCurrency, formatRMultiple } from "@/lib/utils";

export default function TradesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [marketFilter, setMarketFilter] = useState("ALL");
  const [outcomeFilter, setOutcomeFilter] = useState("ALL");

  const filteredTrades = MOCK_TRADES.filter((trade) => {
    const matchesSearch =
      trade.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.setup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.market.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMarket = marketFilter === "ALL" || trade.market === marketFilter;
    const matchesOutcome = outcomeFilter === "ALL" || trade.outcome === outcomeFilter;
    return matchesSearch && matchesMarket && matchesOutcome;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" /> Trade Journal
          </h1>
          <p className="text-xs text-muted mt-0.5">All logged trades across markets.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => exportToCSV(filteredTrades.map(formatTradeForExport), "trade-journal")}
            className="btn-secondary"
            title="Export filtered trades as CSV"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <Link href="/trades/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Log Trade
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dim" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search instrument, setup..."
            className="input-field !pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} className="input-field !w-auto">
            <option value="ALL">All Markets</option>
            <option value="Gold">Gold</option>
            <option value="Forex">Forex</option>
            <option value="Crypto">Crypto</option>
            <option value="Nifty Options">Nifty Options</option>
            <option value="Stocks">Stocks</option>
          </select>
          <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)} className="input-field !w-auto">
            <option value="ALL">All</option>
            <option value="WIN">Win</option>
            <option value="LOSS">Loss</option>
            <option value="BREAKEVEN">BE</option>
          </select>
        </div>
      </div>

      {/* Mobile: Card List */}
      <div className="space-y-2 sm:hidden">
        {filteredTrades.map((trade) => (
          <div key={trade.id} className="card p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-clean">{trade.instrument}</span>
                <span className={`badge ${trade.outcome === "WIN" ? "badge-profit" : trade.outcome === "LOSS" ? "badge-loss" : "badge-neutral"}`}>
                  {trade.outcome}
                </span>
              </div>
              <span className={`font-mono text-sm font-bold ${trade.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                {formatCurrency(trade.pnl)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted">{trade.date} · {trade.session}</span>
              <span className={`font-mono font-semibold ${trade.rMultiple >= 0 ? "text-profit" : "text-loss"}`}>
                {formatRMultiple(trade.rMultiple)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-dim truncate pr-4">{trade.setup}</span>
              <span className="badge badge-neutral text-[9px] shrink-0">{trade.market}</span>
            </div>
            <div className="text-[10px] text-dim font-mono flex items-center gap-2">
              <span className="text-soft">{trade.actualEntry}</span>
              <span>→</span>
              <span className={trade.pnl >= 0 ? "text-profit" : "text-loss"}>{trade.actualExit}</span>
              <span className="text-dim ml-auto">SL: {trade.stopLoss}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block card p-4 sm:p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-dim text-[10px] uppercase tracking-wider">
                <th className="py-2.5 pr-3 font-semibold">Date</th>
                <th className="py-2.5 pr-3 font-semibold">Market</th>
                <th className="py-2.5 pr-3 font-semibold">Instrument</th>
                <th className="py-2.5 pr-3 font-semibold">Session</th>
                <th className="py-2.5 pr-3 font-semibold">Setup</th>
                <th className="py-2.5 pr-3 font-semibold">Entry / SL / TP</th>
                <th className="py-2.5 pr-3 font-semibold">Outcome</th>
                <th className="py-2.5 pr-3 text-right font-semibold">R-Mult</th>
                <th className="py-2.5 text-right font-semibold">PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-elevated/40 transition-colors">
                  <td className="py-3 pr-3 text-soft">{trade.date}</td>
                  <td className="py-3 pr-3"><span className="badge badge-neutral">{trade.market}</span></td>
                  <td className="py-3 pr-3 font-mono font-bold text-clean">{trade.instrument}</td>
                  <td className="py-3 pr-3 text-muted">{trade.session}</td>
                  <td className="py-3 pr-3 text-subtle max-w-[160px] truncate">{trade.setup}</td>
                  <td className="py-3 pr-3 font-mono text-[11px]">
                    <span className="text-soft">{trade.actualEntry}</span> / <span className="text-loss">{trade.stopLoss}</span> / <span className="text-profit">{trade.target}</span>
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`badge ${trade.outcome === "WIN" ? "badge-profit" : trade.outcome === "LOSS" ? "badge-loss" : "badge-neutral"}`}>
                      {trade.outcome}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right font-mono font-semibold">
                    <span className={trade.rMultiple >= 0 ? "text-profit" : "text-loss"}>{formatRMultiple(trade.rMultiple)}</span>
                  </td>
                  <td className="py-3 text-right font-mono font-bold">
                    <span className={trade.pnl >= 0 ? "text-profit" : "text-loss"}>{formatCurrency(trade.pnl)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
