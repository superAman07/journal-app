"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, BookOpen, ChevronDown, ChevronRight, Edit2, Eye, Calendar, TrendingUp } from "lucide-react";
import { formatCurrency, formatRMultiple } from "@/lib/utils";
import { DeleteTradeButton } from "@/components/trades/delete-trade-button";
import { TradeDetailModal } from "@/components/trades/trade-detail-modal";
import { EditTradeModal } from "@/components/trades/edit-trade-modal";
import { TradeFilters, TradeFilterState } from "@/components/trades/trade-filters";

function formatIndianCurrency(val: number) {
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isIndianMarket(market: string) {
  return ["Nifty Options", "BankNifty Options", "Sensex Options"].includes(market);
}

export function TradesView({ initialTrades }: { initialTrades: any[] }) {
  const [selectedTradeForDetail, setSelectedTradeForDetail] = useState<any | null>(null);
  const [selectedTradeForEdit, setSelectedTradeForEdit] = useState<any | null>(null);
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

  const [filters, setFilters] = useState<TradeFilterState>({
    search: "",
    market: "ALL",
    outcome: "ALL",
    month: "ALL",
  });

  // Extract available unique months from trades (e.g., "2026-08")
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    initialTrades.forEach((t) => {
      if (t.date) {
        const d = new Date(t.date);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        set.add(monthKey);
      }
    });

    return Array.from(set)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const [year, month] = key.split("-");
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
        const label = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        return { value: key, label };
      });
  }, [initialTrades]);

  // Apply search, market, outcome, and month filters
  const filteredTrades = useMemo(() => {
    return initialTrades.filter((trade) => {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const inst = (trade.instrument || "").toLowerCase();
        const setup = (trade.setup || "").toLowerCase();
        if (!inst.includes(query) && !setup.includes(query)) return false;
      }

      if (filters.market !== "ALL" && trade.market !== filters.market) return false;
      if (filters.outcome !== "ALL" && trade.outcome !== filters.outcome) return false;

      if (filters.month !== "ALL") {
        const d = new Date(trade.date);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (monthKey !== filters.month) return false;
      }

      return true;
    });
  }, [initialTrades, filters]);

  // Group filtered trades by Month ("YYYY-MM")
  const groupedByMonth = useMemo(() => {
    const groups: Record<
      string,
      {
        monthLabel: string;
        trades: any[];
        totalPnL: number;
        winCount: number;
        winRate: number;
      }
    > = {};

    filteredTrades.forEach((trade) => {
      const d = new Date(trade.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      if (!groups[key]) {
        groups[key] = {
          monthLabel: label,
          trades: [],
          totalPnL: 0,
          winCount: 0,
          winRate: 0,
        };
      }

      groups[key].trades.push(trade);
      groups[key].totalPnL += Number(trade.pnl || 0);
      if (trade.outcome === "WIN") groups[key].winCount++;
    });

    Object.keys(groups).forEach((key) => {
      const total = groups[key].trades.length;
      groups[key].winRate = total > 0 ? (groups[key].winCount / total) * 100 : 0;
    });

    return groups;
  }, [filteredTrades]);

  const sortedMonthKeys = useMemo(() => {
    return Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));
  }, [groupedByMonth]);

  const toggleMonthCollapse = (monthKey: string) => {
    setCollapsedMonths((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" /> Trade Journal
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Review detailed execution logs, monthly statistics, and trade psychology.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href="/trades/new" className="btn-primary cursor-pointer">
            <Plus className="h-4 w-4" /> Log Trade
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      {initialTrades.length > 0 && (
        <TradeFilters filters={filters} onChange={setFilters} availableMonths={availableMonths} />
      )}

      {/* Main Trades List or Zero State */}
      {initialTrades.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold">Your Trade Journal is Empty</h3>
            <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
              Start building your quantitative trading history by logging your first trade entry. All metrics, win rates, and setup insights will calculate automatically.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/trades/new" className="btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Log Your First Trade
            </Link>
          </div>
        </div>
      ) : filteredTrades.length === 0 ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-soft">No trades match your search filters.</p>
          <button
            onClick={() => setFilters({ search: "", market: "ALL", outcome: "ALL", month: "ALL" })}
            className="btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedMonthKeys.map((monthKey) => {
            const group = groupedByMonth[monthKey];
            const isCollapsed = Boolean(collapsedMonths[monthKey]);

            return (
              <div key={monthKey} className="space-y-3">
                {/* Month Group Header */}
                <div
                  onClick={() => toggleMonthCollapse(monthKey)}
                  className="card p-3 sm:px-4 flex items-center justify-between cursor-pointer hover:border-accent/30 transition-all select-none"
                >
                  <div className="flex items-center gap-2.5">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-dim" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-accent" />
                    )}
                    <span className="text-sm font-bold text-clean">{group.monthLabel}</span>
                    <span className="text-xs text-dim bg-elevated px-2 py-0.5 rounded-full font-mono font-medium">
                      {group.trades.length} trades
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="hidden sm:flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-dim">Win Rate:</span>
                      <span className="font-mono font-bold text-clean">{group.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-dim">Net PnL:</span>
                      <span className={`font-mono font-bold ${group.totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
                        {formatCurrency(group.totalPnL)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trades under this Month */}
                {!isCollapsed && (
                  <div className="space-y-2">
                    {/* Mobile View */}
                    <div className="space-y-2 sm:hidden">
                      {group.trades.map((trade) => {
                        const pnlNum = Number(trade.pnl);
                        const rrNum = Number(trade.actualRR);
                        const isInd = isIndianMarket(trade.market);

                        return (
                          <div
                            key={trade.id}
                            onClick={() => setSelectedTradeForDetail(trade)}
                            className="card p-4 space-y-3 cursor-pointer hover:border-accent/40 active:scale-[0.99] transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-clean">{trade.instrument}</span>
                                <span
                                  className={`badge ${
                                    trade.outcome === "WIN"
                                      ? "badge-profit"
                                      : trade.outcome === "LOSS"
                                      ? "badge-loss"
                                      : "badge-neutral"
                                  }`}
                                >
                                  {trade.outcome}
                                </span>
                              </div>
                              <span className={`font-mono text-sm font-bold ${pnlNum >= 0 ? "text-profit" : "text-loss"}`}>
                                {isInd ? formatIndianCurrency(pnlNum) : formatCurrency(pnlNum)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted">
                                {new Date(trade.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {trade.session}
                              </span>
                              <span className={`font-mono font-semibold ${rrNum >= 0 ? "text-profit" : "text-loss"}`}>
                                {formatRMultiple(rrNum)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-border/20">
                              <span className="text-dim text-[11px] truncate pr-2">{trade.setup}</span>
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setSelectedTradeForDetail(trade)}
                                  className="h-7 w-7 rounded-lg flex items-center justify-center text-dim hover:text-accent hover:bg-accent-muted transition-colors cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setSelectedTradeForEdit(trade)}
                                  className="h-7 w-7 rounded-lg flex items-center justify-center text-dim hover:text-accent hover:bg-accent-muted transition-colors cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <DeleteTradeButton tradeId={trade.id} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden sm:block card p-4">
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
                              <th className="py-2.5 pr-3 text-right font-semibold">PnL</th>
                              <th className="py-2.5 text-right font-semibold w-24">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {group.trades.map((trade) => {
                              const entryNum = Number(trade.actualEntry);
                              const slNum = Number(trade.stopLoss);
                              const tpNum = Number(trade.target);
                              const pnlNum = Number(trade.pnl);
                              const rrNum = Number(trade.actualRR);
                              const isInd = isIndianMarket(trade.market);

                              return (
                                <tr
                                  key={trade.id}
                                  onClick={() => setSelectedTradeForDetail(trade)}
                                  className="hover:bg-elevated/50 transition-colors group cursor-pointer"
                                >
                                  <td className="py-3 pr-3 text-soft whitespace-nowrap">
                                    {new Date(trade.date).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </td>
                                  <td className="py-3 pr-3">
                                    <span className="badge badge-neutral">{trade.market}</span>
                                  </td>
                                  <td className="py-3 pr-3 font-mono font-bold text-clean">{trade.instrument}</td>
                                  <td className="py-3 pr-3 text-muted">{trade.session}</td>
                                  <td className="py-3 pr-3 text-subtle max-w-40 truncate">{trade.setup}</td>
                                  <td className="py-3 pr-3 font-mono text-[11px] whitespace-nowrap">
                                    <span className="text-soft">{entryNum}</span> /{" "}
                                    <span className="text-loss">{slNum}</span> /{" "}
                                    <span className="text-profit">{tpNum}</span>
                                  </td>
                                  <td className="py-3 pr-3">
                                    <span
                                      className={`badge ${
                                        trade.outcome === "WIN"
                                          ? "badge-profit"
                                          : trade.outcome === "LOSS"
                                          ? "badge-loss"
                                          : "badge-neutral"
                                      }`}
                                    >
                                      {trade.outcome}
                                    </span>
                                  </td>
                                  <td className="py-3 pr-3 text-right font-mono font-semibold whitespace-nowrap">
                                    <span className={rrNum >= 0 ? "text-profit" : "text-loss"}>
                                      {formatRMultiple(rrNum)}
                                    </span>
                                  </td>
                                  <td className="py-3 pr-3 text-right font-mono font-bold whitespace-nowrap">
                                    <span className={pnlNum >= 0 ? "text-profit" : "text-loss"}>
                                      {isInd ? formatIndianCurrency(pnlNum) : formatCurrency(pnlNum)}
                                    </span>
                                  </td>
                                  <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => setSelectedTradeForDetail(trade)}
                                        className="h-7 w-7 rounded-lg flex items-center justify-center text-dim hover:text-accent hover:bg-accent-muted transition-colors cursor-pointer"
                                        title="View Details"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setSelectedTradeForEdit(trade)}
                                        className="h-7 w-7 rounded-lg flex items-center justify-center text-dim hover:text-accent hover:bg-accent-muted transition-colors cursor-pointer"
                                        title="Edit Trade"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      <DeleteTradeButton tradeId={trade.id} />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Trade Detail Modal */}
      {selectedTradeForDetail && (
        <TradeDetailModal
          trade={selectedTradeForDetail}
          onClose={() => setSelectedTradeForDetail(null)}
          onEdit={() => {
            const tr = selectedTradeForDetail;
            setSelectedTradeForDetail(null);
            setSelectedTradeForEdit(tr);
          }}
        />
      )}

      {/* Edit Trade Modal */}
      {selectedTradeForEdit && (
        <EditTradeModal
          trade={selectedTradeForEdit}
          onClose={() => setSelectedTradeForEdit(null)}
        />
      )}
    </div>
  );
}
