import type { Metadata } from "next";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { getUserTrades } from "@/lib/actions/trade-actions";
import { formatCurrency, formatRMultiple } from "@/lib/utils";
import { DeleteTradeButton } from "@/components/trades/delete-trade-button";

export const metadata: Metadata = {
  title: "Trade Journal — Trading OS",
  description: "Browse, search, and filter all logged trades across instruments and markets.",
};

export default async function TradesPage() {
  const trades = await getUserTrades();

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" /> Trade Journal
          </h1>
          <p className="text-xs text-muted mt-0.5">All logged trades across markets.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href="/trades/new" className="btn-primary cursor-pointer">
            <Plus className="h-4 w-4" /> Log Trade
          </Link>
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-clean">Your Trade Journal is Empty</h3>
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
      ) : (
        <div className="space-y-4">
          <div className="space-y-2 sm:hidden">
            {trades.map((trade: any) => {
              const pnlNum = Number(trade.pnl);
              const rrNum = Number(trade.actualRR);
              return (
                <div key={trade.id} className="card p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-clean">{trade.instrument}</span>
                      <span className={`badge ${trade.outcome === "WIN" ? "badge-profit" : trade.outcome === "LOSS" ? "badge-loss" : "badge-neutral"}`}>
                        {trade.outcome}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm font-bold ${pnlNum >= 0 ? "text-profit" : "text-loss"}`}>
                        {formatCurrency(pnlNum)}
                      </span>
                      <DeleteTradeButton tradeId={trade.id} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted">{new Date(trade.date).toLocaleDateString()} · {trade.session}</span>
                    <span className={`font-mono font-semibold ${rrNum >= 0 ? "text-profit" : "text-loss"}`}>
                      {formatRMultiple(rrNum)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-dim truncate pr-4">{trade.setup}</span>
                    <span className="badge badge-neutral text-[9px] shrink-0">{trade.market}</span>
                  </div>
                </div>
              );
            })}
          </div>

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
                    <th className="py-2.5 pr-3 text-right font-semibold">PnL</th>
                    <th className="py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trades.map((trade: any) => {
                    const entryNum = Number(trade.actualEntry);
                    const slNum = Number(trade.stopLoss);
                    const tpNum = Number(trade.target);
                    const pnlNum = Number(trade.pnl);
                    const rrNum = Number(trade.actualRR);

                    return (
                      <tr key={trade.id} className="hover:bg-elevated/40 transition-colors group">
                        <td className="py-3 pr-3 text-soft">{new Date(trade.date).toLocaleDateString()}</td>
                        <td className="py-3 pr-3"><span className="badge badge-neutral">{trade.market}</span></td>
                        <td className="py-3 pr-3 font-mono font-bold text-clean">{trade.instrument}</td>
                        <td className="py-3 pr-3 text-muted">{trade.session}</td>
                        <td className="py-3 pr-3 text-subtle max-w-40 truncate">{trade.setup}</td>
                        <td className="py-3 pr-3 font-mono text-[11px]">
                          <span className="text-soft">{entryNum}</span> / <span className="text-loss">{slNum}</span> / <span className="text-profit">{tpNum}</span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`badge ${trade.outcome === "WIN" ? "badge-profit" : trade.outcome === "LOSS" ? "badge-loss" : "badge-neutral"}`}>
                            {trade.outcome}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-right font-mono font-semibold">
                          <span className={rrNum >= 0 ? "text-profit" : "text-loss"}>{formatRMultiple(rrNum)}</span>
                        </td>
                        <td className="py-3 pr-3 text-right font-mono font-bold">
                          <span className={pnlNum >= 0 ? "text-profit" : "text-loss"}>{formatCurrency(pnlNum)}</span>
                        </td>
                        <td className="py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DeleteTradeButton tradeId={trade.id} />
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
}
