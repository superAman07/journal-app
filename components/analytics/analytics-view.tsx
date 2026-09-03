"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Plus,
  Clock,
  Target,
  Zap,
  Award,
  Layers,
  Calendar,
  Filter,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Percent,
  Dna,
  BrainCircuit,
  CalendarRange,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { convertPnlToInr, formatAggregatedPnl, getCurrencySymbol } from "@/lib/utils/currency";

interface TradeData {
  id: string;
  date: string | Date;
  market: string;
  instrument: string;
  session: string;
  setup: string;
  outcome: string;
  pnl: number;
  rMultiple: number;
  actualRR: number;
  riskPercent: number;
  entryTime?: string | Date | null;
  exitTime?: string | Date | null;
  rulesFollowed: boolean;
}

type AnalyticsTab = "overview" | "dna" | "audits";

export function AnalyticsView({
  initialTrades,
  usdInrRate,
}: {
  initialTrades: TradeData[];
  usdInrRate: number;
}) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
  const [selectedMarket, setSelectedMarket] = useState<string>("ALL");
  const [selectedSession, setSelectedSession] = useState<string>("ALL");
  const [timeRange, setTimeRange] = useState<"ALL" | "30D" | "90D">("ALL");

  // Markets list
  const markets = useMemo(() => {
    const set = new Set(initialTrades.map((t) => t.market));
    return ["ALL", ...Array.from(set)];
  }, [initialTrades]);

  // Sessions list
  const sessions = useMemo(() => {
    const set = new Set(initialTrades.map((t) => t.session));
    return ["ALL", ...Array.from(set)];
  }, [initialTrades]);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    let list = [...initialTrades];

    if (selectedMarket !== "ALL") {
      list = list.filter((t) => t.market === selectedMarket);
    }
    if (selectedSession !== "ALL") {
      list = list.filter((t) => t.session === selectedSession);
    }
    if (timeRange !== "ALL") {
      const now = new Date().getTime();
      const days = timeRange === "30D" ? 30 : 90;
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      list = list.filter((t) => new Date(t.date).getTime() >= cutoff);
    }

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [initialTrades, selectedMarket, selectedSession, timeRange]);

  // Metrics Calculations
  const totalTrades = filteredTrades.length;
  const wins = filteredTrades.filter((t) => t.outcome === "WIN");
  const losses = filteredTrades.filter((t) => t.outcome === "LOSS");
  const breakevens = filteredTrades.filter((t) => t.outcome === "BREAKEVEN");

  const winCount = wins.length;
  const lossCount = losses.length;
  const winRate = totalTrades > 0 ? ((winCount / totalTrades) * 100).toFixed(1) : "0.0";

  // Converted PnLs in INR
  const tradesWithInrPnL = useMemo(() => {
    return filteredTrades.map((t) => ({
      ...t,
      pnlInr: convertPnlToInr(Number(t.pnl || 0), t.market, usdInrRate),
    }));
  }, [filteredTrades, usdInrRate]);

  const totalPnLInr = useMemo(() => {
    return tradesWithInrPnL.reduce((sum, t) => sum + t.pnlInr, 0);
  }, [tradesWithInrPnL]);

  const grossProfit = useMemo(() => {
    return tradesWithInrPnL.filter((t) => t.pnlInr > 0).reduce((sum, t) => sum + t.pnlInr, 0);
  }, [tradesWithInrPnL]);

  const grossLoss = useMemo(() => {
    return Math.abs(tradesWithInrPnL.filter((t) => t.pnlInr < 0).reduce((sum, t) => sum + t.pnlInr, 0));
  }, [tradesWithInrPnL]);

  const profitFactor = useMemo(() => {
    if (grossLoss === 0) return grossProfit > 0 ? "∞" : "0.00";
    return (grossProfit / grossLoss).toFixed(2);
  }, [grossProfit, grossLoss]);

  const avgRR = useMemo(() => {
    if (totalTrades === 0) return "0.00";
    const sum = filteredTrades.reduce((acc, t) => acc + (t.actualRR || t.rMultiple || 0), 0);
    return (sum / totalTrades).toFixed(2);
  }, [filteredTrades, totalTrades]);

  // Holding Time
  const avgHoldingTimeFormatted = useMemo(() => {
    const withDuration = filteredTrades.filter((t) => t.entryTime && t.exitTime);
    if (withDuration.length === 0) return "—";
    const totalMins = withDuration.reduce((acc, t) => {
      const diff = new Date(t.exitTime!).getTime() - new Date(t.entryTime!).getTime();
      return acc + Math.max(0, diff / (1000 * 60));
    }, 0);
    const avgMins = Math.round(totalMins / withDuration.length);
    const h = Math.floor(avgMins / 60);
    const m = avgMins % 60;
    return `${h}h ${m}m`;
  }, [filteredTrades]);

  // Streak Tracker
  const { currentStreak, bestStreak } = useMemo(() => {
    let current = 0;
    let best = 0;

    filteredTrades.forEach((t) => {
      if (t.outcome === "WIN") {
        if (current >= 0) current++;
        else current = 1;
        if (current > best) best = current;
      } else if (t.outcome === "LOSS") {
        if (current <= 0) current--;
        else current = -1;
      }
    });

    return { currentStreak: current, bestStreak: best };
  }, [filteredTrades]);

  // Equity Curve Cumulative Data
  const equityCurveData = useMemo(() => {
    let cumulative = 0;
    return tradesWithInrPnL.map((t, idx) => {
      cumulative += t.pnlInr;
      return {
        step: idx + 1,
        date: new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        pnl: t.pnlInr,
        cumulative,
      };
    });
  }, [tradesWithInrPnL]);

  // SVG Path for Equity Curve
  const svgPathData = useMemo(() => {
    if (equityCurveData.length === 0) return { path: "", area: "", points: [] };
    const values = [0, ...equityCurveData.map((d) => d.cumulative)];
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const width = 600;
    const height = 180;
    const padding = 20;

    const points = values.map((val, idx) => {
      const x = padding + (idx / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
      return { x, y, val };
    });

    const path = points.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const area = `${path} L ${lastX} ${height} L ${firstX} ${height} Z`;

    return { path, area, points };
  }, [equityCurveData]);

  // Market Breakdown
  const marketBreakdown = useMemo(() => {
    const map: Record<string, { trades: number; wins: number; pnl: number }> = {};
    tradesWithInrPnL.forEach((t) => {
      if (!map[t.market]) map[t.market] = { trades: 0, wins: 0, pnl: 0 };
      map[t.market].trades += 1;
      if (t.outcome === "WIN") map[t.market].wins += 1;
      map[t.market].pnl += t.pnlInr;
    });

    return Object.entries(map).map(([m, data]) => ({
      market: m,
      trades: data.trades,
      winRate: ((data.wins / data.trades) * 100).toFixed(0),
      pnl: data.pnl,
    }));
  }, [tradesWithInrPnL]);

  // Session Breakdown
  const sessionBreakdown = useMemo(() => {
    const map: Record<string, { trades: number; wins: number; pnl: number }> = {};
    tradesWithInrPnL.forEach((t) => {
      if (!map[t.session]) map[t.session] = { trades: 0, wins: 0, pnl: 0 };
      map[t.session].trades += 1;
      if (t.outcome === "WIN") map[t.session].wins += 1;
      map[t.session].pnl += t.pnlInr;
    });

    return Object.entries(map).map(([s, data]) => ({
      session: s,
      trades: data.trades,
      winRate: ((data.wins / data.trades) * 100).toFixed(0),
      pnl: data.pnl,
    }));
  }, [tradesWithInrPnL]);

  // Day of Week Breakdown
  const dayOfWeekBreakdown = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const map: Record<string, { trades: number; wins: number; pnl: number }> = {};
    days.forEach((d) => (map[d] = { trades: 0, wins: 0, pnl: 0 }));

    tradesWithInrPnL.forEach((t) => {
      const dayName = days[new Date(t.date).getDay()];
      if (map[dayName]) {
        map[dayName].trades += 1;
        if (t.outcome === "WIN") map[dayName].wins += 1;
        map[dayName].pnl += t.pnlInr;
      }
    });

    return days.filter((d) => map[d].trades > 0).map((d) => ({
      day: d,
      trades: map[d].trades,
      winRate: ((map[d].wins / map[d].trades) * 100).toFixed(0),
      pnl: map[d].pnl,
    }));
  }, [tradesWithInrPnL]);

  // Trading DNA & Psychology Calculations
  const topMarket = useMemo(() => {
    if (marketBreakdown.length === 0) return "N/A";
    return [...marketBreakdown].sort((a, b) => b.trades - a.trades)[0]?.market || "N/A";
  }, [marketBreakdown]);

  const bestSession = useMemo(() => {
    if (sessionBreakdown.length === 0) return "N/A";
    return [...sessionBreakdown].sort((a, b) => b.pnl - a.pnl)[0]?.session || "N/A";
  }, [sessionBreakdown]);

  const rulesFollowedCount = useMemo(() => {
    return filteredTrades.filter((t) => t.rulesFollowed).length;
  }, [filteredTrades]);

  const ruleFollowRate = totalTrades > 0 ? ((rulesFollowedCount / totalTrades) * 100).toFixed(1) : "100";

  const psychologyScore = useMemo(() => {
    if (totalTrades === 0) return 100;
    const ruleScore = (rulesFollowedCount / totalTrades) * 70;
    const winScore = (Number(winRate) / 100) * 30;
    return Math.min(100, Math.round(ruleScore + winScore));
  }, [totalTrades, rulesFollowedCount, winRate]);

  if (initialTrades.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" /> Performance Hub
          </h1>
          <p className="text-xs text-muted mt-0.5">Quantitative fingerprint, equity curves, and performance audits.</p>
        </div>

        <div className="card p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto rounded-2xl border border-border-solid bg-card shadow-sm">
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

  return (
    <div className="space-y-6">
      {/* ── Header + Powerhouse Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-solid pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" /> Performance & Intelligence Hub
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Quantitative execution stats, trading fingerprint, equity curve, and discipline reviews.
          </p>
        </div>

        {/* ── Modern Pill Tab Switcher ── */}
        <div className="flex items-center gap-1 p-1 bg-surface border border-border-solid rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-clean"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" /> P&L & Equity
          </button>
          <button
            onClick={() => setActiveTab("dna")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "dna"
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-clean"
            }`}
          >
            <Dna className="h-3.5 w-3.5" /> Trading DNA
          </button>
          <button
            onClick={() => setActiveTab("audits")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "audits"
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-clean"
            }`}
          >
            <CalendarRange className="h-3.5 w-3.5" /> Periodic Audits
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          TAB 1: P&L & EQUITY TRAJECTORY
          ═══════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Segment Filter Bar */}
          <div className="card p-3 sm:p-4 rounded-2xl border border-border-solid bg-card shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted font-semibold mr-1">
                <Filter className="h-3.5 w-3.5 text-accent" />
                <span>Filters:</span>
              </div>

              {/* Market Filter */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {markets.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMarket(m)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedMarket === m
                        ? "bg-accent text-white shadow-sm"
                        : "bg-surface text-muted hover:bg-elevated hover:text-clean border border-border-solid/40"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-border-solid hidden sm:block mx-1" />

              {/* Session Filter */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {sessions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSession(s)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedSession === s
                        ? "bg-accent text-white shadow-sm"
                        : "bg-surface text-muted hover:bg-elevated hover:text-clean border border-border-solid/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Range Filter */}
            <div className="flex items-center gap-1 bg-surface border border-border-solid p-0.5 rounded-lg shrink-0">
              {(["ALL", "30D", "90D"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    timeRange === range
                      ? "bg-accent text-white shadow-sm"
                      : "text-muted hover:text-clean"
                  }`}
                >
                  {range === "ALL" ? "All Time" : range}
                </button>
              ))}
            </div>
          </div>

          {/* Top KPI Metrics Strip (6 Clean Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard
              label="Net Realized PnL"
              value={formatAggregatedPnl(totalPnLInr)}
              subtext="Converted total"
              icon={totalPnLInr >= 0 ? <TrendingUp className="h-4 w-4 text-profit" /> : <TrendingDown className="h-4 w-4 text-loss" />}
              color={totalPnLInr >= 0 ? "text-profit" : "text-loss"}
            />
            <KPICard
              label="Win Rate"
              value={`${winRate}%`}
              subtext={`${winCount}W / ${lossCount}L`}
              icon={<Percent className="h-4 w-4 text-accent" />}
              color={Number(winRate) >= 50 ? "text-profit" : "text-loss"}
            />
            <KPICard
              label="Profit Factor"
              value={profitFactor}
              subtext="Gross Win / Loss"
              icon={<Award className="h-4 w-4 text-accent" />}
              color={Number(profitFactor) >= 1.5 ? "text-profit" : "text-clean"}
            />
            <KPICard
              label="Avg R-Multiple"
              value={`${avgRR}R`}
              subtext="Per trade return"
              icon={<Target className="h-4 w-4 text-accent" />}
              color={Number(avgRR) >= 1 ? "text-profit" : "text-clean"}
            />
            <KPICard
              label="Avg Holding Time"
              value={avgHoldingTimeFormatted}
              subtext="Entry to exit"
              icon={<Clock className="h-4 w-4 text-accent" />}
              color="text-clean"
            />
            <KPICard
              label="Current Streak"
              value={currentStreak > 0 ? `+${currentStreak} Win` : currentStreak < 0 ? `${currentStreak} Loss` : "0"}
              subtext={`Best: +${bestStreak}W`}
              icon={<Flame className="h-4 w-4 text-warn" />}
              color={currentStreak > 0 ? "text-profit" : currentStreak < 0 ? "text-loss" : "text-clean"}
            />
          </div>

          {/* Equity Curve SVG Section */}
          <div className="card p-5 rounded-2xl border border-border-solid bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-clean text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" /> Cumulative Equity Growth Curve
                </h3>
                <p className="text-[11px] text-muted">Real-time PnL trajectory across trades in INR.</p>
              </div>
              <span className="text-xs font-mono font-bold text-soft">{totalTrades} Total Executions</span>
            </div>

            {equityCurveData.length > 1 ? (
              <div className="relative w-full h-52 bg-surface/50 rounded-xl p-3 border border-border-solid flex flex-col justify-between overflow-hidden">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={totalPnLInr >= 0 ? "#0bd07f" : "#ff5757"} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={totalPnLInr >= 0 ? "#0bd07f" : "#ff5757"} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={svgPathData.area} fill="url(#equityGradient)" />
                  <path d={svgPathData.path} fill="none" stroke={totalPnLInr >= 0 ? "#0bd07f" : "#ff5757"} strokeWidth="2.5" strokeLinecap="round" />
                  {svgPathData.points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill={totalPnLInr >= 0 ? "#0bd07f" : "#ff5757"} />
                  ))}
                </svg>
              </div>
            ) : (
              <div className="h-32 bg-surface/40 rounded-xl flex items-center justify-center text-xs text-muted border border-border-solid">
                Log at least 2 trades to display cumulative equity curve chart.
              </div>
            )}
          </div>

          {/* Breakdown Grid: Market Segment & Session Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5 rounded-2xl border border-border-solid bg-card shadow-sm space-y-4">
              <h3 className="font-bold text-clean text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent" /> Market Segment Breakdown
              </h3>
              <div className="space-y-3">
                {marketBreakdown.map((item) => (
                  <div key={item.market} className="p-3.5 rounded-xl border border-border-solid bg-surface space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-clean">{item.market}</span>
                      <span className={`font-mono font-bold ${item.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                        {formatAggregatedPnl(item.pnl)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>{item.trades} trade{item.trades > 1 ? "s" : ""}</span>
                      <span>Win Rate: <strong className="text-soft font-mono">{item.winRate}%</strong></span>
                    </div>
                    <div className="w-full h-1.5 bg-card rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, Number(item.winRate)))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5 rounded-2xl border border-border-solid bg-card shadow-sm space-y-4">
              <h3 className="font-bold text-clean text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-ai" /> Session Performance
              </h3>
              <div className="space-y-3">
                {sessionBreakdown.map((item) => (
                  <div key={item.session} className="p-3.5 rounded-xl border border-border-solid bg-surface space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-clean">{item.session} Session</span>
                      <span className={`font-mono font-bold ${item.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                        {formatAggregatedPnl(item.pnl)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>{item.trades} trade{item.trades > 1 ? "s" : ""}</span>
                      <span>Win Rate: <strong className="text-soft font-mono">{item.winRate}%</strong></span>
                    </div>
                    <div className="w-full h-1.5 bg-card rounded-full overflow-hidden">
                      <div
                        className="h-full bg-profit transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, Number(item.winRate)))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day of Week Analysis */}
          <div className="card p-5 rounded-2xl border border-border-solid bg-card shadow-sm space-y-4">
            <h3 className="font-bold text-clean text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-warn" /> Day of Week Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {dayOfWeekBreakdown.map((item) => (
                <div key={item.day} className="p-3 rounded-xl border border-border-solid bg-surface text-center space-y-1.5">
                  <span className="text-xs font-bold text-clean block">{item.day}</span>
                  <span className={`text-sm font-mono font-bold block ${item.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                    {formatAggregatedPnl(item.pnl)}
                  </span>
                  <span className="text-[10px] text-muted block">{item.trades} trades · {item.winRate}% WR</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB 2: TRADING DNA & PSYCHOLOGY
          ═══════════════════════════════════════════ */}
      {activeTab === "dna" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Top DNA Quantitative Fingerprint */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 rounded-2xl border border-border-solid bg-card shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="badge badge-profit">Peak Strength</span>
                <Dna className="h-4 w-4 text-profit" />
              </div>
              <div>
                <span className="text-[11px] text-dim font-medium">Most Traded Market</span>
                <p className="text-lg font-black text-clean mt-0.5">{topMarket}</p>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {totalTrades} total logged trades in your database.
              </p>
            </div>

            <div className="card p-5 rounded-2xl border border-border-solid bg-card shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="badge badge-accent">Session Dominance</span>
                <Clock className="h-4 w-4 text-accent" />
              </div>
              <div>
                <span className="text-[11px] text-dim font-medium">Top Performing Session</span>
                <p className="text-lg font-black text-clean mt-0.5">{bestSession}</p>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Generates highest cumulative profitability in INR.
              </p>
            </div>

            <div className="card p-5 rounded-2xl border border-border-solid bg-card shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="badge badge-warn">Discipline Score</span>
                <ShieldCheck className="h-4 w-4 text-warn" />
              </div>
              <div>
                <span className="text-[11px] text-dim font-medium">Rule Compliance Rate</span>
                <p className="text-lg font-black text-profit mt-0.5">{ruleFollowRate}%</p>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {rulesFollowedCount} of {totalTrades} executions followed plan rules.
              </p>
            </div>
          </div>

          {/* Psychology & Mindset Health Strip */}
          <div className="card p-5 sm:p-6 rounded-2xl border border-border-solid bg-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-ai" />
                <h3 className="text-sm font-bold text-clean">Psychological Discipline Index</h3>
              </div>
              <p className="text-xs text-muted max-w-md">
                Measures trading calm, adherence to rules, and absence of revenge/FOMO execution loops.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-dim block">Health Score</span>
                <span className="font-mono text-2xl font-black text-ai">{psychologyScore} / 100</span>
              </div>
              <div className="w-24 h-3 bg-surface rounded-full overflow-hidden border border-border-solid">
                <div
                  className="h-full bg-linear-to-r from-accent to-ai transition-all duration-500 rounded-full"
                  style={{ width: `${psychologyScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB 3: PERIODIC AUDITS
          ═══════════════════════════════════════════ */}
      {activeTab === "audits" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="card p-5 sm:p-6 rounded-2xl border border-border-solid bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-solid pb-3">
              <div>
                <h3 className="text-sm font-bold text-clean flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-accent" /> Execution Audit Summary
                </h3>
                <p className="text-xs text-muted">Aggregated financial audit for current filtered period.</p>
              </div>
              <span className="badge badge-neutral text-xs font-mono font-bold">
                {totalTrades} Executions
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-border-solid bg-surface space-y-1">
                <span className="text-[10px] uppercase font-bold text-dim">Gross Profit</span>
                <p className="font-mono text-base font-black text-profit">{formatAggregatedPnl(grossProfit)}</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border-solid bg-surface space-y-1">
                <span className="text-[10px] uppercase font-bold text-dim">Gross Loss</span>
                <p className="font-mono text-base font-black text-loss">-{formatAggregatedPnl(grossLoss)}</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border-solid bg-surface space-y-1">
                <span className="text-[10px] uppercase font-bold text-dim">Net Realized PnL</span>
                <p className={`font-mono text-base font-black ${totalPnLInr >= 0 ? "text-profit" : "text-loss"}`}>
                  {formatAggregatedPnl(totalPnLInr)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-border-solid bg-surface space-y-1">
                <span className="text-[10px] uppercase font-bold text-dim">Profit Factor</span>
                <p className="font-mono text-base font-black text-clean">{profitFactor}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({
  label,
  value,
  subtext,
  icon,
  color,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="card p-4 rounded-2xl border border-border-solid bg-card shadow-sm space-y-1.5 hover:border-accent/40 transition-colors">
      <div className="flex items-center justify-between text-muted text-xs">
        <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
        {icon}
      </div>
      <div className={`text-base sm:text-lg font-mono font-black truncate ${color}`}>
        {value}
      </div>
      <span className="text-[10px] text-dim block truncate">{subtext}</span>
    </div>
  );
}
