"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, LineChart, X, ChevronDown } from "lucide-react";

type TickerItem = {
  symbol: string;
  label: string;
  price: string;
  change: number;
  isUp: boolean;
  tvSymbol: string;
};

const DEFAULT_TICKERS: TickerItem[] = [
  { symbol: "NIFTY", label: "NIFTY 50", price: "24,520", change: 0.65, isUp: true, tvSymbol: "NSE:NIFTY" },
  { symbol: "GOLD", label: "Gold", price: "$2,388", change: 0.45, isUp: true, tvSymbol: "TVC:GOLD" },
  { symbol: "BTC", label: "Bitcoin", price: "$65,420", change: 1.84, isUp: true, tvSymbol: "BINANCE:BTCUSDT" },
];

const CHART_SYMBOLS = [
  { key: "NIFTY", label: "NIFTY 50", tvSymbol: "NSE:NIFTY" },
  { key: "BANKNIFTY", label: "BANKNIFTY", tvSymbol: "NSE:BANKNIFTY" },
  { key: "GOLD", label: "GOLD", tvSymbol: "TVC:GOLD" },
  { key: "BTC", label: "BTC", tvSymbol: "BINANCE:BTCUSDT" },
];

export function LiveTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>(DEFAULT_TICKERS);
  const [chartOpen, setChartOpen] = useState(false);
  const [activeChart, setActiveChart] = useState("NIFTY");

  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const [btcRes, paxgRes] = await Promise.all([
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT").then((r) => r.json()),
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT").then((r) => r.json()),
        ]);

        if (btcRes?.lastPrice && paxgRes?.lastPrice) {
          const btcPrice = parseFloat(btcRes.lastPrice);
          const btcChange = parseFloat(btcRes.priceChangePercent);
          const goldPrice = parseFloat(paxgRes.lastPrice);
          const goldChange = parseFloat(paxgRes.priceChangePercent);

          setTickers([
            { symbol: "NIFTY", label: "NIFTY 50", price: "24,520", change: 0.65, isUp: true, tvSymbol: "NSE:NIFTY" },
            { symbol: "GOLD", label: "Gold", price: `$${goldPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, change: goldChange, isUp: goldChange >= 0, tvSymbol: "TVC:GOLD" },
            { symbol: "BTC", label: "Bitcoin", price: `$${btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, change: btcChange, isUp: btcChange >= 0, tvSymbol: "BINANCE:BTCUSDT" },
          ]);
        }
      } catch {
        // Keep defaults
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 15000);
    return () => clearInterval(interval);
  }, []);

  const openChart = useCallback((symbolKey: string) => {
    setActiveChart(symbolKey);
    setChartOpen(true);
  }, []);

  useEffect(() => {
    if (!chartOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setChartOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [chartOpen]);

  const activeTvSymbol = CHART_SYMBOLS.find((s) => s.key === activeChart)?.tvSymbol || "NSE:NIFTY";

  return (
    <>
      {/* ═══ Desktop Ticker — Inline in Header ═══ */}
      <div className="hidden md:flex items-center gap-1.5 text-[11px]">
        {tickers.map((t) => (
          <button
            key={t.symbol}
            onClick={() => openChart(t.symbol)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-elevated/60 border border-border-solid/50 font-mono cursor-pointer hover:border-accent/30 hover:bg-elevated transition-all select-none"
          >
            <span className="text-dim font-sans font-bold text-[10px] tracking-wide">{t.symbol}</span>
            <span className="text-clean font-bold">{t.price}</span>
            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${t.isUp ? "text-profit" : "text-loss"}`}>
              {t.isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {Math.abs(t.change).toFixed(1)}%
            </span>
          </button>
        ))}

        <button
          onClick={() => openChart("NIFTY")}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20 font-bold hover:bg-accent/20 transition-all cursor-pointer text-[11px]"
        >
          <LineChart className="h-3 w-3" />
          Chart
        </button>
      </div>

      {/* ═══ Mobile Ticker — Compact Scrollable Strip Below Brand ═══ */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px] -ml-1">
        {tickers.map((t) => (
          <button
            key={t.symbol}
            onClick={() => openChart(t.symbol)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-elevated/50 border border-border-solid/40 font-mono cursor-pointer shrink-0 select-none active:scale-95 transition-transform"
          >
            <span className="text-dim font-sans font-bold text-[9px]">{t.symbol}</span>
            <span className="text-clean font-bold text-[10px]">{t.price}</span>
            <span className={`font-bold flex items-center ${t.isUp ? "text-profit" : "text-loss"}`}>
              {t.isUp ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
            </span>
          </button>
        ))}

        <button
          onClick={() => openChart("NIFTY")}
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20 font-bold cursor-pointer shrink-0 text-[10px] active:scale-95 transition-transform"
        >
          <LineChart className="h-2.5 w-2.5" />
          <span>Chart</span>
        </button>
      </div>

      {/* ═══ TradingView Live Chart Modal ═══ */}
      {chartOpen && (
        <div
          className="fixed inset-0 z-200 bg-black/90 backdrop-blur-lg flex items-center justify-center animate-in fade-in duration-150"
          onClick={() => setChartOpen(false)}
        >
          <div
            className="absolute inset-2 sm:inset-4 md:inset-6 lg:inset-10 xl:inset-16 bg-card border border-border-solid rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chart Modal Header */}
            <div className="px-3 sm:px-4 py-2.5 bg-surface border-b border-border-solid flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <LineChart className="h-4 w-4 text-accent shrink-0" />
                {CHART_SYMBOLS.map((sym) => (
                  <button
                    key={sym.key}
                    onClick={() => setActiveChart(sym.key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                      activeChart === sym.key
                        ? "bg-accent text-white shadow-sm"
                        : "bg-elevated text-dim hover:text-clean hover:bg-surface"
                    }`}
                  >
                    {sym.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setChartOpen(false)}
                className="h-7 w-7 rounded-md bg-elevated flex items-center justify-center text-soft hover:text-clean hover:bg-overlay transition-colors cursor-pointer shrink-0 ml-2"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Chart iframe — fills remaining space absolutely */}
            <div className="flex-1 relative bg-[#131722]">
              <iframe
                key={activeChart}
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${activeTvSymbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Asia/Kolkata`}
                className="absolute inset-0 w-full h-full border-none"
                title="Live TradingView Chart"
                allow="fullscreen"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
