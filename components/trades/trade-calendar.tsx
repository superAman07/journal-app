"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Eye,
  Edit2,
  Flame,
  X,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { formatRMultiple } from "@/lib/utils";
import {
  isIndianMarket,
  formatPnlWithCurrency,
  formatAggregatedPnl,
  convertPnlToInr,
} from "@/lib/utils/currency";

interface TradeCalendarProps {
  trades: any[];
  rate: number;
  onViewTrade: (trade: any) => void;
  onEditTrade: (trade: any) => void;
}

// ── Reusable SVG Donut Chart ──
function DonutChart({
  segments,
  size = 120,
  strokeWidth = 18,
  label,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentOffset = 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((seg, i) => {
            const pct = seg.value / total;
            const dashLength = pct * circumference;
            const dashGap = circumference - dashLength;
            const offset = currentOffset;
            currentOffset += dashLength;

            return (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${dashGap}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${center} ${center})`}
                style={{ transition: "stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease" }}
              />
            );
          })}
        </svg>
        {label && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[clamp(10px,1.2vw,13px)] font-bold text-clean">{total}</span>
            <span className="text-[clamp(8px,1vw,10px)] text-dim uppercase tracking-wider font-semibold">{label}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {segments.filter(s => s.value > 0).map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[clamp(9px,1vw,11px)] text-muted font-medium">
              {seg.label} <strong className="text-soft">{seg.value}</strong>{" "}
              <span className="text-dim">({((seg.value / total) * 100).toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mini Sparkline for cumulative PnL ──
function MiniSparkline({ values, width = 120, height = 32 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 2;

  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (width - 2 * pad);
      const y = height - pad - ((v - min) / range) * (height - 2 * pad);
      return `${x},${y}`;
    })
    .join(" ");

  const lastVal = values[values.length - 1];
  const color = lastVal >= 0 ? "var(--color-profit)" : "var(--color-loss)";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Day of Week Bar Chart ──
function DayOfWeekChart({ trades, rate }: { trades: any[]; rate: number }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayData = useMemo(() => {
    const map: Record<string, { pnl: number; trades: number; wins: number }> = {};
    days.forEach((d) => (map[d] = { pnl: 0, trades: 0, wins: 0 }));

    trades.forEach((t) => {
      const dayIdx = new Date(t.date).getDay();
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIdx];
      if (map[dayName]) {
        map[dayName].pnl += convertPnlToInr(Number(t.pnl), t.market, rate);
        map[dayName].trades += 1;
        if (t.outcome === "WIN") map[dayName].wins += 1;
      }
    });

    return days.map((d) => ({
      day: d,
      pnl: map[d].pnl,
      trades: map[d].trades,
      winRate: map[d].trades > 0 ? (map[d].wins / map[d].trades) * 100 : 0,
    }));
  }, [trades, rate]);

  const maxAbsPnl = Math.max(...dayData.map((d) => Math.abs(d.pnl)), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-[clamp(11px,1.2vw,13px)] font-bold text-clean flex items-center gap-1.5">
        <BarChart3 className="h-3.5 w-3.5 text-accent" /> Day-of-Week Performance
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {dayData.map((d) => {
          const barPct = maxAbsPnl > 0 ? (Math.abs(d.pnl) / maxAbsPnl) * 100 : 0;
          return (
            <div
              key={d.day}
              className="card-accent p-2.5 rounded-xl text-center space-y-1.5"
              style={{ borderLeftColor: d.pnl >= 0 ? "var(--color-profit)" : d.pnl < 0 ? "var(--color-loss)" : "var(--color-muted)" }}
            >
              <span className="text-[clamp(10px,1.1vw,12px)] font-extrabold text-clean block">{d.day}</span>
              <div className="h-12 flex items-end justify-center">
                <div
                  className="w-5 rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(barPct, d.trades > 0 ? 10 : 0)}%`,
                    backgroundColor: d.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)",
                    opacity: d.trades > 0 ? 0.7 : 0.15,
                  }}
                />
              </div>
              <span className={`text-[clamp(9px,1vw,11px)] font-mono font-bold block ${d.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                {d.trades > 0 ? formatAggregatedPnl(d.pnl) : "\u2014"}
              </span>
              <span className="text-[clamp(8px,0.9vw,10px)] text-dim block">
                {d.trades > 0 ? `${d.trades}t \u00B7 ${d.winRate.toFixed(0)}%` : "No trades"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN CALENDAR COMPONENT
// ═══════════════════════════════════════════
export function TradeCalendar({ trades, rate, onViewTrade, onEditTrade }: TradeCalendarProps) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDate(null);
  };

  // ── Compute daily PnL map ──
  const dailyData = useMemo(() => {
    const map: Record<string, { pnl: number; trades: any[]; wins: number; losses: number }> = {};
    trades.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = { pnl: 0, trades: [], wins: 0, losses: 0 };
      map[key].pnl += convertPnlToInr(Number(t.pnl), t.market, rate);
      map[key].trades.push(t);
      if (t.outcome === "WIN") map[key].wins++;
      if (t.outcome === "LOSS") map[key].losses++;
    });
    return map;
  }, [trades, rate]);

  // ── Calendar grid data ──
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const cells: { date: number; key: string; isCurrentMonth: boolean }[] = [];

    for (let i = 0; i < startDow; i++) {
      cells.push({ date: 0, key: `empty-${i}`, isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date: d, key, isCurrentMonth: true });
    }

    return cells;
  }, [currentMonth, currentYear]);

  // ── Monthly summary ──
  const monthlySummary = useMemo(() => {
    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const monthTrades = trades.filter((t) => {
      const d = new Date(t.date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return k === monthKey;
    });

    const totalPnl = monthTrades.reduce((sum, t) => sum + convertPnlToInr(Number(t.pnl), t.market, rate), 0);
    const wins = monthTrades.filter((t) => t.outcome === "WIN").length;
    const losses = monthTrades.filter((t) => t.outcome === "LOSS").length;
    const breakevens = monthTrades.filter((t) => t.outcome === "BREAKEVEN").length;
    const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;

    let cum = 0;
    const cumulativePnl = monthTrades
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((t) => {
        cum += convertPnlToInr(Number(t.pnl), t.market, rate);
        return cum;
      });

    const marketMap: Record<string, number> = {};
    monthTrades.forEach((t) => {
      marketMap[t.market] = (marketMap[t.market] || 0) + 1;
    });

    let currentStreak = 0;
    let bestStreak = 0;
    monthTrades.forEach((t) => {
      if (t.outcome === "WIN") {
        currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else if (t.outcome === "LOSS") {
        currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
      }
    });

    return {
      trades: monthTrades,
      totalPnl,
      wins,
      losses,
      breakevens,
      winRate,
      cumulativePnl: [0, ...cumulativePnl],
      marketBreakdown: Object.entries(marketMap).map(([market, count]) => ({
        label: market,
        value: count as number,
        color: market.includes("Nifty") ? "#4f6ef7" : market.includes("Bank") ? "#9b7dff" : market.includes("Gold") || market.includes("Crypto") ? "#f5a623" : "#0bd07f",
      })),
      currentStreak,
      bestStreak,
    };
  }, [trades, currentMonth, currentYear, rate]);

  const selectedDayTrades = selectedDate ? dailyData[selectedDate]?.trades || [] : [];

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isToday = (dateNum: number) => {
    return dateNum === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
  };

  return (
    <div className="space-y-4">
      {/* ── Monthly Summary KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        <div className={`card-accent ${monthlySummary.totalPnl >= 0 ? "card-accent-profit" : "card-accent-loss"} p-3 space-y-1`}>
          <span className="text-[clamp(9px,1vw,10px)] uppercase font-bold text-dim tracking-wider block">Monthly P&L</span>
          <span className={`text-[clamp(14px,1.8vw,20px)] font-mono font-black block ${monthlySummary.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
            {formatAggregatedPnl(monthlySummary.totalPnl)}
          </span>
          <MiniSparkline values={monthlySummary.cumulativePnl} width={100} height={24} />
        </div>

        <div className="card-accent card-accent-blue p-3 space-y-1">
          <span className="text-[clamp(9px,1vw,10px)] uppercase font-bold text-dim tracking-wider block">Total Trades</span>
          <span className="text-[clamp(14px,1.8vw,20px)] font-mono font-black text-clean block">{monthlySummary.trades.length}</span>
          <span className="text-[clamp(8px,0.9vw,10px)] text-dim font-medium">{monthlySummary.wins}W / {monthlySummary.losses}L / {monthlySummary.breakevens}BE</span>
        </div>

        <div className={`card-accent ${monthlySummary.winRate >= 50 ? "card-accent-profit" : "card-accent-loss"} p-3 space-y-1`}>
          <span className="text-[clamp(9px,1vw,10px)] uppercase font-bold text-dim tracking-wider block">Win Rate</span>
          <span className={`text-[clamp(14px,1.8vw,20px)] font-mono font-black block ${monthlySummary.winRate >= 50 ? "text-profit" : "text-loss"}`}>
            {monthlySummary.winRate.toFixed(1)}%
          </span>
          <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${monthlySummary.winRate}%`,
                backgroundColor: monthlySummary.winRate >= 50 ? "var(--color-profit)" : "var(--color-loss)",
              }}
            />
          </div>
        </div>

        <div className={`card-accent ${monthlySummary.currentStreak > 0 ? "card-accent-profit" : monthlySummary.currentStreak < 0 ? "card-accent-loss" : "card-accent-neutral"} p-3 space-y-1`}>
          <span className="text-[clamp(9px,1vw,10px)] uppercase font-bold text-dim tracking-wider block">Streak</span>
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-warn" />
            <span className={`text-[clamp(14px,1.8vw,20px)] font-mono font-black block ${monthlySummary.currentStreak > 0 ? "text-profit" : monthlySummary.currentStreak < 0 ? "text-loss" : "text-clean"}`}>
              {monthlySummary.currentStreak > 0 ? `+${monthlySummary.currentStreak}` : monthlySummary.currentStreak}
            </span>
          </div>
          <span className="text-[clamp(8px,0.9vw,10px)] text-dim font-medium">Best: +{monthlySummary.bestStreak}W</span>
        </div>

        <div className="card-accent card-accent-purple p-3 flex items-center justify-center">
          <DonutChart
            segments={[
              { value: monthlySummary.wins, color: "#0bd07f", label: "Win" },
              { value: monthlySummary.losses, color: "#ff5757", label: "Loss" },
              { value: monthlySummary.breakevens, color: "#5c5e7a", label: "BE" },
            ]}
            size={90}
            strokeWidth={14}
            label="Trades"
          />
        </div>

        <div className="card-accent card-accent-warn p-3 flex items-center justify-center">
          <DonutChart
            segments={monthlySummary.marketBreakdown}
            size={90}
            strokeWidth={14}
            label="Markets"
          />
        </div>
      </div>

      {/* ── Calendar Header: Month Navigation ── */}
      <div className="card-top-accent p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" />
            <h2 className="text-[clamp(13px,1.4vw,16px)] font-bold text-clean">{monthName}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={goToToday}
              className="px-2.5 py-1 rounded-lg text-[clamp(9px,1vw,11px)] font-bold text-accent bg-accent-muted hover:bg-accent/20 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button onClick={goToPrevMonth} className="h-7 w-7 rounded-lg bg-elevated hover:bg-overlay flex items-center justify-center text-muted hover:text-clean transition-colors cursor-pointer">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={goToNextMonth} className="h-7 w-7 rounded-lg bg-elevated hover:bg-overlay flex items-center justify-center text-muted hover:text-clean transition-colors cursor-pointer">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Weekday Headers ── */}
        <div className="grid grid-cols-7 gap-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="text-center text-[clamp(9px,1vw,11px)] font-bold text-dim uppercase tracking-wider py-1">
              {day}
            </div>
          ))}
        </div>

        {/* ── Calendar Grid ── */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell) => {
            if (!cell.isCurrentMonth) {
              return <div key={cell.key} className="aspect-square" />;
            }

            const dayInfo = dailyData[cell.key];
            const hasTrades = dayInfo && dayInfo.trades.length > 0;
            const isSelected = selectedDate === cell.key;
            const todayClass = isToday(cell.date);

            return (
              <button
                key={cell.key}
                onClick={() => setSelectedDate(isSelected ? null : hasTrades ? cell.key : null)}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer relative
                  ${isSelected ? "ring-2 ring-accent bg-accent-muted" : ""}
                  ${hasTrades ? "hover:bg-elevated" : "hover:bg-surface"}
                  ${todayClass ? "ring-1 ring-accent/50" : ""}
                `}
              >
                <span className={`text-[clamp(10px,1.2vw,13px)] font-bold ${todayClass ? "text-accent" : hasTrades ? "text-clean" : "text-dim"}`}>
                  {cell.date}
                </span>

                {hasTrades ? (
                  <>
                    <div
                      className={`h-[clamp(6px,1vw,10px)] w-[clamp(6px,1vw,10px)] rounded-full ${
                        dayInfo.pnl > 0 ? "bg-profit" : dayInfo.pnl < 0 ? "bg-loss" : "bg-muted"
                      }`}
                      style={{
                        boxShadow: dayInfo.pnl > 0
                          ? "0 0 6px rgba(11,208,127,0.4)"
                          : dayInfo.pnl < 0
                          ? "0 0 6px rgba(255,87,87,0.4)"
                          : "none",
                      }}
                    />
                    <span className={`text-[clamp(7px,0.8vw,9px)] font-mono font-bold leading-none ${
                      dayInfo.pnl >= 0 ? "text-profit" : "text-loss"
                    }`}>
                      {formatAggregatedPnl(dayInfo.pnl)}
                    </span>
                  </>
                ) : (
                  <span className="text-[clamp(7px,0.8vw,9px)] text-dim/30">{"\u2014"}</span>
                )}

                {hasTrades && dayInfo.trades.length > 1 && (
                  <span className="absolute top-0.5 right-1 text-[clamp(7px,0.7vw,8px)] font-bold text-dim bg-elevated rounded-full h-3.5 w-3.5 flex items-center justify-center">
                    {dayInfo.trades.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Day Expansion Panel ── */}
      {selectedDate && selectedDayTrades.length > 0 && (
        <div className="card-accent card-accent-blue p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[clamp(11px,1.2vw,13px)] font-bold text-clean">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="badge badge-accent text-[9px]">{selectedDayTrades.length} trade{selectedDayTrades.length > 1 ? "s" : ""}</span>
            </div>
            <button onClick={() => setSelectedDate(null)} className="h-6 w-6 rounded-lg bg-elevated hover:bg-overlay flex items-center justify-center text-dim hover:text-clean cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {selectedDayTrades.map((trade: any) => {
              const pnlNum = Number(trade.pnl);
              const rrNum = Number(trade.actualRR || trade.rMultiple);
              const isInr = isIndianMarket(trade.market);
              const pnlInInr = convertPnlToInr(pnlNum, trade.market, rate);

              return (
                <div
                  key={trade.id}
                  className={`card-accent p-3 rounded-xl cursor-pointer hover:border-accent/40 transition-all ${
                    trade.outcome === "WIN"
                      ? "card-accent-profit"
                      : trade.outcome === "LOSS"
                      ? "card-accent-loss"
                      : "card-accent-neutral"
                  }`}
                  onClick={() => onViewTrade(trade)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[clamp(11px,1.2vw,13px)] font-bold text-clean truncate">{trade.instrument}</span>
                      <span className={`badge text-[9px] ${trade.outcome === "WIN" ? "badge-profit" : trade.outcome === "LOSS" ? "badge-loss" : "badge-neutral"}`}>
                        {trade.outcome}
                      </span>
                      <span className="badge badge-neutral text-[9px] hidden sm:inline-flex">{trade.session}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className={`font-mono text-[clamp(11px,1.2vw,13px)] font-bold ${pnlNum >= 0 ? "text-profit" : "text-loss"}`}>
                          {formatPnlWithCurrency(pnlNum, trade.market)}
                        </span>
                        {!isInr && (
                          <span className="text-[9px] text-dim font-mono block">{"\u2248"} {formatAggregatedPnl(pnlInInr)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onViewTrade(trade)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-dim hover:text-accent hover:bg-accent-muted transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onEditTrade(trade)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-dim hover:text-accent hover:bg-accent-muted transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-[clamp(9px,1vw,11px)] text-muted">
                    <span>Entry: <strong className="text-soft font-mono">{Number(trade.actualEntry)}</strong></span>
                    <span>SL: <strong className="text-loss font-mono">{Number(trade.stopLoss)}</strong></span>
                    <span>Exit: <strong className="text-profit font-mono">{Number(trade.actualExit)}</strong></span>
                    <span className="ml-auto">
                      R: <strong className={`font-mono ${rrNum >= 0 ? "text-profit" : "text-loss"}`}>{formatRMultiple(rrNum)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedDayTrades.length > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-border/20 text-[clamp(10px,1.1vw,12px)]">
              <span className="text-dim font-semibold">Day Total</span>
              <span className={`font-mono font-bold ${(dailyData[selectedDate]?.pnl || 0) >= 0 ? "text-profit" : "text-loss"}`}>
                {formatAggregatedPnl(dailyData[selectedDate]?.pnl || 0)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Day of Week Chart ── */}
      <DayOfWeekChart trades={monthlySummary.trades} rate={rate} />
    </div>
  );
}
