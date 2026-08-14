"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { LineChart, X, Search, Check } from "lucide-react";

export type MarketCategory = "All" | "Indices" | "Commodities" | "Forex" | "Crypto" | "Stocks";

export type MarketSymbol = {
  key: string;
  label: string;
  category: "Indices" | "Commodities" | "Forex" | "Crypto" | "Stocks";
  tvSymbol: string;
};

export const MARKET_SYMBOLS: MarketSymbol[] = [
  // Indices
  { key: "NIFTY", label: "NIFTY 50", category: "Indices", tvSymbol: "NSE:NIFTY" },
  { key: "BANKNIFTY", label: "BANKNIFTY", category: "Indices", tvSymbol: "NSE:BANKNIFTY" },
  { key: "FINNIFTY", label: "FINNIFTY", category: "Indices", tvSymbol: "NSE:FINNIFTY" },
  { key: "SENSEX", label: "SENSEX", category: "Indices", tvSymbol: "BSE:SENSEX" },
  { key: "SPX", label: "S&P 500", category: "Indices", tvSymbol: "FOREXCOM:SPXUSD" },
  { key: "NASDAQ", label: "NASDAQ 100", category: "Indices", tvSymbol: "FOREXCOM:NSXUSD" },

  // Commodities
  { key: "GOLD", label: "GOLD", category: "Commodities", tvSymbol: "TVC:GOLD" },
  { key: "SILVER", label: "SILVER", category: "Commodities", tvSymbol: "TVC:SILVER" },
  { key: "CRUDEOIL", label: "CRUDE OIL", category: "Commodities", tvSymbol: "TVC:USOIL" },
  { key: "NGAS", label: "NATURAL GAS", category: "Commodities", tvSymbol: "TVC:NGAS" },

  // Forex
  { key: "EURUSD", label: "EUR/USD", category: "Forex", tvSymbol: "FX:EURUSD" },
  { key: "GBPUSD", label: "GBP/USD", category: "Forex", tvSymbol: "FX:GBPUSD" },
  { key: "USDJPY", label: "USD/JPY", category: "Forex", tvSymbol: "FX:USDJPY" },
  { key: "USDINR", label: "USD/INR", category: "Forex", tvSymbol: "FX_IDC:USDINR" },

  // Crypto
  { key: "BTC", label: "BTC/USDT", category: "Crypto", tvSymbol: "BINANCE:BTCUSDT" },
  { key: "ETH", label: "ETH/USDT", category: "Crypto", tvSymbol: "BINANCE:ETHUSDT" },
  { key: "SOL", label: "SOL/USDT", category: "Crypto", tvSymbol: "BINANCE:SOLUSDT" },
  { key: "XRP", label: "XRP/USDT", category: "Crypto", tvSymbol: "BINANCE:XRPUSDT" },

  // Stocks
  { key: "RELIANCE", label: "RELIANCE", category: "Stocks", tvSymbol: "NSE:RELIANCE" },
  { key: "HDFCBANK", label: "HDFCBANK", category: "Stocks", tvSymbol: "NSE:HDFCBANK" },
  { key: "INFY", label: "INFOSYS", category: "Stocks", tvSymbol: "NSE:INFY" },
  { key: "TSLA", label: "TESLA", category: "Stocks", tvSymbol: "NASDAQ:TSLA" },
  { key: "NVDA", label: "NVIDIA", category: "Stocks", tvSymbol: "NASDAQ:NVDA" },
  { key: "AAPL", label: "APPLE", category: "Stocks", tvSymbol: "NASDAQ:AAPL" },
];

const CATEGORIES: MarketCategory[] = ["All", "Indices", "Commodities", "Forex", "Crypto", "Stocks"];

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol?: string;
}

