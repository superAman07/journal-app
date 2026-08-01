"use client";

import { Search, Filter, Calendar, RotateCcw } from "lucide-react";
import { MarketType, TradeOutcome } from "@/types";

export interface TradeFilterState {
  search: string;
  market: string;
  outcome: string;
  month: string; // "YYYY-MM" or "ALL"
}

const MARKETS: string[] = [
  "ALL",
  "Nifty Options",
  "BankNifty Options",
  "Sensex Options",
  "Stock Options",
  "Crypto Options",
  "Forex",
  "Gold",
  "Silver",
  "Crypto",
  "Stocks",
  "Futures",
];

const OUTCOMES: string[] = ["ALL", "WIN", "LOSS", "BREAKEVEN"];

export function TradeFilters({
  filters,
  onChange,
  availableMonths,
}: {
  filters: TradeFilterState;
  onChange: (filters: TradeFilterState) => void;
  availableMonths: { value: string; label: string }[];
}) {
  const isFiltered =
    filters.search !== "" || filters.market !== "ALL" || filters.outcome !== "ALL" || filters.month !== "ALL";

  const handleReset = () => {
    onChange({
      search: "",
      market: "ALL",
      outcome: "ALL",
      month: "ALL",
    });
  };

  return (
    <div className="card p-3 sm:p-4 space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dim" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search symbol (e.g. NIFTY, XAUUSD)..."
            className="w-full bg-surface border border-border/20 rounded-xl pl-9 pr-3 py-2 text-xs text-clean focus:outline-none focus:border-accent/40 transition-colors"
          />
        </div>

        {/* Month Selector */}
        <div className="relative min-w-36">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dim pointer-events-none" />
          <select
            value={filters.month}
            onChange={(e) => onChange({ ...filters, month: e.target.value })}
            className="w-full bg-surface border border-border/20 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-soft focus:outline-none focus:border-accent/40 transition-colors cursor-pointer appearance-none"
          >
            <option value="ALL">All Months</option>
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Market Filter */}
        <div className="relative min-w-36">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dim pointer-events-none" />
          <select
            value={filters.market}
            onChange={(e) => onChange({ ...filters, market: e.target.value })}
            className="w-full bg-surface border border-border/20 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-soft focus:outline-none focus:border-accent/40 transition-colors cursor-pointer appearance-none"
          >
            {MARKETS.map((m) => (
              <option key={m} value={m}>
                {m === "ALL" ? "All Markets" : m}
              </option>
            ))}
          </select>
        </div>

        {/* Outcome Chips */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border/20">
          {OUTCOMES.map((o) => (
            <button
              key={o}
              onClick={() => onChange({ ...filters, outcome: o })}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                filters.outcome === o
                  ? o === "WIN"
                    ? "bg-profit/15 text-profit"
                    : o === "LOSS"
                    ? "bg-loss/15 text-loss"
                    : "bg-accent-muted text-accent"
                  : "text-dim hover:text-soft"
              }`}
            >
              {o}
            </button>
          ))}
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            onClick={handleReset}
            className="px-2.5 py-2 rounded-xl bg-elevated hover:bg-surface text-dim hover:text-clean text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reset Filters"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
