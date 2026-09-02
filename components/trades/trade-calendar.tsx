"use client";

import { useState, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Eye,
  Edit2,
  Flame,
  X,
  Target,
  BarChart3,
  Award,
  Sparkles,
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

type DateRangeOption = "1M" | "3M" | "6M" | "1Y" | "ALL";

// ── Flag-Style Horizontal Distribution Bar ──
function HorizontalFlagBar({
  title,
  segments,
}: {
  title: string;
  segments: { label: string; count: number; percentage: number; color: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-clean tracking-tight">{title}</span>
        <span className="text-[11px] font-mono text-dim font-medium">{total} total</span>
      </div>

      {/* Flag-style segmented horizontal bar */}
      <div className="h-3 w-full rounded-full bg-elevated overflow-hidden flex shadow-inner">
        {total === 0 ? (
          <div className="w-full h-full bg-surface" />
        ) : (
          segments.map((seg, i) =>
            seg.percentage > 0 ? (
              <div
                key={i}
                style={{
                  width: `${seg.percentage}%`,
                  backgroundColor: seg.color,
                }}
                className="h-full transition-all duration-500 relative group"
                title={`${seg.label}: ${seg.count} (${seg.percentage.toFixed(1)}%)`}
              />
            ) : null
          )
        )}
      </div>

      {/* Legend with Flag Pill Tags */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface border border-border-solid text-[11px]"
          >
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-muted font-medium">{seg.label}</span>
            <span className="font-mono font-bold text-clean">
              {seg.count}
              <span className="text-[10px] text-dim ml-1">
                ({seg.percentage.toFixed(0)}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Single Month Compact Calendar Card ──
function MonthCalendarBlock({
  year,
  month,
  dailyData,
  selectedDate,
  onSelectDate,
}: {
  year: number;
  month: number;
  dailyData: Record<
    string,
    { pnl: number; trades: any[]; wins: number; losses: number; be: number }
  >;
  selectedDate: string | null;
  onSelectDate: (key: string) => void;
}) {
  const now = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  // Monday-based (0 = Mon, ..., 6 = Sun)
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  const cells: {
    date: number;
    key: string;
    isCurrentMonth: boolean;
  }[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ date: 0, key: `pad-prev-${i}`, isCurrentMonth: false });
  }

  let monthPnl = 0;
  let monthTradeCount = 0;

  for (let d = 1; d <= totalDays; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date: d, key, isCurrentMonth: true });
    if (dailyData[key]) {
      monthPnl += dailyData[key].pnl;
      monthTradeCount += dailyData[key].trades.length;
    }
  }

  const monthName = firstDay.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isToday = (dateNum: number) => {
    return (
      dateNum === now.getDate() &&
      month === now.getMonth() &&
      year === now.getFullYear()
    );
  };

  return (
    <div className="min-w-72.5 sm:min-w-[320px] max-w-85 shrink-0 card p-3 sm:p-4 rounded-2xl border border-border-solid bg-card shadow-sm space-y-2.5">
      {/* Month Header with Net P&L Chip */}
      <div className="flex items-center justify-between border-b border-border-solid pb-2">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-clean">{monthName}</h3>
          <span className="text-[10px] text-dim font-medium">
            {monthTradeCount} trade{monthTradeCount !== 1 ? "s" : ""}
          </span>
        </div>

        <span
          className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
            monthPnl > 0
              ? "bg-profit/15 text-profit border border-profit/30"
              : monthPnl < 0
              ? "bg-loss/15 text-loss border border-loss/30"
              : "bg-surface text-dim border border-border-solid"
          }`}
        >
          {formatAggregatedPnl(monthPnl)}
        </span>
      </div>

      {/* Weekday Labels (Mon to Sun) */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-dim uppercase tracking-wider">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, idx) => (
          <div key={idx} className="py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={cell.key}
                className="h-11 sm:h-12 rounded-lg bg-transparent opacity-0"
              />
            );
          }

          const dayInfo = dailyData[cell.key];
          const hasTrades = dayInfo && dayInfo.trades.length > 0;
          const isSelected = selectedDate === cell.key;
          const today = isToday(cell.date);

          const isProfitable = hasTrades && dayInfo.pnl > 0;
          const isLoss = hasTrades && dayInfo.pnl < 0;

          return (
            <button
              key={cell.key}
              onClick={() => (hasTrades ? onSelectDate(cell.key) : null)}
              disabled={!hasTrades}
              className={`
                h-11 sm:h-12 rounded-lg p-0.5 flex flex-col items-center justify-between transition-all relative select-none
                ${
                  isSelected
                    ? "ring-2 ring-accent bg-accent/20"
                    : hasTrades
                    ? "bg-surface hover:bg-elevated cursor-pointer"
                    : "bg-surface/25 cursor-default opacity-50"
                }
                ${today && !isSelected ? "border border-accent/40" : "border border-transparent"}
              `}
            >
              {/* AngelOne-style Circular Pill */}
              <div
                className={`
                  h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold transition-transform
                  ${
                    isProfitable
                      ? "bg-profit text-[#06060a] font-black shadow-sm"
                      : isLoss
                      ? "bg-loss text-white font-black shadow-sm"
                      : hasTrades
                      ? "bg-dim text-white font-black"
                      : today
                      ? "text-accent font-black"
                      : "text-dim"
                  }
                `}
              >
                {cell.date}
              </div>

              {/* Day P&L under circle */}
              <div className="w-full text-center">
                {hasTrades ? (
                  <span
                    className={`text-[8px] sm:text-[9px] font-mono font-bold block truncate leading-none ${
                      isProfitable
                        ? "text-profit"
                        : isLoss
                        ? "text-loss"
                        : "text-clean"
                    }`}
                  >
                    {formatAggregatedPnl(dayInfo.pnl)}
                  </span>
                ) : (
                  <span className="text-[9px] text-dim/30 block leading-none">
                    —
                  </span>
                )}
              </div>

              {/* Multi-trade count pill */}
              {hasTrades && dayInfo.trades.length > 1 && (
                <span className="absolute top-0.5 right-0.5 text-[7px] font-mono font-bold bg-overlay text-clean px-0.5 rounded-full">
                  {dayInfo.trades.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN TRADE CALENDAR
// ═══════════════════════════════════════════
export function TradeCalendar({
  trades,
  rate,
  onViewTrade,
  onEditTrade,
}: TradeCalendarProps) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [dateRange, setDateRange] = useState<DateRangeOption>("1M");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Month Stepper (used when single month is active) ──
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
    setDateRange("1M");
    setSelectedDate(null);
  };

  // ── Horizontal Scroll Helpers ──
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  // ── Daily Aggregation Map ──
  const dailyData = useMemo(() => {
    const map: Record<
      string,
      { pnl: number; trades: any[]; wins: number; losses: number; be: number }
    > = {};

    trades.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) {
        map[key] = { pnl: 0, trades: [], wins: 0, losses: 0, be: 0 };
      }
      map[key].pnl += convertPnlToInr(Number(t.pnl), t.market, rate);
      map[key].trades.push(t);
      if (t.outcome === "WIN") map[key].wins++;
      else if (t.outcome === "LOSS") map[key].losses++;
      else map[key].be++;
    });

    return map;
  }, [trades, rate]);

  // ── Generate list of months to show based on selected Date Range ──
  const displayedMonths = useMemo(() => {
    if (dateRange === "1M") {
      return [{ year: currentYear, month: currentMonth }];
    }

    let count = 1;
    if (dateRange === "3M") count = 3;
    else if (dateRange === "6M") count = 6;
    else if (dateRange === "1Y") count = 12;
    else if (dateRange === "ALL") {
      // Find earliest trade date
      if (trades.length > 0) {
        const timestamps = trades.map((t) => new Date(t.date).getTime());
        const minDate = new Date(Math.min(...timestamps));
        const diffMonths =
          (now.getFullYear() - minDate.getFullYear()) * 12 +
          (now.getMonth() - minDate.getMonth()) +
          1;
        count = Math.max(diffMonths, 1);
      } else {
        count = 12;
      }
    }

    const months: { year: number; month: number }[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
    }

    return months;
  }, [dateRange, currentYear, currentMonth, trades]);

  // ── Filter trades matching the active Date Range ──
  const rangeTrades = useMemo(() => {
    if (dateRange === "1M") {
      const k = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
      return trades.filter((t) => {
        const d = new Date(t.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === k;
      });
    }

    const allowedMonthKeys = new Set(
      displayedMonths.map(
        (m) => `${m.year}-${String(m.month + 1).padStart(2, "0")}`
      )
    );

    return trades.filter((t) => {
      const d = new Date(t.date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return allowedMonthKeys.has(k);
    });
  }, [trades, dateRange, currentYear, currentMonth, displayedMonths]);

  // ── Broker KPIs for Selected Range ──
  const metrics = useMemo(() => {
    const totalPnl = rangeTrades.reduce(
      (sum, t) => sum + convertPnlToInr(Number(t.pnl), t.market, rate),
      0
    );
    const wins = rangeTrades.filter((t) => t.outcome === "WIN");
    const losses = rangeTrades.filter((t) => t.outcome === "LOSS");
    const breakevens = rangeTrades.filter((t) => t.outcome === "BREAKEVEN");

    const grossProfit = wins.reduce(
      (sum, t) => sum + convertPnlToInr(Number(t.pnl), t.market, rate),
      0
    );
    const grossLoss = Math.abs(
      losses.reduce(
        (sum, t) => sum + convertPnlToInr(Number(t.pnl), t.market, rate),
        0
      )
    );

    const profitFactor =
      grossLoss > 0
        ? (grossProfit / grossLoss).toFixed(2)
        : grossProfit > 0
        ? "∞"
        : "0.00";

    const winRate =
      rangeTrades.length > 0 ? (wins.length / rangeTrades.length) * 100 : 0;

    const avgRR =
      rangeTrades.length > 0
        ? (
            rangeTrades.reduce(
              (sum, t) => sum + Number(t.actualRR || t.rMultiple || 0),
              0
            ) / rangeTrades.length
          ).toFixed(2)
        : "0.00";

    let bestDayPnl = 0;
    let worstDayPnl = 0;

    rangeTrades.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayInfo = dailyData[key];
      if (dayInfo) {
        if (dayInfo.pnl > bestDayPnl) bestDayPnl = dayInfo.pnl;
        if (dayInfo.pnl < worstDayPnl) worstDayPnl = dayInfo.pnl;
      }
    });

    const marketCounts: Record<string, number> = {};
    rangeTrades.forEach((t) => {
      marketCounts[t.market] = (marketCounts[t.market] || 0) + 1;
    });

    const marketColors = [
      "var(--color-accent)",
      "var(--color-ai)",
      "var(--color-warn)",
      "var(--color-profit)",
      "#38bdf8",
      "#f43f5e",
    ];

    const marketSegments = Object.entries(marketCounts).map(
      ([market, count], idx) => ({
        label: market,
        count,
        percentage:
          rangeTrades.length > 0 ? (count / rangeTrades.length) * 100 : 0,
        color: marketColors[idx % marketColors.length],
      })
    );

    const outcomeSegments = [
      {
        label: "Wins",
        count: wins.length,
        percentage:
          rangeTrades.length > 0 ? (wins.length / rangeTrades.length) * 100 : 0,
        color: "var(--color-profit)",
      },
      {
        label: "Losses",
        count: losses.length,
        percentage:
          rangeTrades.length > 0
            ? (losses.length / rangeTrades.length) * 100
            : 0,
        color: "var(--color-loss)",
      },
      {
        label: "Breakeven",
        count: breakevens.length,
        percentage:
          rangeTrades.length > 0
            ? (breakevens.length / rangeTrades.length) * 100
            : 0,
        color: "var(--color-dim)",
      },
    ];

    return {
      totalTrades: rangeTrades.length,
      totalPnl,
      grossProfit,
      grossLoss,
      profitFactor,
      winRate,
      avgRR,
      bestDayPnl,
      worstDayPnl,
      outcomeSegments,
      marketSegments,
    };
  }, [rangeTrades, dailyData, rate]);

  // ── Horizontal Buildings: Monday → Sunday (Vertical list with horizontal P&L bars) ──
  const dayOfWeekHorizontalStats = useMemo(() => {
    const days = [
      { name: "Monday", short: "Mon", idx: 1 },
      { name: "Tuesday", short: "Tue", idx: 2 },
      { name: "Wednesday", short: "Wed", idx: 3 },
      { name: "Thursday", short: "Thu", idx: 4 },
      { name: "Friday", short: "Fri", idx: 5 },
      { name: "Saturday", short: "Sat", idx: 6 },
      { name: "Sunday", short: "Sun", idx: 0 },
    ];

    const map: Record<
      number,
      { pnl: number; trades: number; wins: number; losses: number }
    > = {
      0: { pnl: 0, trades: 0, wins: 0, losses: 0 },
      1: { pnl: 0, trades: 0, wins: 0, losses: 0 },
      2: { pnl: 0, trades: 0, wins: 0, losses: 0 },
      3: { pnl: 0, trades: 0, wins: 0, losses: 0 },
      4: { pnl: 0, trades: 0, wins: 0, losses: 0 },
      5: { pnl: 0, trades: 0, wins: 0, losses: 0 },
      6: { pnl: 0, trades: 0, wins: 0, losses: 0 },
    };

    rangeTrades.forEach((t) => {
      const dow = new Date(t.date).getDay();
      if (map[dow]) {
        map[dow].pnl += convertPnlToInr(Number(t.pnl), t.market, rate);
        map[dow].trades++;
        if (t.outcome === "WIN") map[dow].wins++;
        else if (t.outcome === "LOSS") map[dow].losses++;
      }
    });

    const maxAbsPnl = Math.max(
      ...Object.values(map).map((d) => Math.abs(d.pnl)),
      1
    );

    return days.map((d) => {
      const data = map[d.idx];
      const winRate =
        data.trades > 0 ? ((data.wins / data.trades) * 100).toFixed(0) : "0";
      return {
        name: d.name,
        short: d.short,
        pnl: data.pnl,
        trades: data.trades,
        winRate,
        barPct: maxAbsPnl > 0 ? (Math.abs(data.pnl) / maxAbsPnl) * 100 : 0,
      };
    });
  }, [rangeTrades, rate]);

  const selectedDayTrades = selectedDate
    ? dailyData[selectedDate]?.trades || []
    : [];

  const handleSelectDate = (key: string) => {
    setSelectedDate((prev) => (prev === key ? null : key));
  };

  return (
    <div className="space-y-4">
      {/* ── 1. AngelOne-style Date Range Filters Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-2.5 sm:p-3 rounded-2xl border border-border-solid">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-dim mr-1">
            Date Range:
          </span>
          {(
            [
              { id: "1M", label: "Month" },
              { id: "3M", label: "3 Months" },
              { id: "6M", label: "6 Months" },
              { id: "1Y", label: "1 Year" },
              { id: "ALL", label: "All Time" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setDateRange(item.id);
                setSelectedDate(null);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dateRange === item.id
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-clean hover:bg-elevated"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Month Stepper (active when 1M is selected) or Scroll buttons (when multi-month is active) */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {dateRange === "1M" ? (
            <>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-accent bg-accent/10 hover:bg-accent/20 transition-all cursor-pointer"
              >
                Current Month
              </button>
              <div className="flex items-center bg-card border border-border-solid rounded-lg p-0.5">
                <button
                  onClick={goToPrevMonth}
                  className="h-7 w-7 rounded-md hover:bg-elevated flex items-center justify-center text-muted hover:text-clean transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goToNextMonth}
                  className="h-7 w-7 rounded-md hover:bg-elevated flex items-center justify-center text-muted hover:text-clean transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-dim font-medium mr-1 hidden sm:inline">
                Scroll Months
              </span>
              <button
                onClick={scrollLeft}
                className="h-7 w-7 rounded-md bg-card border border-border-solid hover:bg-elevated flex items-center justify-center text-muted hover:text-clean transition-colors cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={scrollRight}
                className="h-7 w-7 rounded-md bg-card border border-border-solid hover:bg-elevated flex items-center justify-center text-muted hover:text-clean transition-colors cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Top Broker P&L Performance Cards (Clean, No Neon Ribbons) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Net Realized P&L */}
        <div className="card p-4 rounded-2xl border border-border-solid bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-dim text-xs">
            <span className="uppercase font-bold tracking-wider text-[10px]">
              Net Realized P&L
            </span>
            {metrics.totalPnl >= 0 ? (
              <TrendingUp className="h-4 w-4 text-profit" />
            ) : (
              <TrendingDown className="h-4 w-4 text-loss" />
            )}
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-black ${
              metrics.totalPnl >= 0 ? "text-profit" : "text-loss"
            }`}
          >
            {formatAggregatedPnl(metrics.totalPnl)}
          </div>
          <div className="text-[11px] text-muted font-medium">
            {metrics.totalTrades} trade
            {metrics.totalTrades !== 1 ? "s" : ""} in range
          </div>
        </div>

        {/* Win Rate */}
        <div className="card p-4 rounded-2xl border border-border-solid bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-dim text-xs">
            <span className="uppercase font-bold tracking-wider text-[10px]">
              Win Rate
            </span>
            <Target className="h-4 w-4 text-accent" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-clean">
            {metrics.winRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-muted font-medium">
            <span className="text-profit font-bold">
              {metrics.outcomeSegments[0]?.count || 0}W
            </span>{" "}
            /{" "}
            <span className="text-loss font-bold">
              {metrics.outcomeSegments[1]?.count || 0}L
            </span>{" "}
            / {metrics.outcomeSegments[2]?.count || 0}BE
          </div>
        </div>

        {/* Profit Factor & Avg RR */}
        <div className="card p-4 rounded-2xl border border-border-solid bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-dim text-xs">
            <span className="uppercase font-bold tracking-wider text-[10px]">
              Profit Factor
            </span>
            <Award className="h-4 w-4 text-warn" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-clean flex items-baseline gap-2">
            <span>{metrics.profitFactor}</span>
            <span className="text-xs font-semibold text-dim">
              Avg: {metrics.avgRR}R
            </span>
          </div>
          <div className="text-[11px] text-muted font-medium">
            Gross: {formatAggregatedPnl(metrics.grossProfit)}
          </div>
        </div>

        {/* Best Day / Streak */}
        <div className="card p-4 rounded-2xl border border-border-solid bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-dim text-xs">
            <span className="uppercase font-bold tracking-wider text-[10px]">
              Best Day
            </span>
            <Flame className="h-4 w-4 text-profit" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-profit">
            {metrics.bestDayPnl > 0
              ? formatAggregatedPnl(metrics.bestDayPnl)
              : "—"}
          </div>
          <div className="text-[11px] text-muted font-medium">
            Worst Day:{" "}
            <span className="font-mono font-semibold text-loss">
              {metrics.worstDayPnl < 0
                ? formatAggregatedPnl(metrics.worstDayPnl)
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Flag-Style Horizontal Distribution Bars ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card p-4 rounded-2xl border border-border-solid bg-card shadow-sm">
          <HorizontalFlagBar
            title="Outcome Distribution"
            segments={metrics.outcomeSegments}
          />
        </div>
        <div className="card p-4 rounded-2xl border border-border-solid bg-card shadow-sm">
          <HorizontalFlagBar
            title="Market Segment Distribution"
            segments={metrics.marketSegments}
          />
        </div>
      </div>

      {/* ── 4. Compact Multi-Month Horizontal Scrolling Calendar Container ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-accent" />
            <h2 className="text-sm sm:text-base font-bold text-clean">
              Trading Calendar Heatmap
            </h2>
            {displayedMonths.length > 1 && (
              <span className="text-[11px] font-mono text-dim font-semibold bg-surface px-2 py-0.5 rounded-full border border-border-solid">
                {displayedMonths.length} Months (Swipe/Scroll horizontally)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-profit inline-block" />
              <span className="text-[11px] font-medium text-soft">Profit Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-loss inline-block" />
              <span className="text-[11px] font-medium text-soft">Loss Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-dim font-bold">—</span>
              <span className="text-[11px] font-medium text-muted">No Trades</span>
            </div>
          </div>
        </div>

        {/* Horizontal Scrolling Months Row */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3 overflow-x-auto pb-2 scroll-smooth no-scrollbar select-none"
        >
          {displayedMonths.map((m) => (
            <MonthCalendarBlock
              key={`${m.year}-${m.month}`}
              year={m.year}
              month={m.month}
              dailyData={dailyData}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          ))}
        </div>
      </div>

      {/* ── 5. Selected Day Scrip Execution List (Expands on Click) ── */}
      {selectedDate && selectedDayTrades.length > 0 && (
        <div className="card p-4 sm:p-5 rounded-2xl border border-accent/40 bg-card shadow-md space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-border-solid pb-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-clean">
                Executions on{" "}
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </h3>
              <span className="badge badge-accent text-[10px]">
                {selectedDayTrades.length} Scrip
                {selectedDayTrades.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-dim mr-1.5">
                  Day Total:
                </span>
                <span
                  className={`font-mono font-black text-sm ${
                    (dailyData[selectedDate]?.pnl || 0) >= 0
                      ? "text-profit"
                      : "text-loss"
                  }`}
                >
                  {formatAggregatedPnl(dailyData[selectedDate]?.pnl || 0)}
                </span>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="h-6 w-6 rounded-md hover:bg-elevated flex items-center justify-center text-dim hover:text-clean cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {selectedDayTrades.map((trade: any) => {
              const pnlNum = Number(trade.pnl);
              const rrNum = Number(trade.actualRR || trade.rMultiple || 0);
              const isInr = isIndianMarket(trade.market);
              const pnlInInr = convertPnlToInr(pnlNum, trade.market, rate);

              return (
                <div
                  key={trade.id}
                  onClick={() => onViewTrade(trade)}
                  className="p-3 sm:p-3.5 rounded-xl border border-border-solid bg-surface hover:bg-elevated hover:border-accent/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  {/* Left: Scrip, Market, Session */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-clean">
                        {trade.instrument}
                      </span>
                      <span
                        className={`badge text-[9px] font-bold ${
                          trade.outcome === "WIN"
                            ? "badge-profit"
                            : trade.outcome === "LOSS"
                            ? "badge-loss"
                            : "badge-neutral"
                        }`}
                      >
                        {trade.outcome}
                      </span>
                      <span className="badge badge-neutral text-[9px]">
                        {trade.market}
                      </span>
                      <span className="text-dim text-xs">· {trade.session}</span>
                    </div>

                    {/* Price execution points */}
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span>
                        Entry:{" "}
                        <strong className="text-soft font-mono">
                          {Number(trade.actualEntry)}
                        </strong>
                      </span>
                      <span>
                        SL:{" "}
                        <strong className="text-loss font-mono">
                          {Number(trade.stopLoss)}
                        </strong>
                      </span>
                      <span>
                        Exit:{" "}
                        <strong className="text-profit font-mono">
                          {Number(trade.actualExit)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Right: R-Multiple, P&L, Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/20">
                    <div className="text-left sm:text-right">
                      <span
                        className={`font-mono text-sm sm:text-base font-black block ${
                          pnlNum >= 0 ? "text-profit" : "text-loss"
                        }`}
                      >
                        {formatPnlWithCurrency(pnlNum, trade.market)}
                      </span>
                      <span
                        className={`font-mono text-[10px] font-bold ${
                          rrNum >= 0 ? "text-profit" : "text-loss"
                        }`}
                      >
                        {formatRMultiple(rrNum)}
                      </span>
                      {!isInr && (
                        <span className="text-[9px] text-dim font-mono block">
                          ≈ {formatAggregatedPnl(pnlInInr)}
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onViewTrade(trade)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-dim hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onEditTrade(trade)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-dim hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                        title="Edit Trade"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 6. Horizontal Buildings for Weekday Performance (Monday to Sunday) ── */}
      <div className="card p-4 sm:p-5 rounded-2xl border border-border-solid bg-card shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            <h3 className="text-xs sm:text-sm font-bold text-clean">
              Weekday P&L Buildings (Mon – Sun on X-Axis)
            </h3>
          </div>
          <span className="text-[11px] text-dim font-medium">
            Horizontal profit distribution
          </span>
        </div>

        {/* Vertical list of days with horizontal building bars extending on X-axis */}
        <div className="space-y-2.5 pt-1">
          {dayOfWeekHorizontalStats.map((day) => {
            const isProf = day.pnl > 0;
            const isLos = day.pnl < 0;

            return (
              <div
                key={day.name}
                className="p-2.5 sm:p-3 rounded-xl border border-border-solid bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all hover:bg-elevated/60"
              >
                {/* Left: Day Label + Stats */}
                <div className="w-28 sm:w-36 shrink-0 flex items-center justify-between sm:block">
                  <span className="text-xs font-bold text-clean block">
                    {day.name}
                  </span>
                  <span className="text-[10px] text-dim block">
                    {day.trades > 0
                      ? `${day.trades} trade${day.trades > 1 ? "s" : ""} · ${day.winRate}% WR`
                      : "No activity"}
                  </span>
                </div>

                {/* Middle: Horizontal Building on X-Axis */}
                <div className="flex-1 px-1 sm:px-3">
                  <div className="h-6 w-full rounded-lg bg-card border border-border-solid overflow-hidden flex items-center p-1 relative shadow-inner">
                    {day.trades === 0 ? (
                      <div className="w-full text-center text-[10px] text-dim/40 font-medium">
                        —
                      </div>
                    ) : (
                      <div
                        className="h-full rounded-md transition-all duration-700 flex items-center px-2"
                        style={{
                          width: `${Math.max(day.barPct, 12)}%`,
                          backgroundColor: isProf
                            ? "var(--color-profit)"
                            : isLos
                            ? "var(--color-loss)"
                            : "var(--color-dim)",
                        }}
                      >
                        <span className="text-[9px] font-mono font-black text-[#06060a] whitespace-nowrap">
                          {formatAggregatedPnl(day.pnl)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Net P&L Figure */}
                <div className="w-24 sm:w-28 text-right shrink-0 self-end sm:self-center">
                  <span
                    className={`font-mono text-xs sm:text-sm font-black ${
                      isProf
                        ? "text-profit"
                        : isLos
                        ? "text-loss"
                        : "text-dim"
                    }`}
                  >
                    {day.trades > 0 ? formatAggregatedPnl(day.pnl) : "₹0.00"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
