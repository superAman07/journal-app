"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  Layers,
  Plus,
  Trophy,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Clock,
  CheckCircle2,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
  ChevronDown,
  Sparkles,
  Crown,
  Medal,
  Award,
  X,
} from "lucide-react";
import {
  getUserStrategies,
  archiveStrategy,
  restoreStrategy,
  deleteStrategy,
} from "@/lib/actions/strategy-actions";
import type { StrategyWithMetrics } from "@/lib/actions/strategy-actions";
import { StrategyModal } from "@/components/strategies/strategy-modal";

const RANK_ICONS = [Crown, Medal, Award];
const RANK_COLORS = [
  "text-yellow-400",
  "text-gray-400",
  "text-amber-600",
];

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<StrategyWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStrategy, setEditStrategy] = useState<StrategyWithMetrics | null>(
    null
  );
  const [viewStrategy, setViewStrategy] = useState<StrategyWithMetrics | null>(
    null
  );
  const [showArchived, setShowArchived] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchStrategies = async () => {
    const data = await getUserStrategies();
    setStrategies(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  useEffect(() => {
    if (!modalOpen) {
      fetchStrategies();
    }
  }, [modalOpen]);

  const active = strategies.filter((s) => !s.isArchived);
  const archived = strategies.filter((s) => s.isArchived);
  const ranked = active
    .filter((s) => s.totalTrades > 0)
    .sort((a, b) => {
      const scoreA =
        a.winRate * 0.4 +
        Math.min(a.profitFactor, 10) * 3 +
        a.avgRR * 3;
      const scoreB =
        b.winRate * 0.4 +
        Math.min(b.profitFactor, 10) * 3 +
        b.avgRR * 3;
      return scoreB - scoreA;
    });

  const totalActive = active.length;
  const bestStrategy = ranked[0] || null;
  const totalPnL = active.reduce((sum, s) => sum + s.netPnL, 0);
  const overallWinRate =
    active.reduce((sum, s) => sum + s.totalTrades, 0) > 0
      ? (active.reduce((sum, s) => sum + s.wins, 0) /
          active.reduce((sum, s) => sum + s.totalTrades, 0)) *
        100
      : 0;

  const handleArchive = (id: string) => {
    startTransition(async () => {
      await archiveStrategy(id);
      fetchStrategies();
    });
  };

  const handleRestore = (id: string) => {
    startTransition(async () => {
      await restoreStrategy(id);
      fetchStrategies();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Permanently delete this strategy? This cannot be undone."))
      return;
    startTransition(async () => {
      const result = await deleteStrategy(id);
      if (!result.success) {
        alert(result.message);
      }
      fetchStrategies();
    });
  };

  const openEdit = (s: StrategyWithMetrics) => {
    setEditStrategy(s);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditStrategy(null);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-7 w-48 mb-2" />
            <div className="skeleton h-4 w-64" />
          </div>
          <div className="skeleton h-10 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <Layers className="h-5 w-5 text-accent" /> Strategy Playbook
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Build, track, and rank your trading setups. Know your edge.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Create Strategy
        </button>
      </div>

      {/* KPI Strip */}
      {active.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard
            label="Active Strategies"
            value={String(totalActive)}
            icon={<Layers className="h-4 w-4" />}
            color="accent"
          />
          <KPICard
            label="Best Strategy"
            value={bestStrategy?.name || "—"}
            icon={<Trophy className="h-4 w-4" />}
            color="warn"
            truncate
          />
          <KPICard
            label="Overall Win Rate"
            value={`${overallWinRate.toFixed(1)}%`}
            icon={<Target className="h-4 w-4" />}
            color={overallWinRate >= 50 ? "profit" : "loss"}
          />
          <KPICard
            label="Total Strategy PnL"
            value={`${totalPnL >= 0 ? "+" : ""}₹${Math.abs(totalPnL).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`}
            icon={
              totalPnL >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )
            }
            color={totalPnL >= 0 ? "profit" : "loss"}
          />
        </div>
      )}

      {ranked.length >= 2 && (
        <div className="card p-4 sm:p-5">
          <h3 className="text-sm font-bold text-clean flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-ai" /> Strategy Performance
            Ranking
          </h3>
          <div className="overflow-x-auto -mx-4 sm:-mx-5">
            <table className="w-full text-xs min-w-125">
              <thead>
                <tr className="text-muted text-left border-b border-border-solid">
                  <th className="px-4 sm:px-5 py-2 font-semibold">#</th>
                  <th className="py-2 font-semibold">Strategy</th>
                  <th className="py-2 font-semibold text-right">Trades</th>
                  <th className="py-2 font-semibold text-right">Win Rate</th>
                  <th className="py-2 font-semibold text-right">Avg R:R</th>
                  <th className="py-2 font-semibold text-right">P.Factor</th>
                  <th className="py-2 font-semibold text-right pr-4 sm:pr-5">
                    Net PnL
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((s, i) => {
                  const RankIcon = i < 3 ? RANK_ICONS[i] : null;
                  const rankColor = i < 3 ? RANK_COLORS[i] : "text-dim";
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-border-solid/50 hover:bg-elevated/50 transition-colors cursor-pointer"
                      onClick={() => openEdit(s)}
                    >
                      <td className="px-4 sm:px-5 py-2.5">
                        {RankIcon ? (
                          <RankIcon className={`h-4 w-4 ${rankColor}`} />
                        ) : (
                          <span className="text-dim font-mono">
                            {i + 1}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-clean">
                            {s.name}
                          </span>
                          {s.market && (
                            <span className="text-[9px] font-medium text-dim bg-elevated px-1.5 py-0.5 rounded">
                              {s.market}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-soft font-mono">
                        {s.totalTrades}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`font-bold ${
                            s.winRate >= 60
                              ? "text-profit"
                              : s.winRate >= 40
                              ? "text-warn"
                              : "text-loss"
                          }`}
                        >
                          {s.winRate}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-soft font-mono">
                        {s.avgRR}R
                      </td>
                      <td className="py-2.5 text-right text-soft font-mono">
                        {s.profitFactor >= 999
                          ? "∞"
                          : s.profitFactor.toFixed(1)}
                      </td>
                      <td
                        className={`py-2.5 text-right pr-4 sm:pr-5 font-bold font-mono ${
                          s.netPnL >= 0 ? "text-profit" : "text-loss"
                        }`}
                      >
                        {s.netPnL >= 0 ? "+" : ""}₹
                        {Math.abs(s.netPnL).toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strategy Cards Grid */}
      {active.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {active.map((s) => (
            <StrategyCard
              key={s.id}
              strategy={s}
              rank={
                ranked.findIndex((r) => r.id === s.id) + 1 || null
              }
              onView={() => setViewStrategy(s)}
              onEdit={() => openEdit(s)}
              onArchive={() => handleArchive(s.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState onCreate={openCreate} />
      )}

      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-clean transition-colors cursor-pointer mb-3"
          >
            <Archive className="h-3.5 w-3.5" />
            Archived Strategies ({archived.length})
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                showArchived ? "rotate-180" : ""
              }`}
            />
          </button>

          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {archived.map((s) => (
                <div
                  key={s.id}
                  className="card p-4 opacity-60 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-clean line-through">
                      {s.name}
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleRestore(s.id)}
                        className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-profit transition-colors cursor-pointer"
                        title="Restore"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-loss transition-colors cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-dim">
                    {s.totalTrades} trades · {s.winRate}% WR · ₹
                    {Math.abs(s.netPnL).toLocaleString("en-IN")} PnL
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <StrategyModal
        key={modalOpen ? (editStrategy?.id || "create") : "closed"}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditStrategy(null);
        }}
        strategy={editStrategy}
      />

      {viewStrategy && (
        <StrategyDetailView
          strategy={viewStrategy}
          onClose={() => setViewStrategy(null)}
          onEdit={() => {
            setViewStrategy(null);
            openEdit(viewStrategy);
          }}
        />
      )}
    </div>
  );
}

function StrategyCard({
  strategy: s,
  rank,
  onView,
  onEdit,
  onArchive,
}: {
  strategy: StrategyWithMetrics;
  rank: number | null;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  let rules: string[] = [];
  try {
    rules = JSON.parse(s.rules || "[]");
  } catch {
    rules = [];
  }

  return (
    <div className="card p-4 sm:p-5 space-y-3 group relative overflow-hidden cursor-pointer" onClick={onView}>
      {rank && rank <= 3 && (
        <div className="absolute top-3 right-3">
          <div
            className={`h-7 w-7 rounded-lg flex items-center justify-center ${
              rank === 1
                ? "bg-yellow-400/15 text-yellow-400"
                : rank === 2
                ? "bg-gray-400/15 text-gray-400"
                : "bg-amber-600/15 text-amber-600"
            }`}
          >
            {rank === 1 ? (
              <Crown className="h-4 w-4" />
            ) : rank === 2 ? (
              <Medal className="h-4 w-4" />
            ) : (
              <Award className="h-4 w-4" />
            )}
          </div>
        </div>
      )}

      <div className="pr-10">
        <h3 className="text-sm font-bold text-clean">{s.name}</h3>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {s.market && (
            <span className="badge badge-accent text-[9px]">
              {s.market}
            </span>
          )}
          {s.timeframe && (
            <span className="badge badge-neutral text-[9px]">
              <Clock className="h-2.5 w-2.5" /> {s.timeframe}
            </span>
          )}
          {s.targetRR && (
            <span className="badge badge-neutral text-[9px]">
              <Target className="h-2.5 w-2.5" /> {s.targetRR}R
            </span>
          )}
        </div>
      </div>

      {s.description && (
        <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
          {s.description}
        </p>
      )}

      {rules.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-dim uppercase tracking-wider">
            Entry Checklist
          </span>
          <div className="space-y-1">
            {rules.slice(0, 3).map((rule, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[11px] text-soft"
              >
                <CheckCircle2 className="h-3 w-3 text-profit shrink-0" />
                <span className="truncate">{rule}</span>
              </div>
            ))}
            {rules.length > 3 && (
              <span className="text-[10px] text-dim">
                +{rules.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border-solid/50">
        <StatMini
          label="Win Rate"
          value={s.totalTrades > 0 ? `${s.winRate}%` : "—"}
          color={
            s.winRate >= 60
              ? "text-profit"
              : s.winRate >= 40
              ? "text-warn"
              : s.totalTrades > 0
              ? "text-loss"
              : "text-dim"
          }
        />
        <StatMini
          label="Trades"
          value={String(s.totalTrades)}
          color="text-soft"
        />
        <StatMini
          label="Net PnL"
          value={
            s.totalTrades > 0
              ? `${s.netPnL >= 0 ? "+" : ""}₹${Math.abs(
                  s.netPnL
                ).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}`
              : "—"
          }
          color={
            s.netPnL > 0
              ? "text-profit"
              : s.netPnL < 0
              ? "text-loss"
              : "text-dim"
          }
        />
        <StatMini
          label="Avg R:R"
          value={s.totalTrades > 0 ? `${s.avgRR}R` : "—"}
          color="text-soft"
        />
      </div>

      <div className="flex gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-muted hover:text-accent hover:bg-accent/10 border border-transparent hover:border-accent/20 transition-all cursor-pointer"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
        <button
          onClick={onArchive}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-muted hover:text-warn hover:bg-warn/10 border border-transparent hover:border-warn/20 transition-all cursor-pointer"
        >
          <Archive className="h-3 w-3" /> Archive
        </button>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  icon,
  color,
  truncate,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  truncate?: boolean;
}) {
  return (
    <div className="card p-3.5 sm:p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`text-${color}`}>{icon}</div>
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p
        className={`stat-value text-base sm:text-lg text-${color} ${
          truncate ? "truncate" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatMini({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <p className={`text-xs font-bold ${color} font-mono truncate`}>
        {value}
      </p>
      <p className="text-[9px] text-dim mt-0.5">{label}</p>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="card p-8 sm:p-12 text-center space-y-4">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
        <Layers className="h-7 w-7" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-clean">
          No Strategies Yet
        </h3>
        <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
          Create your first strategy to track setup performance, win rates,
          and profitability. After a few weeks of trades, you&apos;ll see
          which setups truly give you an edge.
        </p>
      </div>
      <button
        onClick={onCreate}
        className="btn-primary mx-auto cursor-pointer"
      >
        <Plus className="h-4 w-4" /> Create Your First Strategy
      </button>
    </div>
  );
}

function StrategyDetailView({
  strategy: s,
  onClose,
  onEdit,
}: {
  strategy: StrategyWithMetrics;
  onClose: () => void;
  onEdit: () => void;
}) {
  let rules: string[] = [];
  try {
    rules = JSON.parse(s.rules || "[]");
  } catch {
    rules = [];
  }

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-card border border-border-solid rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-solid">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-clean">{s.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                {s.market && (
                  <span className="badge badge-accent text-[9px]">{s.market}</span>
                )}
                {s.timeframe && (
                  <span className="badge badge-neutral text-[9px]">
                    <Clock className="h-2.5 w-2.5" /> {s.timeframe}
                  </span>
                )}
                {s.targetRR && (
                  <span className="badge badge-neutral text-[9px]">
                    <Target className="h-2.5 w-2.5" /> {s.targetRR}R target
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-elevated text-dim hover:text-clean transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Description */}
          {s.description && (
            <div>
              <span className="text-[10px] font-bold text-dim uppercase tracking-wider">Description</span>
              <p className="text-xs text-soft leading-relaxed mt-1">{s.description}</p>
            </div>
          )}

          {/* Entry Rules Checklist */}
          {rules.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-dim uppercase tracking-wider">Entry Checklist</span>
              <div className="space-y-1.5 mt-1.5">
                {rules.map((rule, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 bg-elevated rounded-lg"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-profit shrink-0" />
                    <span className="text-xs text-clean">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Stats */}
          <div>
            <span className="text-[10px] font-bold text-dim uppercase tracking-wider">Performance</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              <div className="card-elevated p-3 text-center rounded-xl">
                <p className={`text-sm font-bold font-mono ${
                  s.winRate >= 60 ? "text-profit" : s.winRate >= 40 ? "text-warn" : s.totalTrades > 0 ? "text-loss" : "text-dim"
                }`}>
                  {s.totalTrades > 0 ? `${s.winRate}%` : "—"}
                </p>
                <p className="text-[9px] text-dim mt-0.5">Win Rate</p>
              </div>
              <div className="card-elevated p-3 text-center rounded-xl">
                <p className="text-sm font-bold text-soft font-mono">{s.totalTrades}</p>
                <p className="text-[9px] text-dim mt-0.5">Total Trades</p>
              </div>
              <div className="card-elevated p-3 text-center rounded-xl">
                <p className={`text-sm font-bold font-mono ${
                  s.netPnL > 0 ? "text-profit" : s.netPnL < 0 ? "text-loss" : "text-dim"
                }`}>
                  {s.totalTrades > 0 ? `${s.netPnL >= 0 ? "+" : ""}₹${Math.abs(s.netPnL).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
                </p>
                <p className="text-[9px] text-dim mt-0.5">Net PnL</p>
              </div>
              <div className="card-elevated p-3 text-center rounded-xl">
                <p className="text-sm font-bold text-soft font-mono">
                  {s.totalTrades > 0 ? `${s.avgRR}R` : "—"}
                </p>
                <p className="text-[9px] text-dim mt-0.5">Avg R:R</p>
              </div>
            </div>
          </div>

          {/* Profit Factor + Win/Loss */}
          {s.totalTrades > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="card-elevated p-3 text-center rounded-xl">
                <p className="text-sm font-bold text-profit font-mono">{s.wins}</p>
                <p className="text-[9px] text-dim mt-0.5">Wins</p>
              </div>
              <div className="card-elevated p-3 text-center rounded-xl">
                <p className="text-sm font-bold text-loss font-mono">{s.losses}</p>
                <p className="text-[9px] text-dim mt-0.5">Losses</p>
              </div>
              <div className="card-elevated p-3 text-center rounded-xl">
                <p className="text-sm font-bold text-accent font-mono">
                  {s.profitFactor >= 999 ? "∞" : s.profitFactor.toFixed(1)}
                </p>
                <p className="text-[9px] text-dim mt-0.5">Profit Factor</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border-solid flex gap-2">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 justify-center cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="btn-primary flex-1 justify-center cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Strategy
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
