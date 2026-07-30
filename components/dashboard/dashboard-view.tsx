"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
  Sparkles,
  Zap,
  ChevronRight,
  Database,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { MOCK_TRADES, MOCK_METRICS, MOCK_DNA, MOCK_AI_INSIGHTS } from "@/lib/data/mock-trades";
import { formatCurrency, formatPercent, formatRMultiple } from "@/lib/utils";
import { seedDemoTrades, clearAllUserTrades } from "@/lib/actions/trade-actions";

interface DashboardViewProps {
  userName?: string | null;
  isAuthed?: boolean;
}

export function DashboardView({ userName, isAuthed }: DashboardViewProps) {
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const firstName = userName ? userName.split(" ")[0] : "Trader";

  const handleSeedData = () => {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await seedDemoTrades();
      setStatusMsg(res.message);
    });
  };

  const handleClearData = () => {
    if (!confirm("Are you sure you want to clear your demo database trades?")) return;
    setStatusMsg(null);
    startTransition(async () => {
      const res = await clearAllUserTrades();
      setStatusMsg(res.message);
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean tracking-tight">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {isAuthed
              ? "Welcome to your personal trading journal & analytics engine."
              : "Here's your performance snapshot for today."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {isAuthed && (
            <button
              onClick={handleSeedData}
              disabled={isPending}
              className="btn-secondary text-xs cursor-pointer"
              title="Populate your database with sample trades"
            >
              <Database className="h-3.5 w-3.5 text-accent" />
              {isPending ? "Loading Sample..." : "Load Sample Data"}
            </button>
          )}
          <Link href="/trades/new" className="btn-primary self-start sm:self-auto cursor-pointer">
            <Plus className="h-4 w-4" /> Log Trade
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMsg && (
        <div className="card p-3 bg-accent-muted/30 border border-accent/20 rounded-xl flex items-center justify-between text-xs text-clean">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-profit shrink-0" />
            {statusMsg}
          </span>
          <button onClick={() => setStatusMsg(null)} className="text-dim hover:text-clean font-bold px-2 cursor-pointer">
            ✕
          </button>
        </div>
      )}

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
        <Link href="/ai-coach" className="btn-secondary shrink-0 self-start sm:self-center cursor-pointer">
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
            <Link href="/trades" className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer">
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
                {MOCK_TRADES.slice(0, 5).map((trade) => (
                  <tr key={trade.id} className="group hover:bg-elevated/40 transition-colors">
                    <td className="py-3 pr-3 text-muted font-mono whitespace-nowrap">
                      <div>{trade.date}</div>
                      <span className="text-[10px] text-dim">{trade.session}</span>
                    </td>
                    <td className="py-3 pr-3 font-bold font-mono text-clean">{trade.instrument}</td>
                    <td className="py-3 pr-3 text-soft max-w-45 truncate">{trade.setup}</td>
                    <td className="py-3 pr-3">
                      <span className={`badge ${trade.outcome === "WIN" ? "badge-profit" : trade.outcome === "LOSS" ? "badge-loss" : "badge-neutral"}`}>
                        {trade.outcome}
                      </span>
                    </td>
                    <td className={`py-3 pr-3 font-mono font-semibold text-right ${trade.rMultiple >= 0 ? "text-profit" : "text-loss"}`}>
                      {formatRMultiple(trade.rMultiple)}
                    </td>
                    <td className={`py-3 font-mono font-bold text-right ${trade.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                      {formatCurrency(trade.pnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DNA Snapshot */}
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

            <div className="space-y-2.5">
              <DNAItem label="Best Market" value={MOCK_DNA.bestMarket} badge="82% Win" type="profit" />
              <DNAItem label="Best Setup" value={MOCK_DNA.bestSetup} badge="3.2R Avg" type="accent" />
              <DNAItem label="Peak Session" value={MOCK_DNA.bestSession} badge="NY Open" type="profit" />
            </div>
          </div>

          <div className="pt-3 border-t border-border/20">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Monthly Win Rate</span>
              <span className="font-mono font-bold text-profit">68.4%</span>
            </div>
            <div className="w-full bg-elevated rounded-full h-2 mt-1.5 overflow-hidden">
              <div className="bg-profit h-full rounded-full transition-all duration-500" style={{ width: "68.4%" }} />
            </div>
          </div>
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
    <div className="card p-3.5 sm:p-4 space-y-1.5 hover:scale-[1.01] transition-transform">
      <span className="label mb-0!">{label}</span>
      <div className={`stat-value text-lg! sm:text-xl! ${valueColor}`}>{value}</div>
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
