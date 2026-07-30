import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange, Plus } from "lucide-react";
import { getUserTrades } from "@/lib/actions/trade-actions";

export const metadata: Metadata = {
  title: "Performance Reviews — Trading OS",
  description: "Weekly, monthly, and annual execution audits.",
};

export default async function ReviewsPage() {
  const trades = await getUserTrades();

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-accent" /> Performance Reviews
          </h1>
          <p className="text-xs text-muted mt-0.5">Weekly, monthly, and annual execution audits.</p>
        </div>

        <div className="card p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <CalendarRange className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-clean">No Review Periods Completed</h3>
            <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
              Weekly and monthly execution audits compile your total realized profit, setup expectancy, and risk compliance over time. Log trades to view your periodic audit cards.
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
  const netPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winRate = trades.length > 0 ? ((wins.length / trades.length) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-accent" /> Performance Reviews
        </h1>
        <p className="text-xs text-muted mt-0.5">Weekly, monthly, and annual execution audits.</p>
      </div>

      <div className="card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
          <div>
            <h2 className="text-base font-bold text-clean">Current Audit Summary</h2>
            <span className="text-xs text-muted">{trades.length} Total Trades Recorded</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card-elevated p-4 rounded-xl">
            <span className="label">Realized PnL</span>
            <div className={`stat-value text-xl! ${netPnL >= 0 ? "text-profit" : "text-loss"}`}>
              ${netPnL.toLocaleString()}
            </div>
          </div>
          <div className="card-elevated p-4 rounded-xl">
            <span className="label">Win Rate</span>
            <div className="stat-value text-xl! text-clean">{winRate}%</div>
          </div>
          <div className="card-elevated p-4 rounded-xl">
            <span className="label">Logged Trades</span>
            <div className="text-sm font-bold text-soft">{trades.length} entries</div>
          </div>
        </div>
      </div>
    </div>
  );
}
