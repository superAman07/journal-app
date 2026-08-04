import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Plus, TrendingUp } from "lucide-react";
import { getUserTrades } from "@/lib/actions/trade-actions";

export const metadata: Metadata = {
  title: "Performance Analytics — Trading OS",
  description: "Equity curve, win/loss distribution, RR analysis, and session-level P&L breakdowns.",
};

export default async function AnalyticsPage() {
  const trades = await getUserTrades();

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" /> Performance Analytics
          </h1>
          <p className="text-xs text-muted mt-0.5">Equity curve, distributions, and session breakdowns.</p>
        </div>

        <div className="card p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-clean">No Analytics Data Available</h3>
            <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
              Your cumulative equity growth curve, R-multiple distributions, and session-level PnL breakdowns will generate automatically once you record trades.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/trades/new" className="btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Log Your First Trade
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const wins = trades.filter((t) => t.outcome === "WIN");
  const losses = trades.filter((t) => t.outcome === "LOSS");
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" /> Performance Analytics
        </h1>
        <p className="text-xs text-muted mt-0.5">Equity curve, distributions, and session breakdowns.</p>
      </div>

      <div className="card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-clean flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" /> Realized PnL Overview
          </h2>
          <span className={`stat-value text-base! ${totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
            ${totalPnL.toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="card-elevated p-4 rounded-xl">
            <span className="label">Total Trades</span>
            <div className="stat-value text-xl! text-clean">{trades.length}</div>
          </div>
          <div className="card-elevated p-4 rounded-xl">
            <span className="label">Winning Trades</span>
            <div className="stat-value text-xl! text-profit">{wins.length}</div>
          </div>
          <div className="card-elevated p-4 rounded-xl">
            <span className="label">Losing Trades</span>
            <div className="stat-value text-xl! text-loss">{losses.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
