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

export function AnalyticsView({
  initialTrades,
  usdInrRate,
}: {
  initialTrades: TradeData[];
  usdInrRate: number;
}) {
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

    // Sort chronologically ascending for equity curve calculation
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

  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? "∞" : "0.00";

  const avgRR = useMemo(() => {
    if (totalTrades === 0) return "0.00";
    const sumRR = filteredTrades.reduce((sum, t) => sum + (t.actualRR || 0), 0);
    return (sumRR / totalTrades).toFixed(2);
  }, [filteredTrades, totalTrades]);

  // Average Holding Time
  const avgHoldingTimeFormatted = useMemo(() => {
    const timedTrades = filteredTrades.filter((t) => t.entryTime && t.exitTime);
    if (timedTrades.length === 0) return "—";

    let totalMins = 0;
    timedTrades.forEach((t) => {
      const start = new Date(t.entryTime!).getTime();
      const end = new Date(t.exitTime!).getTime();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        totalMins += Math.round((end - start) / 60000);
      }
    });

    const avgMins = Math.round(totalMins / timedTrades.length);
    if (avgMins < 60) return `${avgMins}m`;
    const h = Math.floor(avgMins / 60);
    const m = avgMins % 60;
    return `${h}h ${m}m`;
  }, [filteredTrades]);

  // Streak Tracker
  const { currentStreak, bestStreak, maxLossStreak } = useMemo(() => {
    let current = 0;
    let best = 0;
    let worst = 0;
    let tempLoss = 0;

    filteredTrades.forEach((t) => {
      if (t.outcome === "WIN") {
        if (current >= 0) current++;
        else current = 1;
        if (current > best) best = current;
        tempLoss = 0;
      } else if (t.outcome === "LOSS") {
        if (current <= 0) current--;
        else current = -1;
        tempLoss++;
        if (tempLoss > worst) worst = tempLoss;
      }
    });

    return { currentStreak: current, bestStreak: best, maxLossStreak: worst };
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

  if (initialTrades.length === 0) {
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

  return (
    <div className="space-y-6">
      {/* Header + Segment Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" /> Performance Analytics
          </h1>
          <p className="text-xs text-muted mt-0.5">
            God-Mode execution stats, cumulative equity curve, holding duration & segment breakdowns.
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-1 bg-surface border border-border-solid p-1 rounded-xl shrink-0">
          {(["ALL", "30D", "90D"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

      {/* Segment Filters Bar */}
      <div className="card p-3 sm:p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted font-semibold">
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
                  ? "bg-accent-muted text-accent border border-accent/30"
                  : "bg-surface text-muted hover:bg-elevated hover:text-clean border border-transparent"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border-solid hidden sm:block" />

        {/* Session Filter */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {sessions.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSession(s)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSession === s
                  ? "bg-accent-muted text-accent border border-accent/30"
                  : "bg-surface text-muted hover:bg-elevated hover:text-clean border border-transparent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPI Metrics Strip (6 Cards) */}
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
      <div className="card p-5 space-y-4">
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
          <div className="relative w-full h-[200px] bg-surface rounded-xl p-3 border border-border-solid flex flex-col justify-between overflow-hidden">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={totalPnLInr >= 0 ? "#0bd07f" : "#ff5757"} stopOpacity="0.3" />
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
          <div className="h-32 bg-surface rounded-xl flex items-center justify-center text-xs text-muted">
            Log at least 2 trades to display cumulative equity curve chart.
          </div>
        )}
      </div>

      {/* Breakdown Grid: Market Segment & Session Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Market Segment Performance */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-clean text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent" /> Market Segment Breakdown
          </h3>
          <div className="space-y-3">
            {marketBreakdown.map((item) => (
              <div key={item.market} className="card-elevated p-3.5 rounded-xl space-y-2">
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
                {/* Visual bar */}
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, Number(item.winRate)))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trading Session Performance */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-clean text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" /> Session Performance
          </h3>
          <div className="space-y-3">
            {sessionBreakdown.map((item) => (
              <div key={item.session} className="card-elevated p-3.5 rounded-xl space-y-2">
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
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-profit transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, Number(item.winRate)))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day of Week Analysis */}
      <div className="card p-5 space-y-4">
        <h3 className="font-bold text-clean text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" /> Day of Week Distribution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {dayOfWeekBreakdown.map((item) => (
            <div key={item.day} className="card-elevated p-3 rounded-xl text-center space-y-1.5">
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
    <div className="card p-4 space-y-1.5">
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
