"use client";

import dynamic from "next/dynamic";
import { BarChart3, TrendingUp, PieChart, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Lazy load heavy Recharts components — code split for faster page loads
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const AreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  { ssr: false }
);
const Area = dynamic(
  () => import("recharts").then((mod) => mod.Area),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((mod) => mod.Bar),
  { ssr: false }
);
const RePieChart = dynamic(
  () => import("recharts").then((mod) => mod.PieChart),
  { ssr: false }
);
const Pie = dynamic(
  () => import("recharts").then((mod) => mod.Pie),
  { ssr: false }
);
const Cell = dynamic(
  () => import("recharts").then((mod) => mod.Cell),
  { ssr: false }
);

const EQUITY_DATA = [
  { date: "Jul 1", equity: 10000 },
  { date: "Jul 5", equity: 11200 },
  { date: "Jul 10", equity: 10800 },
  { date: "Jul 15", equity: 13400 },
  { date: "Jul 20", equity: 12900 },
  { date: "Jul 23", equity: 11550 },
  { date: "Jul 24", equity: 13950 },
  { date: "Jul 25", equity: 17190 },
];

const RR_DISTRIBUTION = [
  { range: "1:1", count: 2 },
  { range: "1:2", count: 8 },
  { range: "1:3", count: 18 },
  { range: "1:4+", count: 5 },
  { range: "-1R", count: 9 },
];

const WIN_LOSS_DATA = [
  { name: "Wins", value: 28, color: "#0bd07f" },
  { name: "Losses", value: 11, color: "#ff5757" },
  { name: "BE", value: 3, color: "#494a62" },
];

const SESSION_DATA = [
  { session: "London", pnl: 4800 },
  { session: "New York", pnl: 8900 },
  { session: "Asian", pnl: -1200 },
  { session: "Overlap", pnl: 2350 },
];

const tooltipStyle = {
  backgroundColor: "var(--color-card)",
  borderColor: "var(--color-border)",
  borderRadius: "10px",
  fontSize: "11px",
  color: "var(--color-clean)",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" /> Performance Analytics
        </h1>
        <p className="text-xs text-muted mt-0.5">Equity curve, distributions, and session breakdowns.</p>
      </div>

      {/* Equity Curve */}
      <div className="card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-clean flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" /> Equity Growth
          </h2>
          <span className="stat-value !text-base text-profit">+$7,190 (+71.9%)</span>
        </div>
        <div className="h-56 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={EQUITY_DATA}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--color-dim)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-dim)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Equity"]} />
              <Area type="monotone" dataKey="equity" stroke="#4f6ef7" strokeWidth={2.5} fill="url(#eqGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Win/Loss Donut */}
        <div className="card p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-semibold text-clean flex items-center gap-2">
            <PieChart className="h-4 w-4 text-accent" /> Win / Loss
          </h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={WIN_LOSS_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={4} dataKey="value">
                  {WIN_LOSS_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[11px]">
            {WIN_LOSS_DATA.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted">{item.name}: <strong className="text-soft">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* RR Distribution */}
        <div className="card p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-semibold text-clean flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" /> RR Distribution
          </h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RR_DISTRIBUTION}>
                <XAxis dataKey="range" stroke="var(--color-dim)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-dim)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#4f6ef7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session Breakdown */}
        <div className="card p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-semibold text-clean flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" /> Session PnL
          </h3>
          <div className="space-y-2 pt-1">
            {SESSION_DATA.map((s) => (
              <div key={s.session} className="card-elevated p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs font-semibold text-soft">{s.session}</span>
                <span className={`text-xs font-mono font-bold ${s.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                  {formatCurrency(s.pnl)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
