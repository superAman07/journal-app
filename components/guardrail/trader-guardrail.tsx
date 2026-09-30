"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
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
  Plus,
  Trash2,
} from "lucide-react";

export interface ChecklistItem {
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

interface TraderGuardrailProps {
  isPipMode?: boolean;
}

export function TraderGuardrail({ isPipMode = false }: TraderGuardrailProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [id: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<"checklist" | "rules">("checklist");

  // Dynamic task management (Add / Remove)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newSub, setNewSub] = useState("");

  // Draggable positioning (for in-app floating mode)
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

      const savedCustomItems = localStorage.getItem("trading_guardrail_custom_items");
      if (savedCustomItems) {
        const parsed = JSON.parse(savedCustomItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChecklistItems(parsed);
        }
      }

      const savedDock = localStorage.getItem("trading_guardrail_dock") as any;
      if (savedDock) setDockPreset(savedDock);

      const savedPos = localStorage.getItem("trading_guardrail_pos");
      if (savedPos && !isPipMode) {
        const parsed = JSON.parse(savedPos);
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
  }, [isPipMode]);

  // Save checks and custom tasks to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("trading_guardrail_checks", JSON.stringify(checkedItems));
      localStorage.setItem("trading_guardrail_custom_items", JSON.stringify(checklistItems));
      localStorage.setItem("trading_guardrail_minimized", String(isMinimized));
      localStorage.setItem("trading_guardrail_visible", String(isVisible));
      localStorage.setItem("trading_guardrail_dock", dockPreset);
      if (position && !isPipMode) {
        localStorage.setItem("trading_guardrail_pos", JSON.stringify(position));
      }
    } catch (e) {
      console.error("Failed to persist guardrail state:", e);
    }
  }, [checkedItems, checklistItems, isMinimized, isVisible, dockPreset, position, mounted, isPipMode]);

  // Window resize bounds adjustment
  useEffect(() => {
    if (!mounted || isPipMode) return;
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
  }, [mounted, position, isPipMode]);

  // Dragging handlers for in-app floating mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPipMode) return;
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("input") ||
      (e.target as HTMLElement).closest("a")
    )
      return;
    e.preventDefault();
    isDraggingRef.current = true;

    const el = cardRef.current;
    const rect = el
      ? el.getBoundingClientRect()
      : { left: window.innerWidth - 380, top: window.innerHeight - 520 };
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
      const newX = Math.max(
        10,
        Math.min(window.innerWidth - width - 10, dragStartRef.current.initialX + deltaX)
      );
      const newY = Math.max(
        10,
        Math.min(window.innerHeight - 70, dragStartRef.current.initialY + deltaY)
      );
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPipMode) return;
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("input")
    )
      return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    const el = cardRef.current;
    const rect = el
      ? el.getBoundingClientRect()
      : { left: window.innerWidth - 380, top: window.innerHeight - 520 };
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
    if (!isDraggingRef.current || isPipMode) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.startX;
    const deltaY = touch.clientY - dragStartRef.current.startY;
    const width = isMinimized ? 220 : 360;
    const newX = Math.max(
      10,
      Math.min(window.innerWidth - width - 10, dragStartRef.current.initialX + deltaX)
    );
    const newY = Math.max(
      10,
      Math.min(window.innerHeight - 70, dragStartRef.current.initialY + deltaY)
    );
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
      setPosition({
        x: window.innerWidth - width - 20,
        y: window.innerHeight - (isMinimized ? 60 : 490),
      });
    } else if (dock === "bottom-left") {
      setPosition({ x: 20, y: window.innerHeight - (isMinimized ? 60 : 490) });
    }
  };

  // Pre-trade Checkbox toggle
  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const resetChecklist = () => {
    setCheckedItems({});
  };

  // Add custom rule
  const handleAddTask = () => {
    if (!newLabel.trim()) return;
    const newItem: ChecklistItem = {
      id: `custom_${Date.now()}`,
      label: newLabel.trim(),
      sub: newSub.trim() || "Discipline rule verified before entry",
    };
    const updated = [...checklistItems, newItem];
    setChecklistItems(updated);
    localStorage.setItem("trading_guardrail_custom_items", JSON.stringify(updated));
    setNewLabel("");
    setNewSub("");
    setShowAddForm(false);
  };

  // Remove rule
  const handleRemoveTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = checklistItems.filter((item) => item.id !== id);
    setChecklistItems(updated);
    localStorage.setItem("trading_guardrail_custom_items", JSON.stringify(updated));

    setCheckedItems((prev) => {
      const copy = { ...prev };
      delete copy[id];
      localStorage.setItem("trading_guardrail_checks", JSON.stringify(copy));
      return copy;
    });
  };

  // Restore Aman's default rules
  const handleRestoreDefaults = () => {
    setChecklistItems(DEFAULT_CHECKLIST);
    localStorage.setItem("trading_guardrail_custom_items", JSON.stringify(DEFAULT_CHECKLIST));
    setCheckedItems({});
  };

  // Document Picture-in-Picture / Broker Overlay Pop-out
  const openPipWindow = async () => {
    // 1. Chrome Document Picture-in-Picture API (Creates an Always-on-Top OS floating window over all broker tabs!)
    if (typeof window !== "undefined" && "documentPictureInPicture" in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 370,
          height: 580,
        });

        // Copy all CSS stylesheets from the main document to pipWindow
        Array.from(document.styleSheets).forEach((styleSheet) => {
          try {
            const cssRules = Array.from(styleSheet.cssRules)
              .map((rule) => rule.cssText)
              .join("");
            const style = document.createElement("style");
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = styleSheet.href || "";
            pipWindow.document.head.appendChild(link);
          }
        });

        // Match theme
        pipWindow.document.documentElement.className = document.documentElement.className;
        pipWindow.document.body.className =
          "bg-background text-clean m-0 p-2 overflow-hidden flex flex-col h-screen select-none";

        const container = pipWindow.document.createElement("div");
        container.id = "guardrail-pip-root";
        container.className = "flex-1 flex flex-col min-h-0";
        pipWindow.document.body.appendChild(container);

        const { createRoot } = await import("react-dom/client");
        const root = createRoot(container);
        root.render(<TraderGuardrail isPipMode={true} />);

        pipWindow.addEventListener("pagehide", () => {
          root.unmount();
        });

        // Minimize in-app guardrail while pip window is floating
        setIsMinimized(true);
        return;
      } catch (err) {
        console.warn("Document Picture-in-Picture request failed, opening popup window instead:", err);
      }
    }

    // 2. Fallback to standalone popup window
    window.open(
      "/guardrail-popout",
      "trader_guardrail_popout",
      "width=380,height=580,menubar=no,toolbar=no,location=no,status=no,resizable=yes"
    );
  };

  const totalCount = checklistItems.length;
  const checkedCount = checklistItems.filter((item) => checkedItems[item.id]).length;
  const allChecked = totalCount > 0 && checkedCount === totalCount;

  if (!mounted) return null;

  if (!isVisible && !isPipMode) {
    // When hidden, provide a discreet floating toggle
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
  const stylePos: React.CSSProperties = isPipMode
    ? { width: "100%", height: "100%" }
    : position
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
  if (isMinimized && !isPipMode) {
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
            {allChecked ? `Guardrail: Ready (${checkedCount}/${totalCount})` : `Guardrail: ${checkedCount}/${totalCount}`}
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
      className={`select-none rounded-2xl bg-surface/95 backdrop-blur-xl border border-border/80 shadow-2xl flex flex-col overflow-hidden text-xs transition-shadow animate-in fade-in zoom-in-95 ${
        isPipMode ? "w-full h-full" : "w-[340px] sm:w-[370px]"
      }`}
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`px-3.5 py-2.5 bg-card/70 border-b border-border/40 flex items-center justify-between select-none ${
          isPipMode ? "" : "cursor-grab active:cursor-grabbing"
        }`}
      >
        <div className="flex items-center gap-2">
          {!isPipMode && <GripHorizontal className="h-3.5 w-3.5 text-dim hover:text-soft shrink-0" />}
          <div className="flex items-center gap-1.5">
            {allChecked ? (
              <ShieldCheck className="h-4 w-4 text-profit shrink-0" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-warn shrink-0" />
            )}
            <span className="font-bold text-clean tracking-wide">Trader Guardrail</span>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1">
          {/* Always on Top Pop-out / Broker Overlay button */}
          {!isPipMode && (
            <button
              onClick={openPipWindow}
              title="Pop out Always-on-Top over Chrome & Broker tab (Zerodha, TradingView, Dhan)"
              className="flex items-center gap-1 px-2 py-0.8 rounded-md bg-ai/10 hover:bg-ai/20 border border-ai/30 text-ai text-[10px] font-bold transition-all cursor-pointer shadow-xs"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Overlay Broker</span>
            </button>
          )}

          {/* Quick Dock Presets Dropdown (for in-app mode) */}
          {!isPipMode && (
            <div className="relative group">
              <button
                title="Dock Position"
                className="px-1.5 py-0.5 rounded-md hover:bg-elevated text-dim hover:text-soft transition-colors cursor-pointer text-[10px] font-mono"
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
          )}

          {!isPipMode && (
            <button
              onClick={() => setIsMinimized(true)}
              title="Minimize Guardrail into pill"
              className="p-1 rounded-md hover:bg-elevated text-dim hover:text-clean transition-colors cursor-pointer"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
          )}

          {!isPipMode && (
            <button
              onClick={() => setIsVisible(false)}
              title="Close Guardrail"
              className="p-1 rounded-md hover:bg-elevated text-dim hover:text-loss transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Execution Readiness Banner */}
      <div
        className={`px-3.5 py-2 flex items-center justify-between text-[11px] font-semibold transition-colors shrink-0 ${
          allChecked
            ? "bg-profit/15 text-profit border-b border-profit/20"
            : "bg-warn/15 text-warn border-b border-warn/20"
        }`}
      >
        <div className="flex items-center gap-1.5">
          {allChecked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          <span>
            {allChecked
              ? `EXECUTION UNLOCKED (${checkedCount}/${totalCount})`
              : `LOCKOUT: Confirm All Rules (${checkedCount}/${totalCount})`}
          </span>
        </div>
        <button
          onClick={resetChecklist}
          title="Reset Checkbox marks for next trade"
          className="flex items-center gap-1 text-[10px] font-mono text-dim hover:text-clean transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border/40 bg-card/30 p-1 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab("checklist")}
          className={`flex-1 py-1 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer ${
            activeTab === "checklist"
              ? "bg-accent text-white shadow-xs"
              : "text-muted hover:text-clean"
          }`}
        >
          Pre-Trade Checklist ({checkedCount}/{totalCount})
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
      <div className="p-3.5 flex-1 overflow-y-auto space-y-3 min-h-0">
        {activeTab === "checklist" ? (
          <div className="space-y-2">
            {/* Header with clear Add Rule toggle */}
            <div className="flex items-center justify-between text-[10px] text-muted">
              <span>Verify rules before placing broker order:</span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-ai hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> {showAddForm ? "Cancel" : "Add Rule"}
              </button>
            </div>

            {/* Inline Add Task Form */}
            {showAddForm && (
              <div className="p-2.5 rounded-xl bg-card border border-ai/40 space-y-2 animate-in fade-in">
                <div className="text-[11px] font-bold text-clean">New Discipline Rule</div>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="Rule (e.g. Waited for 15m candle close)"
                  className="input-field py-1.5 text-xs w-full"
                  autoFocus
                />
                <input
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="Note (e.g. Reject entry if chased after pump)"
                  className="input-field py-1 text-[11px] w-full"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-2 py-1 rounded text-[11px] text-muted hover:text-clean cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    disabled={!newLabel.trim()}
                    className="btn-primary py-1! px-3! text-[11px]! rounded-lg! cursor-pointer disabled:opacity-50"
                  >
                    Add Rule
                  </button>
                </div>
              </div>
            )}

            {/* Checklist Items */}
            {checklistItems.map((item) => {
              const checked = !!checkedItems[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 group ${
                    checked
                      ? "bg-profit/10 border-profit/40 text-clean"
                      : "bg-card-accent/70 border-border/40 hover:border-border text-soft"
                  }`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="pt-0.5 shrink-0">
                      {checked ? (
                        <CheckCircle2 className="h-4 w-4 text-profit" />
                      ) : (
                        <Circle className="h-4 w-4 text-dim group-hover:text-soft" />
                      )}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className={`text-xs font-semibold truncate ${checked ? "text-profit" : "text-clean"}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-muted leading-tight line-clamp-2">{item.sub}</div>
                    </div>
                  </div>

                  {/* Clear Delete / Remove Rule Button */}
                  <button
                    onClick={(e) => handleRemoveTask(item.id, e)}
                    title="Remove this rule"
                    className="p-1 rounded-lg text-dim hover:text-loss hover:bg-loss/15 transition-all opacity-40 group-hover:opacity-100 cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Empty State */}
            {checklistItems.length === 0 && (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-muted">No rules currently defined.</p>
                <button
                  onClick={handleRestoreDefaults}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-white cursor-pointer"
                >
                  Restore Default Execution Rules
                </button>
              </div>
            )}

            {/* Footer helper for restoring defaults */}
            {checklistItems.length > 0 && (
              <div className="pt-1 flex items-center justify-between text-[10px]">
                <button
                  onClick={handleRestoreDefaults}
                  className="text-dim hover:text-muted cursor-pointer hover:underline"
                >
                  Restore Aman&apos;s Core Rules
                </button>
                <span className="text-dim font-mono">{checklistItems.length} active rules</span>
              </div>
            )}
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
      <div className="p-2.5 bg-card/60 border-t border-border/30 flex items-center justify-between text-[10px] shrink-0">
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
