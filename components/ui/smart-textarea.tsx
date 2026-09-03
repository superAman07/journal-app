"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ListOrdered, List, FileText, Check, RotateCcw } from "lucide-react";

interface SmartTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  className?: string;
  label?: string;
}

const TRADING_TERMS: Record<string, string> = {
  sl: "SL",
  tp: "TP",
  rr: "R:R",
  pnl: "P&L",
  vwap: "VWAP",
  ema: "EMA",
  sma: "SMA",
  rsi: "RSI",
  fomo: "FOMO",
  ce: "CE",
  pe: "PE",
  atm: "ATM",
  otm: "OTM",
  itm: "ITM",
  oi: "OI",
  ltp: "LTP",
  ath: "ATH",
  atl: "ATL",
  nifty: "Nifty",
  banknifty: "BankNifty",
  finifty: "FinNifty",
  midcpnifty: "MidcapNifty",
  sensex: "Sensex",
  crude: "Crude",
  gold: "Gold",
  silver: "Silver",
  btc: "BTC",
  eth: "ETH",
  usdt: "USDT",
};

export function SmartTextarea({
  value,
  onChange,
  placeholder = "Write your reflections, execution notes, or psychology...",
  minRows = 3,
  className = "",
  label,
}: SmartTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const [formattedNotice, setFormattedNotice] = useState(false);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.max(el.scrollHeight, minRows * 24);
    el.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleAutoFormat = () => {
    if (!value.trim()) return;

    let text = value;

    Object.entries(TRADING_TERMS).forEach(([term, replacement]) => {
      const regex = new RegExp(`\\b${term}\\b`, "gi");
      text = text.replace(regex, replacement);
    });

    text = text
      .replace(/[ \t]+/g, " ") 
      .replace(/ ,/g, ",")
      .replace(/ \./g, ".")
      .replace(/ ;/g, ";")
      .replace(/ :/g, ":")
      .replace(/,([^\s0-9])/g, ", $1"); 

    const rawLines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    let items: string[] = [];
    if (rawLines.length === 1 && rawLines[0].length > 60) {
      items = rawLines[0]
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      items = rawLines;
    }

    const cleanedItems = items.map((line) => {
      let clean = line.replace(/^(\d+[\.\)]|\-|\*|•)\s*/, "").trim();
      if (clean.length > 0) {
        clean = clean.charAt(0).toUpperCase() + clean.slice(1);
        if (!/[.?!:;]$/.test(clean)) {
          clean += ".";
        }
      }
      return clean;
    });

    const formatted = cleanedItems
      .map((item, idx) => `${idx + 1}. ${item}`)
      .join("\n");

    onChange(formatted);
    setFormattedNotice(true);
    setTimeout(() => setFormattedNotice(false), 2000);
  };

  const handleBulletList = () => {
    if (!value.trim()) {
      onChange("• Entry Trigger:\n• In-Trade Emotions:\n• Exit Execution:\n• Key Lesson:");
      return;
    }
    const lines = value
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `• ${l.replace(/^(\d+[\.\)]|\-|\*|•)\s*/, "")}`);
    onChange(lines.join("\n"));
  };

  const handleNumberedList = () => {
    if (!value.trim()) {
      onChange("1. Setup Criteria:\n2. Stop Loss & Target:\n3. Emotional State:\n4. Review:");
      return;
    }
    const lines = value
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l, idx) => `${idx + 1}. ${l.replace(/^(\d+[\.\)]|\-|\*|•)\s*/, "")}`);
    onChange(lines.join("\n"));
  };

  const handleInsertTemplate = () => {
    const template =
      "1. Setup & Trigger: \n2. Risk & Position Size: \n3. Trade Management (In-Trade): \n4. Exit & Rule Adherence: \n5. Key Psychology / Lesson: ";
    if (!value.trim()) {
      onChange(template);
    } else {
      onChange(`${value.trim()}\n\n${template}`);
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between gap-2 px-1">
        {label ? (
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {label}
          </span>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={handleAutoFormat}
            disabled={!value.trim()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-accent to-ai text-white hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Auto-format text: numbers, clean spacing, capitalize SL/TP/VWAP/EMA"
          >
            {formattedNotice ? (
              <>
                <Check className="h-3 w-3" /> Formatted!
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" /> Auto-Format
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNumberedList}
            className="h-6 w-6 rounded-md bg-surface border border-border-solid hover:bg-elevated flex items-center justify-center text-dim hover:text-clean text-[10px] font-mono transition-colors cursor-pointer"
            title="Convert to 1. 2. 3. numbered list"
          >
            <ListOrdered className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={handleBulletList}
            className="h-6 w-6 rounded-md bg-surface border border-border-solid hover:bg-elevated flex items-center justify-center text-dim hover:text-clean text-[10px] transition-colors cursor-pointer"
            title="Convert to bullet points"
          >
            <List className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={handleInsertTemplate}
            className="h-6 px-2 rounded-md bg-surface border border-border-solid hover:bg-elevated flex items-center gap-1 text-dim hover:text-clean text-[10px] font-semibold transition-colors cursor-pointer"
            title="Insert Trade Reflection Template"
          >
            <FileText className="h-3 w-3 text-accent" />
            <span className="hidden sm:inline">Template</span>
          </button>

          {value.trim() && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="h-6 w-6 rounded-md bg-surface hover:bg-loss/15 hover:text-loss flex items-center justify-center text-dim transition-colors cursor-pointer"
              title="Clear text"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div className="relative rounded-xl border border-border-solid bg-surface/70 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all overflow-hidden shadow-inner">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            adjustHeight();
          }}
          placeholder={placeholder}
          rows={minRows}
          className={`w-full p-3 bg-transparent text-xs sm:text-sm text-clean placeholder:text-dim/60 focus:outline-none resize-none leading-relaxed transition-height duration-100 ${className}`}
        />

        {value.length > 0 && (
          <div className="flex items-center justify-end px-2.5 py-1 text-[9px] font-mono text-dim/60 bg-surface/40 border-t border-border-solid/40 select-none">
            {value.length} characters · {value.split(/\s+/).filter(Boolean).length} words
          </div>
        )}
      </div>
    </div>
  );
}
