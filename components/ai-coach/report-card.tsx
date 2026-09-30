"use client";

import { useState } from "react";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Brain,
  Trophy,
  Target,
  Flame,
  RefreshCw,
  Calendar,
  BarChart3,
  Award,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { FormattedMessage } from "@/components/ai-coach/formatted-message";
import { formatAggregatedPnl } from "@/lib/utils/currency";

type ReportPeriod = "week" | "month" | "overall";

interface ReportMetrics {
  total: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  avgRR: number;
  bestTrade: { instrument: string; pnl: number; date: string } | null;
  worstTrade: { instrument: string; pnl: number; date: string } | null;
  rulesFollowed: number;
  rulesBroken: number;
  longestWinStreak: number;
  longestLossStreak: number;
  avgHoldingMins: number;
}

interface ReportData {
  success: boolean;
  metrics: ReportMetrics;
  period: string;
  periodLabel: string;
  report: string | null;
  message?: string;
  modelUsed?: string;
  provider?: string;
  dateRange?: { start: string; end: string };
}

export function ReportCard() {
  const [period, setPeriod] = useState<ReportPeriod>("week");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullReport, setShowFullReport] = useState(true);

  const generateReport = async (p: ReportPeriod) => {
    setPeriod(p);
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: p }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate report");
      setData(json);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const m = data?.metrics;
  const disciplineRate =
    m && m.total > 0 ? ((m.rulesFollowed / m.total) * 100).toFixed(0) : "—";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent to-ai flex items-center justify-center shadow-xs">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-clean">
              AI Report Card
            </h2>
            <p className="text-[11px] text-muted">
              AI-powered performance grades, discipline audit & coaching
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-surface border border-border-solid rounded-xl self-start sm:self-auto">
          {(["week", "month", "overall"] as const).map((p) => (
            <button
              key={p}
              onClick={() => generateReport(p)}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                period === p && data
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-clean hover:bg-elevated"
              }`}
            >
              {p === "week" && <Calendar className="h-3.5 w-3.5" />}
              {p === "month" && <BarChart3 className="h-3.5 w-3.5" />}
              {p === "overall" && <Trophy className="h-3.5 w-3.5" />}
              {p === "week" ? "This Week" : p === "month" ? "This Month" : "Overall"}
            </button>
          ))}
        </div>
      </div>

      {!data && !loading && !error && (
        <div className="card p-8 sm:p-12 text-center space-y-4 rounded-2xl border border-border-solid bg-card shadow-sm">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/20 to-ai/20 flex items-center justify-center">
            <Award className="h-7 w-7 text-accent" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-clean">
              Generate Your Report Card
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Select a time period above to generate your AI-powered performance
              report card with grades, discipline scores, psychology analysis,
              and personalized coaching challenges.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            <button
              onClick={() => generateReport("week")}
              className="btn-primary text-xs cursor-pointer"
            >
              <Calendar className="h-4 w-4" /> This Week
            </button>
            <button
              onClick={() => generateReport("month")}
              className="btn-secondary text-xs cursor-pointer"
            >
              <BarChart3 className="h-4 w-4" /> This Month
            </button>
            <button
              onClick={() => generateReport("overall")}
              className="btn-secondary text-xs cursor-pointer"
            >
              <Trophy className="h-4 w-4" /> Overall (12M)
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="card p-8 sm:p-12 text-center space-y-4 rounded-2xl border border-border-solid bg-card shadow-sm">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-ai/10 flex items-center justify-center animate-pulse">
            <Brain className="h-7 w-7 text-ai" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-clean">
              AI is analyzing your trades...
            </h3>
            <p className="text-xs text-muted">
              Computing metrics, discipline scores, and generating your
              personalized report card.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-ai">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>This takes 10-15 seconds</span>
          </div>
        </div>
      )}

      {error && (
        <div className="card p-5 rounded-2xl border border-loss/30 bg-loss/5 text-center space-y-2">
          <AlertTriangle className="h-5 w-5 text-loss mx-auto" />
          <p className="text-xs text-loss font-medium">{error}</p>
          <button
            onClick={() => generateReport(period)}
            className="btn-secondary text-xs mx-auto cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {data && m && (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
          {data.dateRange && (
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              <span>
                {data.periodLabel}: {data.dateRange.start} →{" "}
                {data.dateRange.end}
              </span>
              {data.modelUsed && (
                <span className="ml-auto font-mono text-[9px] bg-elevated px-1.5 py-0.5 rounded text-ai">
                  {data.modelUsed}
                </span>
              )}
            </div>
          )}

          {m.total === 0 ? (
            <div className="card p-8 text-center space-y-3 rounded-2xl border border-border-solid bg-card shadow-sm">
              <p className="text-xs sm:text-sm text-muted">{data.message}</p>
              <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                <button
                  onClick={() => generateReport("month")}
                  className="btn-primary text-xs cursor-pointer"
                >
                  <BarChart3 className="h-3.5 w-3.5" /> View This Month
                </button>
                <button
                  onClick={() => generateReport("overall")}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  <Trophy className="h-3.5 w-3.5" /> View Overall
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <MetricCard
                  label="Total Trades"
                  value={String(m.total)}
                  icon={<BarChart3 className="h-4 w-4 text-accent" />}
                  color="text-clean"
                />
                <MetricCard
                  label="Win Rate"
                  value={`${m.winRate}%`}
                  icon={<Target className="h-4 w-4 text-accent" />}
                  color={m.winRate >= 50 ? "text-profit" : "text-loss"}
                />
                <MetricCard
                  label="Net P&L"
                  value={formatAggregatedPnl(m.totalPnl)}
                  icon={
                    m.totalPnl >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-profit" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-loss" />
                    )
                  }
                  color={m.totalPnl >= 0 ? "text-profit" : "text-loss"}
                />
                <MetricCard
                  label="Avg R:R"
                  value={`${m.avgRR}R`}
                  icon={<Award className="h-4 w-4 text-accent" />}
                  color={m.avgRR >= 1 ? "text-profit" : "text-clean"}
                />
                <MetricCard
                  label="Discipline"
                  value={`${disciplineRate}%`}
                  icon={<ShieldCheck className="h-4 w-4 text-warn" />}
                  color={
                    Number(disciplineRate) >= 90
                      ? "text-profit"
                      : Number(disciplineRate) >= 70
                        ? "text-warn"
                        : "text-loss"
                  }
                />
                <MetricCard
                  label="Best Streak"
                  value={`${m.longestWinStreak}W / ${m.longestLossStreak}L`}
                  icon={<Flame className="h-4 w-4 text-warn" />}
                  color="text-clean"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {m.bestTrade && (
                  <div className="card p-4 rounded-xl border border-profit/20 bg-profit/5 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-profit/15 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5 text-profit" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-dim block">
                        Best Trade
                      </span>
                      <span className="text-sm font-bold text-profit font-mono">
                        {formatAggregatedPnl(m.bestTrade.pnl)}
                      </span>
                      <span className="text-[11px] text-muted block">
                        {m.bestTrade.instrument} · {m.bestTrade.date}
                      </span>
                    </div>
                  </div>
                )}
                {m.worstTrade && (
                  <div className="card p-4 rounded-xl border border-loss/20 bg-loss/5 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-loss/15 flex items-center justify-center shrink-0">
                      <TrendingDown className="h-5 w-5 text-loss" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-dim block">
                        Worst Trade
                      </span>
                      <span className="text-sm font-bold text-loss font-mono">
                        {formatAggregatedPnl(m.worstTrade.pnl)}
                      </span>
                      <span className="text-[11px] text-muted block">
                        {m.worstTrade.instrument} · {m.worstTrade.date}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {data.report && (
                <div className="card rounded-2xl border border-ai/20 bg-card shadow-sm overflow-hidden">
                  <button
                    onClick={() => setShowFullReport(!showFullReport)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-elevated/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-ai/15 flex items-center justify-center">
                        <Brain className="h-4 w-4 text-ai" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-clean">
                          AI Coach Report
                        </h3>
                        <p className="text-[10px] text-muted">
                          {data.periodLabel} performance analysis & coaching
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-muted transition-transform ${showFullReport ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showFullReport && (
                    <div className="px-4 sm:px-5 pb-5 border-t border-border-solid/50">
                      <div className="pt-4">
                        <FormattedMessage content={data.report} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!data.report && data.message && (
                <div className="card p-4 rounded-xl border border-warn/20 bg-warn/5 text-xs text-warn">
                  <AlertTriangle className="h-4 w-4 inline mr-1.5" />
                  {data.message}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="card p-3.5 rounded-xl border border-border-solid bg-card shadow-sm space-y-1.5 hover:border-accent/30 transition-colors">
      <div className="flex items-center justify-between text-muted text-xs">
        <span className="text-[9px] uppercase font-bold tracking-wider">
          {label}
        </span>
        {icon}
      </div>
      <div className={`text-base font-mono font-black truncate ${color}`}>
        {value}
      </div>
    </div>
  );
}
