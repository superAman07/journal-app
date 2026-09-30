"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  Maximize2,
  Minimize2,
  GripHorizontal,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Circle,
  X,
  ExternalLink,
  Lock,
  Unlock,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  sub: string;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: "invalidation",
    label: "Structural Invalidation Mapped",
    sub: "SL placed where thesis is dead, not arbitrary dollar pain.",
  },
  {
    id: "risk",
    label: "Strict Position Sizing",
    sub: "Risk is capped to ≤ 1-2% of account equity.",
  },
  {
    id: "rr",
    label: "Asymmetric Risk:Reward (≥ 1:2)",
    sub: "Mathematical edge confirmed before pulling trigger.",
  },
  {
    id: "mindset",
    label: "Zero FOMO & Process Acceptance",
    sub: "Emotionally neutral. Fully accepting loss if it hits.",
  },
];

export function TraderGuardrail() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [id: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<"checklist" | "rules">("checklist");

  // Draggable positioning
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [dockPreset, setDockPreset] = useState<"bottom-right" | "top-right" | "bottom-left" | "custom">("bottom-right");
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const cardRef = useRef<HTMLDivElement>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedVisible = localStorage.getItem("trading_guardrail_visible");
      if (savedVisible !== null) setIsVisible(savedVisible === "true");

      const savedMin = localStorage.getItem("trading_guardrail_minimized");
      if (savedMin !== null) setIsMinimized(savedMin === "true");

      const savedChecks = localStorage.getItem("trading_guardrail_checks");
      if (savedChecks) setCheckedItems(JSON.parse(savedChecks));

      const savedDock = localStorage.getItem("trading_guardrail_dock") as any;
      if (savedDock) setDockPreset(savedDock);

      const savedPos = localStorage.getItem("trading_guardrail_pos");
      if (savedPos) {
        const parsed = JSON.parse(savedPos);
        // Ensure within window bounds
        if (typeof window !== "undefined") {
          const safeX = Math.max(10, Math.min(window.innerWidth - 360, parsed.x));
          const safeY = Math.max(10, Math.min(window.innerHeight - 80, parsed.y));
          setPosition({ x: safeX, y: safeY });
        }
      }
    } catch (e) {
      console.error("Failed to load guardrail state:", e);
    }

    const handleOpen = () => {
      setIsVisible(true);
      setIsMinimized(false);
    };
    window.addEventListener("open_guardrail", handleOpen);
    return () => window.removeEventListener("open_guardrail", handleOpen);
  }, []);

  // Save checks to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("trading_guardrail_checks", JSON.stringify(checkedItems));
      localStorage.setItem("trading_guardrail_minimized", String(isMinimized));
      localStorage.setItem("trading_guardrail_visible", String(isVisible));
      localStorage.setItem("trading_guardrail_dock", dockPreset);
      if (position) {
        localStorage.setItem("trading_guardrail_pos", JSON.stringify(position));
      }
    } catch (e) {
      console.error("Failed to persist guardrail state:", e);
    }
  }, [checkedItems, isMinimized, isVisible, dockPreset, position, mounted]);

  // Window resize bounds adjustment
  useEffect(() => {
    if (!mounted) return;
    const handleResize = () => {
      if (position) {
        setPosition((prev) => {
          if (!prev) return null;
          return {
            x: Math.max(10, Math.min(window.innerWidth - 360, prev.x)),
            y: Math.max(10, Math.min(window.innerHeight - 80, prev.y)),
          };
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mounted, position]);

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input") || (e.target as HTMLElement).closest("a")) return;
    e.preventDefault();
    isDraggingRef.current = true;

    const el = cardRef.current;
    const rect = el ? el.getBoundingClientRect() : { left: window.innerWidth - 380, top: window.innerHeight - 520 };
    const currentX = position?.x ?? rect.left;
    const currentY = position?.y ?? rect.top;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;
      const width = isMinimized ? 220 : 360;
      const newX = Math.max(10, Math.min(window.innerWidth - width - 10, dragStartRef.current.initialX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 70, dragStartRef.current.initialY + deltaY));
      setPosition({ x: newX, y: newY });
      setDockPreset("custom");
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Touch drag for mobile/trackpad
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input")) return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    const el = cardRef.current;
    const rect = el ? el.getBoundingClientRect() : { left: window.innerWidth - 380, top: window.innerHeight - 520 };
    const currentX = position?.x ?? rect.left;
    const currentY = position?.y ?? rect.top;

    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: currentX,
      initialY: currentY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.startX;
    const deltaY = touch.clientY - dragStartRef.current.startY;
    const width = isMinimized ? 220 : 360;
    const newX = Math.max(10, Math.min(window.innerWidth - width - 10, dragStartRef.current.initialX + deltaX));
    const newY = Math.max(10, Math.min(window.innerHeight - 70, dragStartRef.current.initialY + deltaY));
    setPosition({ x: newX, y: newY });
    setDockPreset("custom");
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const applyDock = (dock: "top-right" | "bottom-right" | "bottom-left") => {
    setDockPreset(dock);
    if (typeof window === "undefined") return;
    const width = isMinimized ? 220 : 360;
    if (dock === "top-right") {
      setPosition({ x: window.innerWidth - width - 20, y: 70 });
    } else if (dock === "bottom-right") {
      setPosition({ x: window.innerWidth - width - 20, y: window.innerHeight - (isMinimized ? 60 : 490) });
    } else if (dock === "bottom-left") {
      setPosition({ x: 20, y: window.innerHeight - (isMinimized ? 60 : 490) });
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const resetChecklist = () => {
    setCheckedItems({});
  };

  const allChecked = DEFAULT_CHECKLIST.every((item) => checkedItems[item.id]);
  const checkedCount = DEFAULT_CHECKLIST.filter((item) => checkedItems[item.id]).length;

  if (!mounted || !isVisible) {
    // When hidden, provide a discrete corner toggle button
    return (
      <button
        onClick={() => {
          setIsVisible(true);
          setIsMinimized(false);
        }}
        title="Show Trader Guardrail"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/90 hover:bg-surface border border-border/70 text-xs font-semibold text-soft hover:text-clean shadow-xl backdrop-blur-md cursor-pointer transition-all hover:scale-105"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-profit" />
        <span>Guardrail</span>
      </button>
    );
  }

  // Positioning style
  const stylePos: React.CSSProperties = position
    ? {
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 50,
      }
    : {
        position: "fixed",
        right: "1.25rem",
        bottom: "1.25rem",
        zIndex: 50,
      };

  // Minimized Compact Pill
  if (isMinimized) {
    return (
      <div
        ref={cardRef}
        style={stylePos}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="select-none flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface/95 backdrop-blur-xl border border-border/80 shadow-2xl cursor-grab active:cursor-grabbing hover:border-accent transition-all group animate-in fade-in"
      >
        <GripHorizontal className="h-3.5 w-3.5 text-dim shrink-0 group-hover:text-soft" />

        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                allChecked ? "bg-profit" : "bg-warn"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                allChecked ? "bg-profit" : "bg-warn"
              }`}
            />
          </span>

          <span className="text-xs font-bold text-clean font-mono">
            {allChecked ? "Guardrail: Ready (4/4)" : `Guardrail: ${checkedCount}/4`}
          </span>
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          title="Expand Guardrail"
          className="ml-1 p-1 rounded-md hover:bg-elevated text-dim hover:text-clean transition-colors cursor-pointer"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Expanded Guardrail Panel
  return (
    <div
      ref={cardRef}
      style={stylePos}
      className="select-none w-[340px] sm:w-[360px] rounded-2xl bg-surface/95 backdrop-blur-xl border border-border/80 shadow-2xl flex flex-col overflow-hidden text-xs transition-shadow animate-in fade-in zoom-in-95"
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="px-3.5 py-2.5 bg-card/70 border-b border-border/40 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-3.5 w-3.5 text-dim hover:text-soft shrink-0" />
          <div className="flex items-center gap-1.5">
            {allChecked ? (
              <ShieldCheck className="h-4 w-4 text-profit shrink-0" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-warn shrink-0" />
            )}
            <span className="font-bold text-clean tracking-wide">Trader Guardrail</span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          {/* Quick Dock Presets Dropdown */}
          <div className="relative group">
            <button
              title="Dock Position"
              className="p-1 rounded-md hover:bg-elevated text-dim hover:text-soft transition-colors cursor-pointer text-[10px] font-mono"
            >
              Dock
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-surface border border-border/80 rounded-lg shadow-xl p-1 z-50 text-[10px] whitespace-nowrap">
              <button
                onClick={() => applyDock("top-right")}
                className="px-2 py-1 text-left hover:bg-elevated rounded text-soft hover:text-clean cursor-pointer"
              >
                Top Right
              </button>
              <button
                onClick={() => applyDock("bottom-right")}
                className="px-2 py-1 text-left hover:bg-elevated rounded text-soft hover:text-clean cursor-pointer"
              >
                Bottom Right
              </button>
              <button
                onClick={() => applyDock("bottom-left")}
                className="px-2 py-1 text-left hover:bg-elevated rounded text-soft hover:text-clean cursor-pointer"
              >
                Bottom Left
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsMinimized(true)}
            title="Minimize Guardrail"
            className="p-1 rounded-md hover:bg-elevated text-dim hover:text-clean transition-colors cursor-pointer"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setIsVisible(false)}
            title="Close Guardrail"
            className="p-1 rounded-md hover:bg-elevated text-dim hover:text-loss transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Execution Readiness Banner */}
      <div
        className={`px-3.5 py-2 flex items-center justify-between text-[11px] font-semibold transition-colors ${
          allChecked
            ? "bg-profit/15 text-profit border-b border-profit/20"
            : "bg-warn/15 text-warn border-b border-warn/20"
        }`}
      >
        <div className="flex items-center gap-1.5">
          {allChecked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          <span>
            {allChecked
              ? "EXECUTION UNLOCKED (4/4)"
              : `LOCKOUT: Confirm All Criteria (${checkedCount}/4)`}
          </span>
        </div>
        <button
          onClick={resetChecklist}
          title="Reset Checklist"
          className="flex items-center gap-1 text-[10px] font-mono text-dim hover:text-clean transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border/40 bg-card/30 p-1 gap-1">
        <button
          onClick={() => setActiveTab("checklist")}
          className={`flex-1 py-1 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer ${
            activeTab === "checklist"
              ? "bg-accent text-white shadow-xs"
              : "text-muted hover:text-clean"
          }`}
        >
          Pre-Trade Checklist
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`flex-1 py-1 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer ${
            activeTab === "rules"
              ? "bg-accent text-white shadow-xs"
              : "text-muted hover:text-clean"
          }`}
        >
          Core Execution Rules
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-3.5 max-h-[340px] overflow-y-auto space-y-3">
        {activeTab === "checklist" ? (
          <div className="space-y-2">
            <p className="text-[10px] text-muted leading-tight">
              Tick each confirmation before placing your order. No impulse entries.
            </p>
            {DEFAULT_CHECKLIST.map((item) => {
              const checked = !!checkedItems[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    checked
                      ? "bg-profit/10 border-profit/40 text-clean"
                      : "bg-card-accent/70 border-border/40 hover:border-border text-soft"
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    {checked ? (
                      <CheckCircle2 className="h-4 w-4 text-profit" />
                    ) : (
                      <Circle className="h-4 w-4 text-dim" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className={`text-xs font-semibold ${checked ? "text-profit" : "text-clean"}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-muted leading-tight">{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Rule 1 */}
            <div className="p-2.5 rounded-xl bg-card-accent/70 border border-border/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-clean">
                <span className="h-4 w-4 rounded bg-accent/20 text-accent flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Structural Invalidation</span>
              </div>
              <p className="text-[11px] text-soft leading-relaxed">
                Place your Stop Loss strictly where your technical thesis is invalidated, not on
                an arbitrary dollar loss or emotional panic point.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="p-2.5 rounded-xl bg-card-accent/70 border border-border/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-clean">
                <span className="h-4 w-4 rounded bg-loss/20 text-loss flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Hands-Off Management</span>
              </div>
              <p className="text-[11px] text-soft leading-relaxed">
                Once an order is active: <strong>never widen, cancel, or tamper with your Stop Loss</strong>. Let the trade hit TP or SL cleanly. Tampering is revenge trading in disguise.
              </p>
            </div>

            {/* Rule 3 */}
            <div className="p-2.5 rounded-xl bg-card-accent/70 border border-border/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-clean">
                <span className="h-4 w-4 rounded bg-profit/20 text-profit flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Process Acceptance</span>
              </div>
              <p className="text-[11px] text-soft leading-relaxed">
                A planned, disciplined loss is simply the inevitable cost of business. Preserve your
                mental capital for the next edge setup.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Quick Coach Bridge */}
      <div className="p-2.5 bg-card/60 border-t border-border/30 flex items-center justify-between text-[10px]">
        <Link
          href="/ai-coach"
          className="flex items-center gap-1.5 text-ai hover:underline font-semibold"
        >
          <Sparkles className="h-3 w-3" />
          <span>Ask AI Coach</span>
        </Link>
        <span className="text-dim font-mono">Discipline &gt; Prediction</span>
      </div>
    </div>
  );
}
