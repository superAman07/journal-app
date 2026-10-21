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
  Award,
  Layers,
  Calendar,
  Filter,
  Flame,
  Activity,
  Percent,
  Dna,
  BrainCircuit,
  CalendarRange,
  ShieldCheck,
} from "lucide-react";
import { convertPnlToInr, formatAggregatedPnl } from "@/lib/utils/currency";
import { useExchangeRate } from "@/lib/hooks/use-exchange-rate";

interface TradeData {
  id: string;
  date: string | Date;
  market?: string | null;
  instrument?: string | null;
  session?: string | null;
  setup?: string | null;
  outcome?: string | null;
  pnl?: number | null;
  rMultiple?: number | null;
  actualRR?: number | null;
  riskPercent?: number | null;
  entryTime?: string | Date | null;
  exitTime?: string | Date | null;
  rulesFollowed?: boolean | null;
}

type AnalyticsTab = "overview" | "dna" | "audits";

export function AnalyticsView({
  initialTrades = [],
}: {
  initialTrades?: TradeData[];
  usdInrRate?: number;
}) {
  const { rate: hookRate } = useExchangeRate();
  const usdInrRate = Number.isFinite(hookRate) && hookRate > 0 ? hookRate : 85.0;

  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
  const [selectedMarket, setSelectedMarket] = useState<string>("ALL");
  const [selectedSession, setSelectedSession] = useState<string>("ALL");
  const [timeRange, setTimeRange] = useState<"ALL" | "30D" | "90D">("ALL");

  const markets = useMemo(() => {
    const set = new Set(initialTrades.map((t) => t.market || "Other"));
    return ["ALL", ...Array.from(set)];
  }, [initialTrades]);

  const sessions = useMemo(() => {
    const set = new Set(initialTrades.map((t) => t.session || "Regular"));
    return ["ALL", ...Array.from(set)];
  }, [initialTrades]);

  const filteredTrades = useMemo(() => {
    let list = [...initialTrades];

    if (selectedMarket !== "ALL") {
      list = list.filter((t) => (t.market || "Other") === selectedMarket);
    }
    if (selectedSession !== "ALL") {
      list = list.filter((t) => (t.session || "Regular") === selectedSession);
    }
    if (timeRange !== "ALL") {
      const now = new Date().getTime();
      const days = timeRange === "30D" ? 30 : 90;
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      list = list.filter((t) => new Date(t.date).getTime() >= cutoff);
    }

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [initialTrades, selectedMarket, selectedSession, timeRange]);

  const totalTrades = filteredTrades.length;
  const wins = filteredTrades.filter((t) => t.outcome === "WIN");
  const losses = filteredTrades.filter((t) => t.outcome === "LOSS");
  const winCount = wins.length;
  const lossCount = losses.length;
  const winRate = totalTrades > 0 ? ((winCount / totalTrades) * 100).toFixed(1) : "0.0";

  const tradesWithInrPnL = useMemo(() => {
    return filteredTrades.map((t) => ({
      ...t,
      marketClean: t.market || "Other",
      sessionClean: t.session || "Regular",
      pnlInr: convertPnlToInr(Number(t.pnl || 0), t.market || "", usdInrRate),
    }));
  }, [filteredTrades, usdInrRate]);

  const totalPnLInr = useMemo(() => {
    return tradesWithInrPnL.reduce((sum, t) => sum + (Number.isFinite(t.pnlInr) ? t.pnlInr : 0), 0);
  }, [tradesWithInrPnL]);

  const grossProfit = useMemo(() => {
    return tradesWithInrPnL
      .filter((t) => t.pnlInr > 0)
      .reduce((sum, t) => sum + t.pnlInr, 0);
  }, [tradesWithInrPnL]);

  const grossLoss = useMemo(() => {
    return Math.abs(
      tradesWithInrPnL
        .filter((t) => t.pnlInr < 0)
        .reduce((sum, t) => sum + t.pnlInr, 0)
    );
  }, [tradesWithInrPnL]);

  const profitFactor = useMemo(() => {
    if (grossLoss === 0) return grossProfit > 0 ? "∞" : "0.00";
    return (grossProfit / grossLoss).toFixed(2);
  }, [grossProfit, grossLoss]);

  const avgRR = useMemo(() => {
    if (totalTrades === 0) return "0.00";
    const sum = filteredTrades.reduce((acc, t) => acc + Number(t.actualRR || t.rMultiple || 0), 0);
    return (sum / totalTrades).toFixed(2);
  }, [filteredTrades, totalTrades]);

  const avgHoldingTimeFormatted = useMemo(() => {
    const withDuration = filteredTrades.filter((t) => t.entryTime && t.exitTime);
    if (withDuration.length === 0) return "—";
    const totalMins = withDuration.reduce((acc, t) => {
      const start = new Date(t.entryTime!).getTime();
      const end = new Date(t.exitTime!).getTime();
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
        return acc + (end - start) / (1000 * 60);
      }
      return acc;
    }, 0);
    const avgMins = Math.round(totalMins / withDuration.length);
    if (!Number.isFinite(avgMins) || avgMins <= 0) return "—";
    const h = Math.floor(avgMins / 60);
    const m = avgMins % 60;
    return `${h}h ${m}m`;
  }, [filteredTrades]);

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

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [chartView, setChartView] = useState<"curve" | "candles">("curve");

  const equityCurveData = useMemo(() => {
    let cumulative = 0;
    return tradesWithInrPnL.map((t, idx) => {
      cumulative += t.pnlInr;
      return {
        step: idx + 1,
        date: new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        instrument: t.instrument || "Scrip",
        outcome: t.outcome || "N/A",
        pnl: t.pnlInr,
        cumulative,
      };
    });
  }, [tradesWithInrPnL]);

  const svgPathData = useMemo(() => {
    if (equityCurveData.length === 0) {
      return {
        path: "",
        area: "",
        points: [],
        segments: [],
        zeroY: null,
        candleBars: [],
        minVal: 0,
        maxVal: 0,
      };
    }

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
      const data = idx === 0 ? null : equityCurveData[idx - 1];
      const isWin = data ? data.pnl > 0 : false;
      const isLoss = data ? data.pnl < 0 : false;
      const pointColor = idx === 0 ? "#94a3b8" : isWin ? "#0bd07f" : isLoss ? "#ff5757" : "#94a3b8";

      return {
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y) ? y : 0,
        val,
        data,
        isWin,
        isLoss,
        pointColor,
      };
    });

    const path = points.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const area = `${path} L ${lastX} ${height} L ${firstX} ${height} Z`;

    // Calculate individual segments: Going UP = Green (#0bd07f), Going DOWN = Red (#ff5757)
    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const isUp = p2.val > p1.val;
      const isDown = p2.val < p1.val;
      const color = isUp ? "#0bd07f" : isDown ? "#ff5757" : "#94a3b8";

      segments.push({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        isUp,
        isDown,
        color,
        step: i + 1,
        tradeData: p2.data,
      });
    }

    // Zero-line baseline Y-coordinate
    let zeroY: number | null = null;
    if (minVal <= 0 && maxVal >= 0) {
      const calculatedZero = height - padding - ((0 - minVal) / range) * (height - 2 * padding);
      if (Number.isFinite(calculatedZero)) {
        zeroY = calculatedZero;
      }
    }

    // Candlestick / PnL Trade Flow Bars
    const maxAbsPnl = Math.max(...equityCurveData.map((d) => Math.abs(d.pnl)), 100);
    const candleCount = equityCurveData.length;
    const barWidth = Math.min(22, Math.max(8, (width - 2 * padding) / candleCount - 4));
    const midY = 90;

    const candleBars = equityCurveData.map((d, i) => {
      const x = padding + (i / (candleCount - 1 || 1)) * (width - 2 * padding);
      const isWin = d.pnl >= 0;
      const barHeight = Math.max(5, (Math.abs(d.pnl) / maxAbsPnl) * (height / 2 - padding - 4));
      const y = isWin ? midY - barHeight : midY;

      return {
        x,
        y,
        barWidth,
        barHeight,
        isWin,
        color: isWin ? "#0bd07f" : "#ff5757",
        pnl: d.pnl,
        data: d,
        stepIndex: i + 1,
      };
    });

    return { path, area, points, segments, zeroY, candleBars, minVal, maxVal };
  }, [equityCurveData]);

  const marketBreakdown = useMemo(() => {
    const map: Record<string, { trades: number; wins: number; pnl: number }> = {};
    tradesWithInrPnL.forEach((t) => {
      const m = t.marketClean;
      if (!map[m]) map[m] = { trades: 0, wins: 0, pnl: 0 };
      map[m].trades += 1;
      if (t.outcome === "WIN") map[m].wins += 1;
      map[m].pnl += t.pnlInr;
    });

    return Object.entries(map).map(([m, data]) => ({
      market: m,
      trades: data.trades,
      winRate: ((data.wins / data.trades) * 100).toFixed(0),
      pnl: data.pnl,
    }));
  }, [tradesWithInrPnL]);

  const sessionBreakdown = useMemo(() => {
    const map: Record<string, { trades: number; wins: number; pnl: number }> = {};
    tradesWithInrPnL.forEach((t) => {
      const s = t.sessionClean;
      if (!map[s]) map[s] = { trades: 0, wins: 0, pnl: 0 };
      map[s].trades += 1;
      if (t.outcome === "WIN") map[s].wins += 1;
      map[s].pnl += t.pnlInr;
    });

    return Object.entries(map).map(([s, data]) => ({
      session: s,
      trades: data.trades,
      winRate: ((data.wins / data.trades) * 100).toFixed(0),
      pnl: data.pnl,
    }));
  }, [tradesWithInrPnL]);

  const dayOfWeekBreakdown = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const map: Record<string, { trades: number; wins: number; pnl: number }> = {};
    days.forEach((d) => (map[d] = { trades: 0, wins: 0, pnl: 0 }));

    tradesWithInrPnL.forEach((t) => {
      const dNum = new Date(t.date).getDay();
      const dayName = days[dNum >= 0 && dNum <= 6 ? dNum : 0];
      if (map[dayName]) {
        map[dayName].trades += 1;
        if (t.outcome === "WIN") map[dayName].wins += 1;
        map[dayName].pnl += t.pnlInr;
      }
    });

    return days
      .filter((d) => map[d].trades > 0)
      .map((d) => ({
        day: d,
        trades: map[d].trades,
        winRate: ((map[d].wins / map[d].trades) * 100).toFixed(0),
        pnl: map[d].pnl,
      }));
  }, [tradesWithInrPnL]);

  const topMarket = useMemo(() => {
    if (marketBreakdown.length === 0) return "N/A";
    return [...marketBreakdown].sort((a, b) => b.trades - a.trades)[0]?.market || "N/A";
  }, [marketBreakdown]);

  const bestSession = useMemo(() => {
    if (sessionBreakdown.length === 0) return "N/A";
    return [...sessionBreakdown].sort((a, b) => b.pnl - a.pnl)[0]?.session || "N/A";
  }, [sessionBreakdown]);

  const rulesFollowedCount = useMemo(() => {
    return filteredTrades.filter((t) => Boolean(t.rulesFollowed)).length;
  }, [filteredTrades]);

  const ruleFollowRate = totalTrades > 0 ? ((rulesFollowedCount / totalTrades) * 100).toFixed(1) : "100";

  const psychologyScore = useMemo(() => {
    if (totalTrades === 0) return 100;
    const ruleScore = (rulesFollowedCount / totalTrades) * 70;
    const winScore = (Number(winRate) / 100) * 30;
    return Math.min(100, Math.max(0, Math.round(ruleScore + winScore)));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-solid pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" /> Performance & Intelligence Hub
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Quantitative execution stats, trading fingerprint, equity curve, and discipline reviews.
          </p>
        </div>

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

      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="card p-3 sm:p-4 rounded-2xl border border-border-solid bg-card shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted font-semibold mr-1">
                <Filter className="h-3.5 w-3.5 text-accent" />
                <span>Filters:</span>
              </div>

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

          <div className="card p-5 rounded-2xl border border-border-solid bg-card shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-clean text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" /> Cumulative Equity Growth Curve
                </h3>
                <p className="text-[11px] text-muted">
                  Dynamic trade trajectory: <span className="text-profit font-semibold">Green climbs</span> for winning trades, <span className="text-loss font-semibold">Red dips</span> for losses.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {/* View Switcher: Equity Curve vs PnL Candles */}
                <div className="flex items-center gap-1 p-0.5 bg-surface border border-border-solid rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setChartView("curve")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      chartView === "curve"
                        ? "bg-accent text-white shadow-xs"
                        : "text-muted hover:text-clean"
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>Curve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartView("candles")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      chartView === "candles"
                        ? "bg-accent text-white shadow-xs"
                        : "text-muted hover:text-clean"
                    }`}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>PnL Candles</span>
                  </button>
                </div>

                <span className="text-xs font-mono font-bold text-soft bg-surface px-2.5 py-1 rounded-xl border border-border-solid">
                  {totalTrades} Executions
                </span>
              </div>
            </div>

            {equityCurveData.length > 1 ? (
              <div className="relative w-full h-60 bg-surface/50 rounded-xl p-3 border border-border-solid flex flex-col justify-between overflow-hidden">
                {/* Hover Tooltip HUD */}
                {hoveredIndex !== null && svgPathData.points[hoveredIndex]?.data && (
                  <div
                    className="absolute top-3 z-10 bg-card/95 backdrop-blur-md border border-border-solid rounded-xl p-2.5 shadow-xl transition-all duration-150 pointer-events-none flex items-center gap-3 animate-in fade-in zoom-in-95"
                    style={{
                      left: `${Math.min(Math.max((svgPathData.points[hoveredIndex].x / 600) * 100, 12), 85)}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-clean">
                          {svgPathData.points[hoveredIndex].data.instrument}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            svgPathData.points[hoveredIndex].data.outcome === "WIN"
                              ? "bg-profit/15 text-profit border border-profit/30"
                              : svgPathData.points[hoveredIndex].data.outcome === "LOSS"
                              ? "bg-loss/15 text-loss border border-loss/30"
                              : "bg-dim/15 text-dim border border-dim/30"
                          }`}
                        >
                          {svgPathData.points[hoveredIndex].data.outcome}
                        </span>
                      </div>
                      <span className="text-[10px] text-dim block mt-0.5 font-mono">
                        Trade #{svgPathData.points[hoveredIndex].data.step} · {svgPathData.points[hoveredIndex].data.date}
                      </span>
                    </div>

                    <div className="border-l border-border-solid pl-3 text-right font-mono">
                      <span
                        className={`text-xs font-black block ${
                          svgPathData.points[hoveredIndex].data.pnl >= 0 ? "text-profit" : "text-loss"
                        }`}
                      >
                        {svgPathData.points[hoveredIndex].data.pnl >= 0 ? "+" : ""}
                        {formatAggregatedPnl(svgPathData.points[hoveredIndex].data.pnl)}
                      </span>
                      <span className="text-[10px] text-soft block">
                        Net: {formatAggregatedPnl(svgPathData.points[hoveredIndex].data.cumulative)}
                      </span>
                    </div>
                  </div>
                )}

                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 600 180"
                  preserveAspectRatio="none"
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <defs>
                    {/* Split Gradient: Green above zero baseline, Red below zero baseline */}
                    <linearGradient id="splitEquityGradient" x1="0" y1="0" x2="0" y2="1">
                      {svgPathData.zeroY !== null ? (
                        <>
                          <stop offset="0%" stopColor="#0bd07f" stopOpacity="0.28" />
                          <stop
                            offset={`${Math.min(95, Math.max(5, (svgPathData.zeroY / 180) * 100))}%`}
                            stopColor="#0bd07f"
                            stopOpacity="0.03"
                          />
                          <stop
                            offset={`${Math.min(95, Math.max(5, (svgPathData.zeroY / 180) * 100))}%`}
                            stopColor="#ff5757"
                            stopOpacity="0.03"
                          />
                          <stop offset="100%" stopColor="#ff5757" stopOpacity="0.28" />
                        </>
                      ) : (
                        <>
                          <stop
                            offset="0%"
                            stopColor={totalPnLInr >= 0 ? "#0bd07f" : "#ff5757"}
                            stopOpacity="0.25"
                          />
                          <stop
                            offset="100%"
                            stopColor={totalPnLInr >= 0 ? "#0bd07f" : "#ff5757"}
                            stopOpacity="0.02"
                          />
                        </>
                      )}
                    </linearGradient>
                  </defs>

                  {/* ₹0 Breakeven Reference Baseline (when applicable) */}
                  {svgPathData.zeroY !== null && (
                    <g>
                      <line
                        x1={15}
                        y1={svgPathData.zeroY}
                        x2={585}
                        y2={svgPathData.zeroY}
                        stroke="rgba(255,255,255,0.2)"
                        strokeDasharray="4 4"
                        strokeWidth="1.2"
                      />
                      <text
                        x={585}
                        y={svgPathData.zeroY - 4}
                        fill="rgba(255,255,255,0.4)"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        ₹0 Breakeven
                      </text>
                    </g>
                  )}

                  {/* Vertical Tracking Crosshair on Hover */}
                  {hoveredIndex !== null && (
                    <line
                      x1={svgPathData.points[hoveredIndex].x}
                      y1={15}
                      x2={svgPathData.points[hoveredIndex].x}
                      y2={165}
                      stroke="rgba(255,255,255,0.25)"
                      strokeDasharray="3 3"
                      strokeWidth="1.2"
                    />
                  )}

                  {chartView === "curve" ? (
                    <>
                      {/* Area Fill with Split Gradient */}
                      <path d={svgPathData.area} fill="url(#splitEquityGradient)" />

                      {/* Dynamic Multi-Colored Segments: UP = Green (#0bd07f), DOWN = Red (#ff5757) */}
                      {svgPathData.segments.map((seg, i) => (
                        <line
                          key={`seg-${i}`}
                          x1={seg.x1}
                          y1={seg.y1}
                          x2={seg.x2}
                          y2={seg.y2}
                          stroke={seg.color}
                          strokeWidth={hoveredIndex === i + 1 ? "3.5" : "2.5"}
                          strokeLinecap="round"
                          className="transition-all duration-150"
                        />
                      ))}

                      {/* Trade Points: Color-coded (Green for WIN, Red for LOSS) */}
                      {svgPathData.points.map((p, i) => {
                        const isHovered = hoveredIndex === i;
                        return (
                          <g key={`pt-${i}`}>
                            {/* Larger Invisible Hover Target */}
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="18"
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredIndex(i)}
                            />

                            {/* Ping Animation Ring on Hover */}
                            {isHovered && (
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="8"
                                fill="none"
                                stroke={p.pointColor}
                                strokeWidth="2"
                                className="animate-ping opacity-75"
                              />
                            )}

                            {/* Main Point Dot */}
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={isHovered ? 6 : 4}
                              fill={p.pointColor}
                              stroke={isHovered ? "#fff" : "rgba(0,0,0,0.7)"}
                              strokeWidth={isHovered ? 2 : 1.5}
                              className="transition-all duration-150 cursor-pointer shadow-md"
                            />
                          </g>
                        );
                      })}
                    </>
                  ) : (
                    /* Candlestick / PnL Trade Flow Chart View */
                    <g>
                      {/* Baseline Mid-Line */}
                      <line
                        x1={15}
                        y1={90}
                        x2={585}
                        y2={90}
                        stroke="rgba(255,255,255,0.2)"
                        strokeDasharray="4 4"
                        strokeWidth="1.2"
                      />
                      <text
                        x={585}
                        y={86}
                        fill="rgba(255,255,255,0.4)"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        ₹0 Level
                      </text>

                      {/* Candlestick Bars for each trade */}
                      {svgPathData.candleBars.map((bar, i) => {
                        const isHovered = hoveredIndex === bar.stepIndex;
                        const wickY1 = bar.isWin ? bar.y - 6 : bar.y;
                        const wickY2 = bar.isWin ? bar.y + bar.barHeight : bar.y + bar.barHeight + 6;

                        return (
                          <g
                            key={`bar-${i}`}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(bar.stepIndex)}
                          >
                            {/* Candle Wick */}
                            <line
                              x1={bar.x}
                              y1={wickY1}
                              x2={bar.x}
                              y2={wickY2}
                              stroke={bar.color}
                              strokeWidth="1.5"
                              strokeOpacity={isHovered ? 1 : 0.6}
                            />

                            {/* Candle Body */}
                            <rect
                              x={bar.x - bar.barWidth / 2}
                              y={bar.y}
                              width={bar.barWidth}
                              height={bar.barHeight}
                              rx="3"
                              fill={bar.color}
                              fillOpacity={isHovered ? 1 : 0.85}
                              stroke={isHovered ? "#fff" : bar.color}
                              strokeWidth={isHovered ? 1.5 : 1}
                              className="transition-all duration-150 shadow-sm"
                            />
                          </g>
                        );
                      })}

                      {/* Cumulative Overlay Curve Line */}
                      <path
                        d={svgPathData.path}
                        fill="none"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    </g>
                  )}
                </svg>

                {/* Bottom Legend */}
                <div className="flex items-center justify-between text-[10px] text-muted font-mono pt-2 border-t border-border/20">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-profit" />
                      <span>Win / Profit Climb</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-loss" />
                      <span>Loss / Drawdown</span>
                    </span>
                  </div>

                  <span className="text-dim">Hover points to inspect individual trade PnL</span>
                </div>
              </div>
            ) : (
              <div className="h-32 bg-surface/40 rounded-xl flex items-center justify-center text-xs text-muted border border-border-solid">
                Log at least 2 trades to display cumulative equity curve chart.
              </div>
            )}
          </div>

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

      {activeTab === "dna" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
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
