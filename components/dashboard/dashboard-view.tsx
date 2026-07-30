"use client";

import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
  Sparkles,
  Dna,
  Calendar,
  Zap,
  Target,
  Shield,
  ChevronRight,
} from "lucide-react";
import { MOCK_TRADES, MOCK_METRICS, MOCK_DNA, MOCK_AI_INSIGHTS } from "@/lib/data/mock-trades";
import { formatCurrency, formatPercent, formatRMultiple } from "@/lib/utils";

export function DashboardView() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-6">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean tracking-tight">
            {greeting}, Trader 👋
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Here&apos;s your performance snapshot for today.
          </p>
        </div>
        <Link href="/trades/new" className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Log Trade
        </Link>
      </div>

      {/* ── AI Coach Insight Banner ── */}
      <div className="card-glow p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-ai-muted flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-ai" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge badge-ai">AI Insight</span>
            </div>
            <h3 className="text-sm font-semibold text-clean mt-1 leading-snug">
              {MOCK_AI_INSIGHTS[0].title}
            </h3>
            <p className="text-xs text-muted mt-1 line-clamp-2">
              {MOCK_AI_INSIGHTS[0].content}
            </p>
          </div>
        </div>
        <Link href="/ai-coach" className="btn-secondary shrink-0 self-start sm:self-center">
          Ask Coach <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard
          label="Net PnL"
          value={formatCurrency(MOCK_METRICS.netPnL)}
          sub="+12.4% this month"
          color="profit"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
        <KPICard
          label="Win Rate"
          value={formatPercent(MOCK_METRICS.winRate)}
          sub={`${MOCK_METRICS.totalTrades} trades`}
          color="default"
        />
        <KPICard
          label="Avg RR"
          value={`1:${MOCK_METRICS.averageRR}`}
          sub="Risk:Reward"
          color="accent"
        />
        <KPICard
          label="Total Trades"
          value={String(MOCK_METRICS.totalTrades)}
          sub="5 markets"
          color="default"
        />
        <KPICard
          label="Psych Score"
          value={`${MOCK_METRICS.psychologyScore}`}
          sub="/ 100 health"
          color="ai"
        />
        <KPICard
          label="Rule Follow"
          value={formatPercent(MOCK_METRICS.ruleFollowRate)}
          sub="compliance"
          color="profit"
        />
      </div>

      {/* ── Main Content: Trades + DNA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Trades */}
        <div className="lg:col-span-2 card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-clean flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" /> Recent Trades
            </h2>
            <Link href="/trades" className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Mobile: Card Layout / Desktop: Table */}
          <div className="space-y-2 sm:hidden">
            {MOCK_TRADES.slice(0, 4).map((trade) => (
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
                  <span>{trade.date} · {trade.session}</span>
                  <span className={`font-mono font-semibold ${trade.rMultiple >= 0 ? "text-profit" : "text-loss"}`}>
                    {formatRMultiple(trade.rMultiple)}
                  </span>
                </div>
                <p className="text-[11px] text-dim truncate">{trade.setup}</p>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-dim text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 pr-3 font-semibold">Date</th>
                  <th className="py-2.5 pr-3 font-semibold">Instrument</th>
                  <th className="py-2.5 pr-3 font-semibold">Setup</th>
                  <th className="py-2.5 pr-3 font-semibold">Outcome</th>
                  <th className="py-2.5 pr-3 text-right font-semibold">R-Mult</th>
                  <th className="py-2.5 text-right font-semibold">PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_TRADES.map((trade) => (
                  <tr key={trade.id} className="hover:bg-elevated/50 transition-colors">
                    <td className="py-3 pr-3">
                      <span className="text-soft">{trade.date}</span>
                      <span className="block text-[10px] text-dim">{trade.session}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="font-mono font-bold text-clean bg-elevated px-2 py-0.5 rounded-md text-[11px]">
                        {trade.instrument}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-subtle max-w-[180px] truncate">{trade.setup}</td>
                    <td className="py-3 pr-3">
                      <span className={`badge ${trade.outcome === "WIN" ? "badge-profit" : trade.outcome === "LOSS" ? "badge-loss" : "badge-neutral"}`}>
                        {trade.outcome}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-right font-mono font-semibold">
                      <span className={trade.rMultiple >= 0 ? "text-profit" : "text-loss"}>
                        {formatRMultiple(trade.rMultiple)}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono font-bold">
                      <span className={trade.pnl >= 0 ? "text-profit" : "text-loss"}>
                        {formatCurrency(trade.pnl)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trading DNA Sidebar */}
        <div className="space-y-4">
          <div className="card p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-clean flex items-center gap-2">
                <Dna className="h-4 w-4 text-accent" /> Trading DNA
              </h2>
              <Link href="/dna" className="text-xs text-accent hover:text-accent-hover font-medium">
                View →
              </Link>
            </div>

            <DNAItem label="Best Market" value={MOCK_DNA.bestMarket} badge="82% Win" type="profit" />
            <DNAItem label="Best Setup" value={MOCK_DNA.bestSetup} badge="3.2R Avg" type="profit" />
            <DNAItem label="Peak Session" value="New York" badge="NY Open" type="accent" />
            <DNAItem label="Primary Leak" value={MOCK_DNA.biggestWeakness} badge="Fix" type="loss" />
          </div>

          {/* Quick CTA */}
          <div className="card p-5 text-center space-y-3">
            <div className="h-10 w-10 rounded-xl bg-accent-muted flex items-center justify-center mx-auto">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <h3 className="text-sm font-semibold text-clean">Pre-trade Checklist</h3>
            <p className="text-xs text-muted leading-relaxed">
              Log your plan before executing to ensure 100% rule compliance.
            </p>
            <Link href="/trades/new" className="btn-primary w-full">
              <Plus className="h-4 w-4" /> Start Trade Log
            </Link>
          </div>
        </div>
      </div>

      {/* ── Calendar Heatmap ── */}
      <div className="card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-clean flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" /> Monthly Heatmap
          </h2>
          <span className="text-xs text-dim">July 2026</span>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <div key={`${day}-${i}`} className="text-center text-[10px] font-semibold text-dim pb-1">
              {day}
            </div>
          ))}

          {Array.from({ length: 31 }).map((_, i) => {
            const dayNum = i + 1;
            const isProfitable = dayNum % 3 === 0 || dayNum % 5 === 0;
            const isLoss = dayNum % 4 === 0 && !isProfitable;
            const isBlank = dayNum > 28;

            return (
              <div
                key={i}
                className={`aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center p-0.5 sm:p-1 transition-all cursor-pointer text-[9px] sm:text-[10px] ${
                  isProfitable
                    ? "bg-profit/15 text-profit border border-profit/20 hover:bg-profit/25"
                    : isLoss
                    ? "bg-loss/15 text-loss border border-loss/20 hover:bg-loss/25"
                    : isBlank
                    ? "bg-transparent opacity-20"
                    : "bg-elevated/50 text-dim hover:bg-elevated"
                }`}
              >
                <span className="font-mono font-medium leading-none">{dayNum}</span>
                {isProfitable && <span className="font-bold font-mono hidden sm:block mt-0.5">+1.2k</span>}
                {isLoss && <span className="font-bold font-mono hidden sm:block mt-0.5">-450</span>}
              </div>
            );
          })}
        </div>
      </div>
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
    <div className="card p-3.5 sm:p-4 space-y-1.5">
      <span className="label !mb-0">{label}</span>
      <div className={`stat-value !text-lg sm:!text-xl ${valueColor}`}>{value}</div>
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
