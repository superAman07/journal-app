"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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
  AlertOctagon,
  Crosshair,
  Flame,
  Award,
  Zap,
} from "lucide-react";

export interface ChecklistItem {
  id: string;
  label: string;
  sub: string;
  category?: string;
}

export interface ReversalPoint {
  id: string;
  code: string;
  title: string;
  detail: string;
  section: "level" | "context" | "trigger" | "filter" | "workflow";
  isMandatory?: boolean;
  isHardFilter?: boolean;
}

const DEFAULT_PRETRADE_RULES: ChecklistItem[] = [
  {
    id: "invalidation",
    label: "Structural Invalidation Mapped",
    sub: "SL placed where thesis is dead, not arbitrary dollar pain.",
  },
  {
    id: "risk",
    label: "Strict Position Sizing (≤ 1-2%)",
    sub: "Risk is capped mathematically to capital limit.",
  },
  {
    id: "rr",
    label: "Asymmetric Risk:Reward (≥ 1:2.3)",
    sub: "Clear runway with no opposing levels blocking target.",
  },
  {
    id: "mindset",
    label: "Zero FOMO & Process Acceptance",
    sub: "Emotionally neutral. Fully accepting loss if hit.",
  },
];

// Aman's Specific A+ Reversal Protocol Points
const AMAN_REVERSAL_POINTS: ReversalPoint[] = [
  // 1. Level Quality
  {
    id: "lq_1",
    code: "1a",
    section: "level",
    title: "Day/Week S/R untouched ≥5 sessions",
    detail: "Fresh institutional liquidity zone, untouched for 5+ trading days.",
    isMandatory: true,
  },
  {
    id: "lq_2",
    code: "1b",
    section: "level",
    title: "Level NOT broken repeatedly recently",
    detail: "Not chopped through or repeatedly invalidated by wicks.",
    isMandatory: true,
  },
  {
    id: "lq_3",
    code: "1c",
    section: "level",
    title: "Aligns with PDC / VWAP Gap / S-to-R flip",
    detail: "High-probability structural confluence at the reversal zone.",
    isMandatory: true,
  },
  {
    id: "lq_4",
    code: "1d",
    section: "level",
    title: "Gap-Up / Gap-Down present (Optional)",
    detail: "Gap-fill confluence into the level.",
    isMandatory: false,
  },

  // 2. Market Context
  {
    id: "mc_1",
    code: "2a",
    section: "context",
    title: "Higher Highs (or LL) broken",
    detail: "Reversal from level gives an asymmetric 'Easy Target' liquidity run.",
    isMandatory: false,
  },
  {
    id: "mc_2",
    code: "2b",
    section: "context",
    title: "VWAP significantly displaced from price",
    detail: "High statistical mean-reversion probability back to fair value.",
    isMandatory: false,
  },
  {
    id: "mc_3",
    code: "2c",
    section: "context",
    title: "Straight-line price approach (No pause)",
    detail: "Unchecked momentum directly into level indicates exhaustion.",
    isMandatory: false,
  },
  {
    id: "mc_4",
    code: "2d",
    section: "context",
    title: "Market NOT 'Choppy / Scary'",
    detail: "Clear directional flow into level, not overlapping erratic noise.",
    isMandatory: false,
  },

  // 3. Entry Trigger
  {
    id: "et_1",
    code: "3a",
    section: "trigger",
    title: "Price at level + 30–50% Fib retracement",
    detail: "Measured on the impulsive leg leading into the level.",
    isMandatory: true,
  },
  {
    id: "et_2",
    code: "3b",
    section: "trigger",
    title: "Visible pause/rejection candle(s) at Fib",
    detail: "Institutional defense shown via wick rejection.",
    isMandatory: true,
  },
  {
    id: "et_3",
    code: "3c",
    section: "trigger",
    title: "Entry at rejection extreme",
    detail: "Lowest point of rejection (CE) / Highest point (PE).",
    isMandatory: true,
  },
  {
    id: "et_4",
    code: "3d",
    section: "trigger",
    title: "SL = Structure-based 22–23 pts (Risk: ₹1,430)",
    detail: "Placed beyond rejection where thesis is dead.",
    isMandatory: true,
  },
  {
    id: "et_5",
    code: "3e",
    section: "trigger",
    title: "Target = 54 pts (1:2.3+ RR) with open runway",
    detail: "Clear space to target with no opposing key level.",
    isMandatory: true,
  },

  // 4. Hard Filters
  {
    id: "hf_1",
    code: "4a",
    section: "filter",
    title: "Level broken multiple times recently",
    detail: "ACTION: SKIP. Thesis is invalid.",
    isHardFilter: true,
  },
  {
    id: "hf_2",
    code: "4b",
    section: "filter",
    title: "Choppy / overlapping / 'scary' price action",
    detail: "ACTION: NO TRADE DAY. Protect mental capital.",
    isHardFilter: true,
  },
  {
    id: "hf_3",
    code: "4c",
    section: "filter",
    title: "Target path blocked by opposing level",
    detail: "ACTION: SKIP. RR is compromised.",
    isHardFilter: true,
  },
  {
    id: "hf_4",
    code: "4d",
    section: "filter",
    title: "No 30–50% Fib pause at level",
    detail: "ACTION: WAIT / SKIP. Do not chase.",
    isHardFilter: true,
  },
  {
    id: "hf_5",
    code: "4e",
    section: "filter",
    title: "Mental state: Urgency / FOMO / Revenge",
    detail: "ACTION: STAND DOWN. Close terminal.",
    isHardFilter: true,
  },
  {
    id: "hf_6",
    code: "4f",
    section: "filter",
    title: "Already took 1 trade today (Win or Loss)",
    detail: "ACTION: TERMINAL LOCKED. Strictly 1 trade/day.",
    isHardFilter: true,
  },

  // 5. Morning Routine (9:00-9:15 AM)
  {
    id: "wf_1",
    code: "5.1",
    section: "workflow",
    title: "Mark Day/Week Levels untouched 5+ sessions",
    detail: "Identify pristine liquidity zones on daily/weekly charts.",
  },
  {
    id: "wf_2",
    code: "5.2",
    section: "workflow",
    title: "Assess Structure: HH broken? VWAP gap?",
    detail: "Determine bias: continuation vs mean-reversion reversal.",
  },
  {
    id: "wf_3",
    code: "5.3",
    section: "workflow",
    title: "Label Day Type: TREND / RANGE / CHOP",
    detail: "If CHOP/SCARY → Declare 'No Trade Day' at 9:15 AM.",
  },
  {
    id: "wf_4",
    code: "5.4",
    section: "workflow",
    title: "Wait for Level + 30–50% Fib + Rejection",
    detail: "Stalk like a sniper. Never front-run confirmation.",
  },
  {
    id: "wf_5",
    code: "5.5",
    section: "workflow",
    title: "All boxes ticked? → EXECUTE. Else → WATCH",
    detail: "Binary decision. Zero hesitation, zero FOMO.",
  },
  {
    id: "wf_6",
    code: "5.6",
    section: "workflow",
    title: "Post-Trade: Terminal Locked. Journal. Walk Away.",
    detail: "Preserve gains, accept losses, come back tomorrow.",
  },
];

