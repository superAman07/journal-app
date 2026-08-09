"use client";

import { useState, useEffect, useActionState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Trash2,
  Target,
  Clock,
  BarChart3,
  FileText,
  CheckCircle2,
  Layers,
} from "lucide-react";
import {
  createStrategy,
  updateStrategy,
  StrategyFormState,
} from "@/lib/actions/strategy-actions";
import type { StrategyWithMetrics } from "@/lib/actions/strategy-actions";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1H", "4H", "Daily", "Weekly"];
const MARKETS = [
  "Nifty Options",
  "BankNifty Options",
  "Sensex Options",
  "Stock Options",
  "Crypto Options",
  "Forex",
  "Gold",
  "Silver",
  "Crypto",
  "Stocks",
  "Futures",
];

const initialState: StrategyFormState = { success: false, message: "" };

interface StrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy?: StrategyWithMetrics | null;
}

export function StrategyModal({
  isOpen,
  onClose,
  strategy,
}: StrategyModalProps) {
  const isEdit = !!strategy;

  const boundAction = isEdit
    ? updateStrategy.bind(null, strategy!.id)
    : createStrategy;

  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [market, setMarket] = useState("");
  const [targetRR, setTargetRR] = useState("2.0");
  const [ruleItems, setRuleItems] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Populate fields when editing
  useEffect(() => {
    if (strategy) {
      setName(strategy.name);
      setDescription(strategy.description || "");
      setTimeframe(strategy.timeframe || "");
      setMarket(strategy.market || "");
      setTargetRR(strategy.targetRR?.toString() || "2.0");
      try {
        const parsed = JSON.parse(strategy.rules || "[]");
        setRuleItems(Array.isArray(parsed) ? parsed : []);
      } catch {
        setRuleItems([]);
      }
    } else {
      setName("");
      setDescription("");
      setTimeframe("");
      setMarket("");
      setTargetRR("2.0");
      setRuleItems([]);
    }
  }, [strategy, isOpen]);

  // Close on success
  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  const addRule = () => {
    const trimmed = newRule.trim();
    if (trimmed && !ruleItems.includes(trimmed)) {
      setRuleItems([...ruleItems, trimmed]);
      setNewRule("");
    }
  };

  const removeRule = (index: number) => {
    setRuleItems(ruleItems.filter((_, i) => i !== index));
  };

  const handleRuleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addRule();
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border-solid rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-solid">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-clean">
                {isEdit ? "Edit Strategy" : "Create Strategy"}
              </h2>
              <p className="text-[11px] text-muted">
                {isEdit
                  ? "Update your strategy playbook"
                  : "Define your trading edge"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-elevated text-dim hover:text-clean transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form action={formAction} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Hidden fields */}
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="description" value={description} />
          <input type="hidden" name="timeframe" value={timeframe} />
          <input type="hidden" name="market" value={market} />
          <input type="hidden" name="targetRR" value={targetRR} />
          <input
            type="hidden"
            name="rules"
            value={JSON.stringify(ruleItems)}
          />

          {/* Error message */}
          {state?.message && !state.success && (
            <div className="p-3 bg-loss/10 border border-loss/30 text-loss text-xs rounded-xl font-medium">
              {state.message}
            </div>
          )}

          {/* Strategy Name */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Target className="h-3 w-3" /> Strategy Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Break & Retest + FVG"
              className="input-field font-semibold"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your strategy setup, entry conditions, and edge..."
              className="input-field min-h-20 resize-y"
              rows={3}
            />
          </div>

          {/* Market & Timeframe Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3" /> Market
              </label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="input-field cursor-pointer"
              >
                <option value="">Any Market</option>
                {MARKETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Target R:R
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={targetRR}
                onChange={(e) => setTargetRR(e.target.value)}
                className="input-field font-mono"
              />
            </div>
          </div>

          {/* Timeframe Chips */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Timeframe
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() =>
                    setTimeframe(timeframe === tf ? "" : tf)
                  }
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    timeframe === tf
                      ? "bg-accent/15 text-accent border-accent/30"
                      : "bg-surface text-dim border-border-solid hover:bg-elevated hover:text-soft"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Entry Rules Checklist */}
          <div>
            <label className="label flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" /> Entry Rules Checklist
            </label>

            {ruleItems.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {ruleItems.map((rule, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 bg-elevated rounded-lg group"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-profit shrink-0" />
                    <span className="text-xs text-clean flex-1">
                      {rule}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRule(i)}
                      className="p-0.5 rounded text-dim hover:text-loss opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={handleRuleKeyDown}
                placeholder="e.g. Wait for BOS confirmation"
                className="input-field flex-1 text-xs"
              />
              <button
                type="button"
                onClick={addRule}
                disabled={!newRule.trim()}
                className="btn-secondary px-3 py-2 text-xs cursor-pointer disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 justify-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="btn-primary flex-1 justify-center cursor-pointer disabled:opacity-50"
            >
              {isPending
                ? "Saving..."
                : isEdit
                ? "Update Strategy"
                : "Create Strategy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
