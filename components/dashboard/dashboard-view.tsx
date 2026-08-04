"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
  Sparkles,
  Zap,
  ChevronRight,
  BookOpen,
  Dna,
  LineChart,
} from "lucide-react";
import { formatCurrency, formatPercent, formatRMultiple } from "@/lib/utils";
import { TradeItem, DashboardMetrics } from "@/types";
import { ChartModal } from "@/components/ui/chart-modal";

interface DashboardViewProps {
  userName?: string | null;
  isAuthed?: boolean;
  initialTrades?: TradeItem[] | any[];
  initialMetrics?: DashboardMetrics | any | null;
}

type MarketTicker = {
  symbol: string;
  label: string;
  price: string;
  change: number;
  isUp: boolean;
};

export function DashboardView({
  userName,
  isAuthed,
  initialTrades = [],
  initialMetrics = null,
}: DashboardViewProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const firstName = userName ? userName.split(" ")[0] : "Trader";

  const hasTrades = initialTrades && initialTrades.length > 0;
  const netPnL = initialMetrics?.netPnL ?? 0;
  const winRate = initialMetrics?.winRate ?? 0;
  const averageRR = initialMetrics?.averageRR ?? 0;
  const totalTrades = initialMetrics?.totalTrades ?? initialTrades.length;
  const ruleFollowRate = initialMetrics?.ruleFollowRate ?? 100;
  const psychologyScore = initialMetrics?.psychologyScore ?? 100;

  // Live Market State
  const [tickers, setTickers] = useState<MarketTicker[]>([
    { symbol: "NIFTY", label: "NIFTY 50", price: "24,520.15", change: 0.65, isUp: true },
    { symbol: "BANKNIFTY", label: "BANKNIFTY", price: "52,410.80", change: -0.22, isUp: false },
    { symbol: "GOLD", label: "Gold Spot", price: "$2,388.50", change: 0.45, isUp: true },
    { symbol: "BTC", label: "Bitcoin", price: "$65,420.00", change: 1.84, isUp: true },
  ]);

  const [chartOpen, setChartOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState("NIFTY");

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const [btcRes, paxgRes] = await Promise.all([
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT").then((r) => r.json()),
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT").then((r) => r.json()),
        ]);

        if (btcRes?.lastPrice && paxgRes?.lastPrice) {
          const btcPrice = parseFloat(btcRes.lastPrice).toLocaleString("en-US", { maximumFractionDigits: 2 });
          const btcChange = parseFloat(btcRes.priceChangePercent);
          const goldPrice = parseFloat(paxgRes.lastPrice).toLocaleString("en-US", { maximumFractionDigits: 2 });
          const goldChange = parseFloat(paxgRes.priceChangePercent);

          setTickers([
            { symbol: "NIFTY", label: "NIFTY 50", price: "24,520.15", change: 0.65, isUp: true },
            { symbol: "BANKNIFTY", label: "BANKNIFTY", price: "52,410.80", change: -0.22, isUp: false },
            { symbol: "GOLD", label: "Gold Spot", price: `$${goldPrice}`, change: goldChange, isUp: goldChange >= 0 },
            { symbol: "BTC", label: "Bitcoin", price: `$${btcPrice}`, change: btcChange, isUp: btcChange >= 0 },
          ]);
        }
      } catch {
        // Keep initial state
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  const openLiveChart = (sym: string) => {
    setSelectedChart(sym);
    setChartOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* ── Welcome Header + Compact AI Coach Pill ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean tracking-tight">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-xs text-muted mt-0.5">
            {isAuthed
              ? "Welcome to your personal trading journal & analytics engine."
              : "Sign in with Google to start logging trades and tracking performance."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Compressed AI Coach Quick Chip */}
          <Link
            href="/ai-coach"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ai-muted text-ai border border-ai/20 text-xs font-semibold hover:bg-ai/20 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Coach</span>
            <ArrowUpRight className="h-3 w-3 opacity-70" />
          </Link>

          <Link href="/trades/new" className="btn-primary self-start sm:self-auto cursor-pointer py-1.5! text-xs!">
            <Plus className="h-4 w-4" /> New Trade
          </Link>
        </div>
      </div>

      {/* ── Live Market Watch Strip (Prominent on Mobile & Desktop) ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-dim flex items-center gap-1.5">
            <LineChart className="h-3.5 w-3.5 text-accent" /> Live Market Overview
          </span>
          <span className="text-[10px] text-muted font-medium">Click any asset to launch chart</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {tickers.map((t) => (
            <div
              key={t.symbol}
              onClick={() => openLiveChart(t.symbol)}
              className="card-elevated p-3 rounded-xl flex items-center justify-between gap-2 cursor-pointer hover:border-accent/40 hover:bg-surface transition-all select-none group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-clean tracking-tight">{t.label}</span>
                  <span className={`text-[10px] font-bold flex items-center ${t.isUp ? "text-profit" : "text-loss"}`}>
                    {t.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(t.change).toFixed(2)}%
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-soft mt-0.5">{t.price}</div>
              </div>

              <button
                type="button"
                className="h-7 w-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:bg-accent group-hover:text-white transition-all shrink-0"
                title={`Open ${t.label} Chart`}
              >
                <LineChart className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
        <KPICard
          label="Net PnL"
          value={formatCurrency(netPnL)}
          sub={hasTrades ? "realized PnL" : "0 trades"}
          color={netPnL >= 0 ? "profit" : "loss"}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
        <KPICard
          label="Win Rate"
          value={formatPercent(winRate)}
          sub={`${totalTrades} trades`}
          color="default"
        />
        <KPICard
          label="Avg RR"
          value={`1:${averageRR}`}
          sub="Risk:Reward"
          color="accent"
        />
        <KPICard
          label="Total Trades"
          value={String(totalTrades)}
          sub="recorded"
          color="default"
        />
        <KPICard
          label="Psych Score"
          value={`${psychologyScore}`}
          sub="/ 100 health"
          color="ai"
        />
        <KPICard
          label="Rule Follow"
          value={formatPercent(ruleFollowRate)}
          sub="compliance"
          color="profit"
        />
      </div>

      {/* ── Main Content: Trades + DNA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Trades Section */}
        <div className="lg:col-span-2 card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-clean flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" /> Recent Trades
            </h2>
            {hasTrades && (
              <Link href="/trades" className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer">
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {!hasTrades ? (
            /* Clean Empty State Guide when 0 trades */
            <div className="card-elevated p-8 text-center space-y-4 my-2">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold">No Trades Logged Yet</h3>
                <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                  Start tracking your trading journey by logging your first trade setup. Your performance metrics, win rate, and analytics will calculate automatically.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                <Link href="/trades/new" className="btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Log Your First Trade
                </Link>
              </div>
            </div>
          ) : (
            /* Trades Table & Mobile Cards when trades exist */
            <>
              {/* Mobile: Card Layout */}
              <div className="space-y-2 sm:hidden">
                {initialTrades.slice(0, 4).map((trade: any) => (
                  <div key={trade.id} className="card-elevated p-3.5 rounded-xl space-y-2">
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
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>{new Date(trade.date).toLocaleDateString()} · {trade.session}</span>
                      <span className={`font-mono font-semibold ${(trade.actualRR ?? trade.rMultiple ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
                        {formatRMultiple(trade.actualRR ?? trade.rMultiple ?? 0)}
                      </span>
                    </div>
                    <p className="text-[11px] text-dim truncate">{trade.setup}</p>
                  </div>
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-dim text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 pr-3 font-semibold">Date</th>
                      <th className="py-2.5 pr-3 font-semibold">Instrument</th>
                      <th className="py-2.5 pr-3 font-semibold">Setup</th>
                      <th className="py-2.5 pr-3 font-semibold">Outcome</th>
                      <th className="py-2.5 pr-3 font-semibold text-right">R-Mult</th>
                      <th className="py-2.5 font-semibold text-right">PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {initialTrades.slice(0, 5).map((trade: any) => (
                      <tr key={trade.id} className="group hover:bg-elevated/40 transition-colors">
                        <td className="py-3 pr-3 text-muted font-mono whitespace-nowrap">
                          <div>{new Date(trade.date).toLocaleDateString()}</div>
                          <span className="text-[10px] text-dim">{trade.session}</span>
                        </td>
                        <td className="py-3 pr-3 font-bold font-mono text-clean">{trade.instrument}</td>
                        <td className="py-3 pr-3 text-soft max-w-45 truncate">{trade.setup}</td>
                        <td className="py-3 pr-3">
                          <span className={`badge ${trade.outcome === "WIN" ? "badge-profit" : trade.outcome === "LOSS" ? "badge-loss" : "badge-neutral"}`}>
                            {trade.outcome}
                          </span>
                        </td>
                        <td className={`py-3 pr-3 font-mono font-semibold text-right ${(trade.actualRR ?? trade.rMultiple ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
                          {formatRMultiple(trade.actualRR ?? trade.rMultiple ?? 0)}
                        </td>
                        <td className={`py-3 font-mono font-bold text-right ${trade.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                          {formatCurrency(trade.pnl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* DNA Snapshot Section */}
        <div className="card p-4 sm:p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-clean flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-ai" /> Trading DNA
              </h2>
              <Link href="/dna" className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer">
                View →
              </Link>
            </div>

            {!hasTrades ? (
              <div className="card-elevated p-6 rounded-2xl text-center space-y-2 my-2">
                <Dna className="h-6 w-6 text-ai mx-auto" />
                <h4 className="text-xs font-semibold text-clean">DNA Analysis Pending</h4>
                <p className="text-[11px] text-dim leading-relaxed">
                  Log at least 5 trades to unlock your quantitative trading fingerprint and setup win rates.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <DNAItem label="Best Market" value={initialTrades[0]?.market || "N/A"} badge="Active" type="profit" />
                <DNAItem label="Best Setup" value={initialTrades[0]?.setup || "N/A"} badge="Primary" type="accent" />
                <DNAItem label="Peak Session" value={initialTrades[0]?.session || "N/A"} badge="Session" type="profit" />
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/20">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Win Rate</span>
              <span className="font-mono font-bold text-profit">{formatPercent(winRate)}</span>
            </div>
            <div className="w-full bg-elevated rounded-full h-2 mt-1.5 overflow-hidden">
              <div className="bg-profit h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, winRate)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Standalone Interactive Chart Modal */}
      <ChartModal
        isOpen={chartOpen}
        onClose={() => setChartOpen(false)}
        initialSymbol={selectedChart}
      />
    </div>
  );
}

/* ── Sub-Components ── */

function KPICard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  color: "profit" | "loss" | "accent" | "ai" | "default";
  icon?: React.ReactNode;
}) {
  const valueColor = {
    profit: "text-profit",
    loss: "text-loss",
    accent: "text-accent",
    ai: "text-ai",
    default: "text-clean",
  }[color];

  return (
    <div className="card p-3 sm:p-3.5 space-y-1 hover:scale-[1.01] transition-transform">
      <span className="label mb-0!">{label}</span>
      <div className={`stat-value text-base! sm:text-lg! ${valueColor}`}>{value}</div>
      <div className="flex items-center gap-1 text-[10px] text-dim font-medium">
        {icon}
        <span>{sub}</span>
      </div>
    </div>
  );
}

function DNAItem({
  label,
  value,
  badge,
  type,
}: {
  label: string;
  value: string;
  badge: string;
  type: "profit" | "loss" | "accent";
}) {
  return (
    <div className="card-elevated p-3 rounded-xl flex items-center justify-between gap-2">
      <div className="min-w-0">
        <span className="text-[10px] uppercase font-semibold text-dim tracking-wider">{label}</span>
        <p className="text-xs font-semibold text-soft truncate">{value}</p>
      </div>
      <span className={`badge shrink-0 ${type === "profit" ? "badge-profit" : type === "loss" ? "badge-loss" : "badge-accent"}`}>
        {badge}
      </span>
    </div>
  );
}
