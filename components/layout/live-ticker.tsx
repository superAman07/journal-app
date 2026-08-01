"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, LineChart, X } from "lucide-react";

type TickerItem = {
  symbol: string;
  price: string;
  change: number;
  isUp: boolean;
};

export function LiveTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>([
    { symbol: "NIFTY 50", price: "24,520.15", change: 0.65, isUp: true },
    { symbol: "GOLD", price: "$2,388.50", change: 0.45, isUp: true },
    { symbol: "BTC", price: "$65,420.00", change: 1.84, isUp: true },
  ]);

  const [chartSymbol, setChartSymbol] = useState<string | null>(null);

  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const [btcRes, paxgRes] = await Promise.all([
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT").then((r) => r.json()),
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT").then((r) => r.json()),
        ]);

        if (btcRes?.lastPrice && paxgRes?.lastPrice) {
          const btcPrice = parseFloat(btcRes.lastPrice).toLocaleString("en-US", { maximumFractionDigits: 2 });
          const btcChange = parseFloat(btcRes.priceChangePercent);

          const goldPrice = parseFloat(paxgRes.lastPrice).toLocaleString("en-US", { maximumFractionDigits: 2 });
          const goldChange = parseFloat(paxgRes.priceChangePercent);

          setTickers([
            { symbol: "NIFTY 50", price: "24,520.15", change: 0.65, isUp: true },
            { symbol: "GOLD", price: `$${goldPrice}`, change: goldChange, isUp: goldChange >= 0 },
            { symbol: "BTC", price: `$${btcPrice}`, change: btcChange, isUp: btcChange >= 0 },
          ]);
        }
      } catch (err) {
        // Fallback to initial prices if fetch fails
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="hidden md:flex items-center gap-2 text-[11px]">
        {/* Minimalist 3-Symbol Market Ticker */}
        {tickers.map((t) => (
          <div
            key={t.symbol}
            onClick={() => setChartSymbol(t.symbol)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-elevated border border-border-solid font-mono cursor-pointer hover:border-accent/40 hover:bg-surface transition-all select-none"
            title={`Click to open live chart for ${t.symbol}`}
          >
            <span className="text-dim font-sans font-extrabold text-[10px] tracking-wider">{t.symbol}</span>
            <span className="text-clean font-bold">{t.price}</span>
            <span className={`text-[10px] font-bold flex items-center ${t.isUp ? "text-profit" : "text-loss"}`}>
              {t.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(t.change).toFixed(2)}%
            </span>
          </div>
        ))}

        {/* Hyper-clean Free Live Chart Button */}
        <button
          onClick={() => setChartSymbol("NIFTY 50")}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-accent-muted text-accent border border-accent/30 font-bold hover:bg-accent/20 transition-all cursor-pointer"
          title="Open Free Live TradingView Chart"
        >
          <LineChart className="h-3.5 w-3.5" />
          <span>Chart</span>
        </button>
      </div>

      {/* Free Live TradingView Chart Modal — Perfectly Centered & Constrained */}
      {chartSymbol && (
        <div
          className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setChartSymbol(null)}
        >
          <div
            className="relative w-full max-w-5xl h-[82vh] bg-card border border-border-solid rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Symbol Switcher */}
            <div className="p-3 sm:p-4 bg-surface border-b border-border-solid flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 text-clean font-bold text-xs shrink-0">
                  <LineChart className="h-4 w-4 text-accent" />
                  <span>Live Chart:</span>
                </div>
                {["NIFTY 50", "GOLD", "BTC", "BANKNIFTY"].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setChartSymbol(sym)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      chartSymbol === sym
                        ? "bg-accent text-white shadow-sm"
                        : "bg-elevated text-dim hover:text-clean hover:bg-surface"
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setChartSymbol(null)}
                className="h-8 w-8 rounded-lg bg-elevated flex items-center justify-center text-soft hover:text-clean hover:bg-overlay transition-colors cursor-pointer shrink-0"
                title="Close Chart (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* TradingView Chart Container */}
            <div className="flex-1 w-full h-full bg-black relative">
              <iframe
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${
                  chartSymbol.includes("NIFTY")
                    ? "NSE:NIFTY"
                    : chartSymbol.includes("BANKNIFTY")
                    ? "NSE:BANKNIFTY"
                    : chartSymbol.includes("BTC")
                    ? "BINANCE:BTCUSDT"
                    : "TVC:GOLD"
                }&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Asia/Kolkata`}
                className="w-full h-full border-none absolute inset-0"
                title="Live TradingView Chart"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