export function ChartModal({ isOpen, onClose, initialSymbol = "NIFTY" }: ChartModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedTvSymbol, setSelectedTvSymbol] = useState("NSE:NIFTY");
  const [selectedLabel, setSelectedLabel] = useState("NIFTY 50");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<MarketCategory>("All");
  const [customInput, setCustomInput] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update selection when initialSymbol changes
  useEffect(() => {
    if (!initialSymbol) return;
    const matched = MARKET_SYMBOLS.find(
      (s) =>
        s.key.toLowerCase() === initialSymbol.toLowerCase() ||
        s.label.toLowerCase() === initialSymbol.toLowerCase() ||
        s.tvSymbol.toLowerCase() === initialSymbol.toLowerCase()
    );
    if (matched) {
      setSelectedTvSymbol(matched.tvSymbol);
      setSelectedLabel(matched.label);
    } else {
      // Fallback custom ticker
      const formatted = initialSymbol.toUpperCase().includes(":") ? initialSymbol.toUpperCase() : `NSE:${initialSymbol.toUpperCase()}`;
      setSelectedTvSymbol(formatted);
      setSelectedLabel(initialSymbol.toUpperCase());
    }
  }, [initialSymbol]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Filtered preset symbols
  const filteredSymbols = useMemo(() => {
    return MARKET_SYMBOLS.filter((s) => {
      const matchesCategory = activeCategory === "All" || s.category === activeCategory;
      const matchesQuery =
        searchQuery === "" ||
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tvSymbol.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  // Handle custom ticker submission
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    let symbolToUse = customInput.trim().toUpperCase();
    // Check if matching preset exists
    const preset = MARKET_SYMBOLS.find(
      (s) =>
        s.label.toUpperCase() === symbolToUse ||
        s.key.toUpperCase() === symbolToUse ||
        s.tvSymbol.toUpperCase() === symbolToUse
    );

    if (preset) {
      setSelectedTvSymbol(preset.tvSymbol);
      setSelectedLabel(preset.label);
    } else {
      // Automatic prefix smart matching
      if (!symbolToUse.includes(":")) {
        if (["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "GBPJPY"].includes(symbolToUse)) {
          symbolToUse = `FX:${symbolToUse}`;
        } else if (["BTCUSDT", "ETHUSDT", "SOLUSDT", "DOGEUSDT"].includes(symbolToUse)) {
          symbolToUse = `BINANCE:${symbolToUse}`;
        } else if (["GOLD", "SILVER", "USOIL", "NGAS"].includes(symbolToUse)) {
          symbolToUse = `TVC:${symbolToUse}`;
        } else {
          symbolToUse = `NSE:${symbolToUse}`;
        }
      }
      setSelectedTvSymbol(symbolToUse);
      setSelectedLabel(customInput.trim().toUpperCase());
    }

    setCustomInput("");
  };

  const selectSymbol = (sym: MarketSymbol) => {
    setSelectedTvSymbol(sym.tvSymbol);
    setSelectedLabel(sym.label);
  };

  if (!isOpen || !mounted) return null;

  const tvSymbolParam = encodeURIComponent(selectedTvSymbol);

  const modalContent = (
    <div
      className="fixed inset-0 z-9999 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl h-[92vh] sm:h-[88vh] bg-card border border-border-solid rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Controls & Header */}
        <div className="p-3 sm:p-4 bg-surface border-b border-border-solid flex flex-col gap-3 shrink-0">
          {/* Top Bar: Title, Search & Close */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                <LineChart className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-clean tracking-tight">{selectedLabel}</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-elevated border border-border-solid text-dim">
                    {selectedTvSymbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Custom Search Input */}
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5 flex-1 max-w-md min-w-50">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 text-dim absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search segment (e.g. Silver, EURUSD, Reliance) or ticker..."
                  value={searchQuery || customInput}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCustomInput(e.target.value);
                  }}
                  className="w-full bg-elevated border border-border-solid/60 rounded-xl pl-8 pr-8 py-1.5 text-xs text-clean placeholder:text-dim outline-none focus:border-accent transition-colors"
                />
                {(searchQuery || customInput) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCustomInput("");
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim hover:text-clean text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
              {customInput && (
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent-hover transition-colors cursor-pointer shrink-0"
                >
                  Load
                </button>
              )}
            </form>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-xl bg-elevated flex items-center justify-center text-soft hover:text-clean hover:bg-overlay transition-colors cursor-pointer shrink-0"
              title="Close Chart (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Category Filter Pills & Market Chips */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-border-solid/40 pt-2.5">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                    activeCategory === cat
                      ? "bg-accent/20 text-accent border border-accent/40"
                      : "text-dim hover:text-clean hover:bg-elevated"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Matching Segment Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {filteredSymbols.length > 0 ? (
                filteredSymbols.map((sym) => {
                  const isSelected = selectedTvSymbol === sym.tvSymbol;
                  return (
                    <button
                      key={sym.key}
                      onClick={() => selectSymbol(sym)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                        isSelected
                          ? "bg-accent text-white shadow-sm"
                          : "bg-elevated text-dim hover:text-clean hover:bg-surface border border-border-solid/40"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <span>{sym.label}</span>
                    </button>
                  );
                })
              ) : (
                <span className="text-[11px] text-dim italic py-0.5">Press Enter or click "Load" to open custom ticker "{customInput}"</span>
              )}
            </div>
          </div>
        </div>

        {/* TradingView Live Chart Embed */}
        <div className="flex-1 w-full h-full bg-[#131722] relative overflow-hidden">
          <iframe
            key={selectedTvSymbol}
            src={`https://s.tradingview.com/widgetembed/?symbol=${tvSymbolParam}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=131722&studies=[]&theme=dark&style=1&timezone=Asia%2FKolkata`}
            className="w-full h-full border-none absolute inset-0"
            title={`Live TradingView Chart - ${selectedLabel}`}
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
