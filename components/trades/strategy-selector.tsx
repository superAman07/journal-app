"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  ChevronDown,
  Trophy,
  TrendingUp,
  Plus,
  Pencil,
  X,
} from "lucide-react";

export type StrategyOption = {
  id: string;
  name: string;
  market: string | null;
  targetRR: number | null;
  winRate: number;
  avgRR: number;
  totalTrades: number;
};

interface StrategySelectorProps {
  strategies: StrategyOption[];
  value: string; // current setup text
  strategyId: string;
  onSetupChange: (setup: string) => void;
  onStrategyIdChange: (id: string) => void;
}

export function StrategySelector({
  strategies,
  value,
  strategyId,
  onSetupChange,
  onStrategyIdChange,
}: StrategySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Determine if we have strategies to show
  const hasStrategies = strategies.length > 0;

  // Filter strategies by search
  const filtered = strategies.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Selected strategy object
  const selectedStrategy = strategies.find((s) => s.id === strategyId);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
      } else if (e.key === "Enter" && highlightIndex >= 0) {
        e.preventDefault();
        selectStrategy(filtered[highlightIndex]);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setSearch("");
        setHighlightIndex(-1);
      }
    },
    [isOpen, filtered, highlightIndex]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-strategy-item]");
      items[highlightIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const selectStrategy = (s: StrategyOption) => {
    onStrategyIdChange(s.id);
    onSetupChange(s.name);
    setIsOpen(false);
    setSearch("");
    setHighlightIndex(-1);
    setIsManualMode(false);
  };

  const switchToManual = () => {
    setIsManualMode(true);
    setIsOpen(false);
    setSearch("");
    onStrategyIdChange("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const switchToDropdown = () => {
    setIsManualMode(false);
    setIsOpen(true);
  };

  // If no strategies exist, show plain input
  if (!hasStrategies) {
    return (
      <input
        value={value}
        onChange={(e) => onSetupChange(e.target.value)}
        placeholder="e.g. Order Block + FVG"
        className="input-field"
      />
    );
  }

  // Manual typing mode
  if (isManualMode) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onSetupChange(e.target.value);
            onStrategyIdChange("");
          }}
          placeholder="Type custom strategy name..."
          className="input-field pr-10"
        />
        <button
          type="button"
          onClick={switchToDropdown}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-elevated text-dim hover:text-accent transition-colors cursor-pointer"
          title="Switch to strategy dropdown"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Dropdown mode (default when strategies exist)
  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="input-field flex items-center justify-between gap-2 text-left cursor-pointer w-full"
      >
        <span className="flex items-center gap-2 truncate min-w-0">
          {selectedStrategy ? (
            <>
              <span className="font-semibold text-clean truncate">
                {selectedStrategy.name}
              </span>
              {selectedStrategy.totalTrades > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                    selectedStrategy.winRate >= 60
                      ? "bg-profit/15 text-profit"
                      : selectedStrategy.winRate >= 40
                      ? "bg-warn/15 text-warn"
                      : "bg-loss/15 text-loss"
                  }`}
                >
                  {selectedStrategy.winRate}%
                </span>
              )}
            </>
          ) : value ? (
            <span className="text-clean">{value}</span>
          ) : (
            <span className="text-dim">Select strategy...</span>
          )}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-dim shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-card border border-border-solid rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search Input */}
          <div className="p-2 border-b border-border-solid">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dim" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search strategies..."
                className="w-full bg-elevated border border-border-solid rounded-lg pl-8 pr-3 py-2 text-xs text-clean placeholder:text-dim focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>
          </div>

          {/* Strategy List */}
          <div
            ref={listRef}
            className="max-h-55 overflow-y-auto py-1"
          >
            {filtered.length > 0 ? (
              filtered.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  data-strategy-item
                  onClick={() => selectStrategy(s)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors cursor-pointer ${
                    highlightIndex === i
                      ? "bg-accent/10"
                      : strategyId === s.id
                      ? "bg-elevated"
                      : "hover:bg-elevated/60"
                  }`}
                >
                  {/* Rank indicator for top strategies */}
                  <div className="shrink-0 w-5 flex justify-center">
                    {s.totalTrades >= 3 && s.winRate >= 60 ? (
                      <Trophy className="h-3.5 w-3.5 text-warn" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5 text-dim" />
                    )}
                  </div>

                  {/* Strategy info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-clean truncate">
                        {s.name}
                      </span>
                      {s.market && (
                        <span className="text-[9px] font-medium text-dim bg-elevated px-1.5 py-0.5 rounded shrink-0">
                          {s.market}
                        </span>
                      )}
                    </div>
                    {s.totalTrades > 0 && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted">
                          {s.totalTrades} trades
                        </span>
                        <span className="text-[10px] text-muted">·</span>
                        <span className="text-[10px] text-muted">
                          Avg {s.avgRR}R
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Win rate badge */}
                  {s.totalTrades > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                        s.winRate >= 60
                          ? "bg-profit/15 text-profit"
                          : s.winRate >= 40
                          ? "bg-warn/15 text-warn"
                          : "bg-loss/15 text-loss"
                      }`}
                    >
                      {s.winRate}%
                    </span>
                  )}
                  {s.totalTrades === 0 && (
                    <span className="text-[10px] text-dim italic shrink-0">
                      New
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-xs text-dim">
                No strategies match &ldquo;{search}&rdquo;
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-border-solid p-2 flex gap-1.5">
            <button
              type="button"
              onClick={switchToManual}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-muted hover:text-clean hover:bg-elevated transition-colors cursor-pointer"
            >
              <Pencil className="h-3 w-3" />
              Type custom name
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
