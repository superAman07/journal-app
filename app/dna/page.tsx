import type { Metadata } from "next";
import Link from "next/link";
import { Dna, Plus, Sparkles } from "lucide-react";
import { getUserTrades } from "@/lib/actions/trade-actions";

export const metadata: Metadata = {
  title: "Trading DNA — Trading OS",
  description: "Quantitative fingerprint of your trading behavior — best markets, setups, and execution patterns.",
};

export default async function DNAPage() {
  const trades = await getUserTrades();

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <Dna className="h-5 w-5 text-accent" /> Trading DNA
          </h1>
          <p className="text-xs text-muted mt-0.5">Quantitative fingerprint of your trading behavior.</p>
        </div>

        <div className="card p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-ai-muted text-ai flex items-center justify-center">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-clean">Trading DNA Requires Trade Logs</h3>
            <p className="text-xs text-muted leading-relaxed">
              Your DNA fingerprint automatically identifies your highest expectancy setups, peak sessions, and emotional leaks. Log at least 5 trades to unlock your personalized analysis.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/trades/new" className="btn-primary text-xs cursor-pointer">
              <Plus className="h-4 w-4" /> Log Your First Trade
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate real DNA metrics from user trades
  const wins = trades.filter((t) => t.outcome === "WIN");
  const losses = trades.filter((t) => t.outcome === "LOSS");

  const marketCounts = trades.reduce((acc, t) => {
    acc[t.market] = (acc[t.market] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topMarket = Object.entries(marketCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
          <Dna className="h-5 w-5 text-accent" /> Trading DNA
        </h1>
        <p className="text-xs text-muted mt-0.5">Quantitative fingerprint of your trading behavior.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-5 space-y-3">
          <span className="badge badge-profit">Peak Strength</span>
          <div>
            <span className="text-[11px] text-dim font-medium">Most Traded Market</span>
            <p className="text-base sm:text-lg font-bold text-clean mt-0.5">{topMarket}</p>
          </div>
          <p className="text-xs text-muted leading-relaxed">{trades.length} total logged trades in your database.</p>
        </div>

        <div className="card p-5 space-y-3">
          <span className="badge badge-accent">Win Ratio</span>
          <div>
            <span className="text-[11px] text-dim font-medium">Winning Trades</span>
            <p className="text-base sm:text-lg font-bold text-profit mt-0.5">{wins.length} Wins</p>
          </div>
          <p className="text-xs text-muted leading-relaxed">Out of {trades.length} total recorded entries.</p>
        </div>

        <div className="card p-5 space-y-3">
          <span className="badge badge-loss">Risk Warning</span>
          <div>
            <span className="text-[11px] text-dim font-medium">Losing Trades</span>
            <p className="text-base sm:text-lg font-bold text-loss mt-0.5">{losses.length} Losses</p>
          </div>
          <p className="text-xs text-muted leading-relaxed">Review exit reasons to minimize drawdown.</p>
        </div>
      </div>
    </div>
  );
}