interface TraderGuardrailProps {
  isPipMode?: boolean;
}

export function TraderGuardrail({ isPipMode = false }: TraderGuardrailProps) {
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const isAman = userEmail === "rivalaman123@gmail.com";

  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Active Tab: Default to 'reversal' for Aman, or 'pretrade' for others
  const [activeTab, setActiveTab] = useState<"reversal" | "pretrade" | "core">("reversal");
  const [reversalSection, setReversalSection] = useState<string>("all");

  // State for General Pre-Trade Checklist
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(DEFAULT_PRETRADE_RULES);
  const [checkedPretrade, setCheckedPretrade] = useState<{ [id: string]: boolean }>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newSub, setNewSub] = useState("");

  // State for A+ Reversal Protocol
  const [checkedReversal, setCheckedReversal] = useState<{ [id: string]: boolean }>({});
  const [failedFilters, setFailedFilters] = useState<{ [id: string]: boolean }>({});

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

      const savedTab = localStorage.getItem("trading_guardrail_active_tab");
      if (savedTab) {
        setActiveTab(savedTab as any);
      } else if (isAman) {
        setActiveTab("reversal");
      }

      const savedPretradeChecks = localStorage.getItem("trading_guardrail_pretrade_checks");
      if (savedPretradeChecks) setCheckedPretrade(JSON.parse(savedPretradeChecks));

      const savedReversalChecks = localStorage.getItem("trading_guardrail_reversal_checks");
      if (savedReversalChecks) setCheckedReversal(JSON.parse(savedReversalChecks));

      const savedFailures = localStorage.getItem("trading_guardrail_reversal_failures");
      if (savedFailures) setFailedFilters(JSON.parse(savedFailures));

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
          const safeX = Math.max(10, Math.min(window.innerWidth - 370, parsed.x));
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
  }, [isPipMode, isAman]);

  // Persist state to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("trading_guardrail_pretrade_checks", JSON.stringify(checkedPretrade));
      localStorage.setItem("trading_guardrail_reversal_checks", JSON.stringify(checkedReversal));
      localStorage.setItem("trading_guardrail_reversal_failures", JSON.stringify(failedFilters));
      localStorage.setItem("trading_guardrail_custom_items", JSON.stringify(checklistItems));
      localStorage.setItem("trading_guardrail_active_tab", activeTab);
      localStorage.setItem("trading_guardrail_minimized", String(isMinimized));
      localStorage.setItem("trading_guardrail_visible", String(isVisible));
      localStorage.setItem("trading_guardrail_dock", dockPreset);
      if (position && !isPipMode) {
        localStorage.setItem("trading_guardrail_pos", JSON.stringify(position));
      }
    } catch (e) {
      console.error("Failed to persist guardrail state:", e);
    }
  }, [
    checkedPretrade,
    checkedReversal,
    failedFilters,
    checklistItems,
    activeTab,
    isMinimized,
    isVisible,
    dockPreset,
    position,
    mounted,
    isPipMode,
  ]);

  // Dragging handlers
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
      const newX = Math.max(
        10,
        Math.min(window.innerWidth - 370, dragStartRef.current.initialX + deltaX)
      );
      const newY = Math.max(
        10,
        Math.min(window.innerHeight - 80, dragStartRef.current.initialY + deltaY)
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
      (e.target as HTMLElement).closest("input") ||
      (e.target as HTMLElement).closest("a")
    )
      return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    const el = cardRef.current;
    const rect = el
      ? el.getBoundingClientRect()
      : { left: window.innerWidth - 380, top: window.innerHeight - 520 };
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: position?.x ?? rect.left,
      initialY: position?.y ?? rect.top,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || isPipMode) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.startX;
    const deltaY = touch.clientY - dragStartRef.current.startY;
    const newX = Math.max(
      10,
      Math.min(window.innerWidth - 350, dragStartRef.current.initialX + deltaX)
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
        y: window.innerHeight - (isMinimized ? 60 : 540),
      });
    } else if (dock === "bottom-left") {
      setPosition({ x: 20, y: window.innerHeight - (isMinimized ? 60 : 540) });
    }
  };

  // Toggle checks for Pre-Trade
  const togglePretradeCheck = (id: string) => {
    setCheckedPretrade((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle checks for Reversal
  const toggleReversalCheck = (id: string) => {
    setCheckedReversal((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle Hard Filter failure
  const toggleHardFilter = (id: string) => {
    setFailedFilters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Reset checks
  const handleResetCurrent = () => {
    if (activeTab === "reversal") {
      setCheckedReversal({});
      setFailedFilters({});
    } else {
      setCheckedPretrade({});
    }
  };

  // Add custom pre-trade task
  const handleAddCustomTask = () => {
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

  // Remove custom task
  const handleRemoveTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = checklistItems.filter((item) => item.id !== id);
    setChecklistItems(updated);
    localStorage.setItem("trading_guardrail_custom_items", JSON.stringify(updated));

    setCheckedPretrade((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleRestoreDefaults = () => {
    setChecklistItems(DEFAULT_PRETRADE_RULES);
    localStorage.setItem("trading_guardrail_custom_items", JSON.stringify(DEFAULT_PRETRADE_RULES));
    setCheckedPretrade({});
  };

  // Document Picture-in-Picture / Broker Overlay Pop-out
  const openPipWindow = async () => {
    if (typeof window !== "undefined" && "documentPictureInPicture" in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 375,
          height: 600,
        });

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

        setIsMinimized(true);
        return;
      } catch (err) {
        console.warn("PIP request failed, opening popup:", err);
      }
    }

    window.open(
      "/guardrail-popout",
      "trader_guardrail_popout",
      "width=380,height=600,menubar=no,toolbar=no,location=no,status=no,resizable=yes"
    );
  };

  // Reversal Checklist Calculations
  const mandatoryReversalItems = useMemo(
    () => AMAN_REVERSAL_POINTS.filter((p) => p.isMandatory),
    []
  );
  const checkedMandatoryCount = useMemo(
    () => mandatoryReversalItems.filter((p) => checkedReversal[p.id]).length,
    [mandatoryReversalItems, checkedReversal]
  );
  const isHardFilterTriggered = useMemo(
    () => Object.values(failedFilters).some(Boolean),
    [failedFilters]
  );
  const isReversalFullyValidated =
    checkedMandatoryCount === mandatoryReversalItems.length && !isHardFilterTriggered;

  // Pre-Trade Checklist Calculations
  const totalPretradeCount = checklistItems.length;
  const checkedPretradeCount = checklistItems.filter((i) => checkedPretrade[i.id]).length;
  const isPretradeReady = totalPretradeCount > 0 && checkedPretradeCount === totalPretradeCount;

  // Overall Status
  const isCurrentTabReady = activeTab === "reversal" ? isReversalFullyValidated : isPretradeReady;

  if (!mounted) return null;

  // Minimized Floating Pill
  if (isMinimized && !isPipMode) {
    return (
      <div
        ref={cardRef}
        style={
          position
            ? { position: "fixed", left: `${position.x}px`, top: `${position.y}px`, zIndex: 50 }
            : { position: "fixed", right: "1.25rem", bottom: "1.25rem", zIndex: 50 }
        }
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="select-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/95 backdrop-blur-xl border border-border/80 shadow-2xl cursor-grab active:cursor-grabbing hover:border-accent transition-all group animate-in fade-in"
      >
        <GripHorizontal className="h-3 w-3 text-dim shrink-0 group-hover:text-soft" />

        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isHardFilterTriggered
                  ? "bg-loss"
                  : isCurrentTabReady
                  ? "bg-profit"
                  : "bg-warn"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isHardFilterTriggered
                  ? "bg-loss"
                  : isCurrentTabReady
                  ? "bg-profit"
                  : "bg-warn"
              }`}
            />
          </span>

          <span className="text-[11px] font-bold text-clean font-mono">
            {isHardFilterTriggered
              ? "Stand Down (Fail)"
              : isCurrentTabReady
              ? "Ready (100%)"
              : activeTab === "reversal"
              ? `Reversal (${checkedMandatoryCount}/${mandatoryReversalItems.length})`
              : `Rules (${checkedPretradeCount}/${totalPretradeCount})`}
          </span>
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          title="Expand Guardrail"
          className="ml-1 p-1 rounded-md hover:bg-elevated text-dim hover:text-clean transition-colors cursor-pointer"
        >
          <Maximize2 className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Hidden Toggle Pill
  if (!isVisible && !isPipMode) {
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

  // Positioning style for Expanded Panel
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

  return (
    <div
      ref={cardRef}
      style={stylePos}
      className={`select-none rounded-2xl bg-surface/95 dark:bg-[#0e121d]/95 backdrop-blur-xl border border-border/80 shadow-2xl flex flex-col overflow-hidden text-xs transition-shadow animate-in fade-in zoom-in-95 ${
        isPipMode ? "w-full h-full" : "w-[340px] sm:w-[370px] max-h-[580px] h-[82vh] sm:h-[580px]"
      }`}
    >
      {/* ── Header ── */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`px-3 py-2 bg-card/80 border-b border-border/40 flex items-center justify-between select-none ${
          isPipMode ? "" : "cursor-grab active:cursor-grabbing"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {!isPipMode && <GripHorizontal className="h-3.5 w-3.5 text-dim hover:text-soft shrink-0" />}
          <div className="flex items-center gap-1.5 truncate">
            {isHardFilterTriggered ? (
              <ShieldAlert className="h-4 w-4 text-loss shrink-0" />
            ) : isCurrentTabReady ? (
              <ShieldCheck className="h-4 w-4 text-profit shrink-0" />
            ) : (
              <Crosshair className="h-4 w-4 text-accent shrink-0" />
            )}
            <span className="font-extrabold text-clean tracking-tight text-xs">
              Trader Guardrail
            </span>
            {isAman && (
              <span className="text-[9px] font-bold bg-accent/15 text-accent px-1.5 py-0.2 rounded font-mono">
                Aman
              </span>
            )}
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {!isPipMode && (
            <button
              onClick={openPipWindow}
              title="Pop out Always-on-Top over Chrome & Broker (Zerodha, TradingView, Dhan)"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-ai/10 hover:bg-ai/20 border border-ai/30 text-ai text-[10px] font-bold transition-all cursor-pointer shadow-xs"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="hidden xs:inline">Overlay</span>
            </button>
          )}

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
              title="Minimize Guardrail"
              className="p-1 rounded-md hover:bg-elevated text-dim hover:text-clean transition-colors cursor-pointer"
            >
              <Minimize2 className="h-3 w-3" />
            </button>
          )}

          {!isPipMode && (
            <button
              onClick={() => setIsVisible(false)}
              title="Close Guardrail"
              className="p-1 rounded-md hover:bg-elevated text-dim hover:text-loss transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Execution Status Lockout Banner ── */}
      <div
        className={`px-3 py-1.5 flex items-center justify-between text-[11px] font-bold transition-colors shrink-0 ${
          isHardFilterTriggered
            ? "bg-loss/20 text-loss border-b border-loss/30 animate-pulse"
            : isCurrentTabReady
            ? "bg-profit/15 text-profit border-b border-profit/25"
            : "bg-warn/15 text-warn border-b border-warn/25"
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {isHardFilterTriggered ? (
            <AlertOctagon className="h-3.5 w-3.5 shrink-0" />
          ) : isCurrentTabReady ? (
            <Unlock className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Lock className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">
            {isHardFilterTriggered
              ? "STAND DOWN: Hard Filter Triggered"
              : isCurrentTabReady
              ? "EXECUTION UNLOCKED (100% Edge Validated)"
              : activeTab === "reversal"
              ? `CONFIRM SETUP: (${checkedMandatoryCount}/${mandatoryReversalItems.length} Req)`
              : `LOCKOUT: Confirm Rules (${checkedPretradeCount}/${totalPretradeCount})`}
          </span>
        </div>

        <button
          onClick={handleResetCurrent}
          title="Reset Checkbox marks"
          className="flex items-center gap-1 text-[10px] font-mono text-dim hover:text-clean transition-colors cursor-pointer shrink-0 ml-1"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      {/* ── Main Category Tabs ── */}
      <div className="flex items-center border-b border-border/40 bg-card/40 p-1 gap-1 shrink-0 text-[10px] sm:text-[11px]">
        <button
          onClick={() => setActiveTab("reversal")}
          className={`flex-1 py-1 rounded-lg font-bold text-center transition-all cursor-pointer truncate ${
            activeTab === "reversal"
              ? "bg-accent text-white shadow-xs"
              : "text-muted hover:text-clean"
          }`}
        >
          A+ Reversal {isAman ? "★" : ""}
        </button>
        <button
          onClick={() => setActiveTab("pretrade")}
          className={`flex-1 py-1 rounded-lg font-bold text-center transition-all cursor-pointer truncate ${
            activeTab === "pretrade"
              ? "bg-accent text-white shadow-xs"
              : "text-muted hover:text-clean"
          }`}
        >
          Pre-Trade ({checkedPretradeCount}/{totalPretradeCount})
        </button>
        <button
          onClick={() => setActiveTab("core")}
          className={`flex-1 py-1 rounded-lg font-bold text-center transition-all cursor-pointer truncate ${
            activeTab === "core"
              ? "bg-accent text-white shadow-xs"
              : "text-muted hover:text-clean"
          }`}
        >
          Core Code
        </button>
      </div>

      {/* ── Scrollable Tab Content ── */}
      <div className="p-2.5 sm:p-3 flex-1 overflow-y-auto space-y-2.5 min-h-0">
        {/* TAB 1: A+ REVERSAL PROTOCOL */}
        {activeTab === "reversal" && (
          <div className="space-y-2">
            {/* Setup Specs Mini Badge */}
            <div className="p-2 rounded-xl bg-surface/70 border border-border/40 flex items-center justify-between text-[10px] font-mono">
              <span className="text-clean font-bold">NIFTY 50 Options</span>
              <span className="text-loss font-bold">Risk: ₹1,430 (22–23 pts)</span>
              <span className="text-profit font-bold">TP: 54 pts (1:2.3+ RR)</span>
            </div>

            {/* Sub-Section Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
              {[
                { id: "all", label: "All" },
                { id: "level", label: "1. Level" },
                { id: "context", label: "2. Context" },
                { id: "trigger", label: "3. Trigger" },
                { id: "filter", label: "4. Hard Filters" },
                { id: "workflow", label: "5. Routine" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setReversalSection(s.id)}
                  className={`px-2 py-0.8 rounded-md font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    reversalSection === s.id
                      ? "bg-accent/20 text-accent border border-accent/30 font-bold"
                      : "bg-surface text-muted hover:text-clean border border-border/30"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Reversal Checklist Items */}
            <div className="space-y-1.5">
              {AMAN_REVERSAL_POINTS.filter(
                (p) => reversalSection === "all" || p.section === reversalSection
              ).map((item) => {
                const isHard = item.isHardFilter;
                const isFailed = Boolean(failedFilters[item.id]);
                const isChecked = Boolean(checkedReversal[item.id]);

                if (isHard) {
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleHardFilter(item.id)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2 ${
                        isFailed
                          ? "bg-loss/20 border-loss text-loss shadow-xs"
                          : "bg-surface/50 border-loss/20 hover:border-loss/40 text-soft"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isFailed ? (
                          <AlertOctagon className="h-3.5 w-3.5 text-loss fill-loss/20" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-loss/50" />
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[11px] font-bold ${
                              isFailed ? "text-loss line-through" : "text-clean"
                            }`}
                          >
                            {item.code}. {item.title}
                          </span>
                          <span className="text-[8px] px-1 rounded bg-loss/15 text-loss font-mono">
                            FAIL=SKIP
                          </span>
                        </div>
                        <p className="text-[10px] text-muted font-mono leading-tight">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Regular Reversal Item
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleReversalCheck(item.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2 ${
                      isChecked
                        ? "bg-profit/10 border-profit/40 text-clean"
                        : "bg-surface/50 border-border/40 hover:border-border text-soft"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-profit fill-profit/20" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-dim" />
                      )}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[11px] font-semibold ${
                            isChecked ? "text-profit font-bold" : "text-clean"
                          }`}
                        >
                          {item.code}. {item.title}
                        </span>
                        {item.isMandatory && (
                          <span className="text-[8px] px-1 rounded bg-accent/15 text-accent font-mono font-bold">
                            REQ
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted leading-tight">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: GENERAL PRE-TRADE RULES (CUSTOMIZABLE BY ANY USER) */}
        {activeTab === "pretrade" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-muted">
              <span>Verify rules before placing broker order:</span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-ai hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> {showAddForm ? "Cancel" : "Add Rule"}
              </button>
            </div>

            {/* Add Rule Form */}
            {showAddForm && (
              <div className="p-2.5 rounded-xl bg-card border border-ai/40 space-y-2 animate-in fade-in">
                <div className="text-[11px] font-bold text-clean">New Discipline Rule</div>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustomTask()}
                  placeholder="Rule (e.g. Wait for 15m candle close)"
                  className="input-field py-1 text-xs w-full"
                  autoFocus
                />
                <input
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustomTask()}
                  placeholder="Detail (e.g. No early entry without confirmation)"
                  className="input-field py-1 text-[10px] w-full"
                />
                <div className="flex items-center justify-end gap-2 pt-0.5">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-2 py-0.5 rounded text-[10px] text-muted hover:text-clean cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomTask}
                    disabled={!newLabel.trim()}
                    className="btn-primary py-0.5! px-2.5! text-[10px]! rounded-lg! cursor-pointer disabled:opacity-50"
                  >
                    Add Rule
                  </button>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="space-y-1.5">
              {checklistItems.map((item) => {
                const checked = Boolean(checkedPretrade[item.id]);
                return (
                  <div
                    key={item.id}
                    onClick={() => togglePretradeCheck(item.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 group ${
                      checked
                        ? "bg-profit/10 border-profit/40 text-clean"
                        : "bg-surface/50 border-border/40 hover:border-border text-soft"
                    }`}
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {checked ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-profit" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-dim group-hover:text-soft" />
                        )}
                      </div>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div
                          className={`text-[11px] font-semibold truncate ${
                            checked ? "text-profit" : "text-clean"
                          }`}
                        >
                          {item.label}
                        </div>
                        <div className="text-[10px] text-muted leading-tight line-clamp-2">
                          {item.sub}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleRemoveTask(item.id, e)}
                      title="Remove this rule"
                      className="p-1 rounded-lg text-dim hover:text-loss hover:bg-loss/15 transition-all opacity-40 group-hover:opacity-100 cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {checklistItems.length === 0 && (
              <div className="text-center py-4 space-y-1.5">
                <p className="text-[11px] text-muted">No rules currently defined.</p>
                <button
                  onClick={handleRestoreDefaults}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-accent text-white cursor-pointer"
                >
                  Restore Default Execution Rules
                </button>
              </div>
            )}

            {checklistItems.length > 0 && (
              <div className="pt-1 flex items-center justify-between text-[9px] text-muted">
                <button
                  onClick={handleRestoreDefaults}
                  className="text-dim hover:text-clean hover:underline cursor-pointer"
                >
                  Restore Defaults
                </button>
                <span className="font-mono">{checklistItems.length} active rules</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CORE EXECUTION CODE */}
        {activeTab === "core" && (
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-surface/60 border border-border/40 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-clean">
                <span className="h-3.5 w-3.5 rounded bg-accent/20 text-accent flex items-center justify-center text-[9px]">
                  1
                </span>
                <span>Structural Invalidation</span>
              </div>
              <p className="text-[10px] text-soft leading-relaxed">
                Place Stop Loss strictly where the market structure disproves your thesis (22–23 pts), never on dollar pain.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-surface/60 border border-border/40 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-clean">
                <span className="h-3.5 w-3.5 rounded bg-loss/20 text-loss flex items-center justify-center text-[9px]">
                  2
                </span>
                <span>Hands-Off Management</span>
              </div>
              <p className="text-[10px] text-soft leading-relaxed">
                Never widen or cancel a Stop Loss. Let the trade hit TP (54 pts) or SL cleanly. Tampering is revenge trading in disguise.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-surface/60 border border-border/40 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-clean">
                <span className="h-3.5 w-3.5 rounded bg-profit/20 text-profit flex items-center justify-center text-[9px]">
                  3
                </span>
                <span>Process Acceptance</span>
              </div>
              <p className="text-[10px] text-soft leading-relaxed">
                A planned loss is standard operating friction. Max 1 trade per day. Protect capital for tomorrow.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="p-2 px-3 bg-card/70 border-t border-border/30 flex items-center justify-between text-[10px] shrink-0">
        <Link
          href="/ai-coach"
          className="flex items-center gap-1 text-ai hover:underline font-semibold"
        >
          <Sparkles className="h-3 w-3" />
          <span>Ask AI Coach</span>
        </Link>
        <span className="text-dim font-mono">Discipline &gt; Prediction</span>
      </div>
    </div>
  );
}
