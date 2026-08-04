"use client";

import { useState, useEffect } from "react";
import { LineChart, X } from "lucide-react";

const CHART_SYMBOLS = [
  { key: "NIFTY", label: "NIFTY 50", tvSymbol: "NSE:NIFTY" },
  { key: "BANKNIFTY", label: "BANKNIFTY", tvSymbol: "NSE:BANKNIFTY" },
  { key: "GOLD", label: "GOLD", tvSymbol: "TVC:GOLD" },
  { key: "BTC", label: "BTC/USDT", tvSymbol: "BINANCE:BTCUSDT" },
];

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol?: string;
}

export function ChartModal({ isOpen, onClose, initialSymbol = "NIFTY" }: ChartModalProps) {
  const [activeChart, setActiveChart] = useState(initialSymbol);

  useEffect(() => {
    if (initialSymbol) {
      setActiveChart(initialSymbol);
    }
  }, [initialSymbol]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSym = CHART_SYMBOLS.find((s) => s.key === activeChart || s.label === activeChart) || CHART_SYMBOLS[0];
  const tvSymbolParam = encodeURIComponent(currentSym.tvSymbol);

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-150 p-2 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl h-[88vh] sm:h-[85vh] bg-card border border-border-solid rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Market Selector Tabs */}
        <div className="px-3 sm:px-4 py-2.5 bg-surface border-b border-border-solid flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 text-clean font-bold text-xs shrink-0 mr-1">
              <LineChart className="h-4 w-4 text-accent" />
              <span className="hidden sm:inline">Live Chart:</span>
            </div>
            {CHART_SYMBOLS.map((sym) => (
              <button
                key={sym.key}
                onClick={() => setActiveChart(sym.key)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  currentSym.key === sym.key
                    ? "bg-accent text-white shadow-sm"
                    : "bg-elevated text-dim hover:text-clean hover:bg-surface"
                }`}
              >
                {sym.label}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-elevated flex items-center justify-center text-soft hover:text-clean hover:bg-overlay transition-colors cursor-pointer shrink-0"
            title="Close Chart (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* TradingView Advanced Chart Embed */}
        <div className="flex-1 w-full h-full bg-[#131722] relative overflow-hidden">
          <iframe
            key={currentSym.key}
            src={`https://s.tradingview.com/widgetembed/?symbol=${tvSymbolParam}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=131722&studies=[]&theme=dark&style=1&timezone=Asia%2FKolkata`}
            className="w-full h-full border-none absolute inset-0"
            title={`Live TradingView Chart - ${currentSym.label}`}
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}
