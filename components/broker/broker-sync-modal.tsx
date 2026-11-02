"use client";

import { useState, useEffect, useRef } from "react";
import {
  Zap,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { SyncedTradePreview } from "@/lib/services/angel-one-service";
import { importBrokerTrades } from "@/lib/actions/broker-trade-actions";
import Link from "next/link";

interface BrokerSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export function BrokerSyncModal({ isOpen, onClose, onImportComplete }: BrokerSyncModalProps) {
  const [activeTab, setActiveTab] = useState<"angel" | "dhan" | "csv" | "zerodha">("angel");

  // Angel One form state
  const [angelClientCode, setAngelClientCode] = useState("");
  const [angelPassword, setAngelPassword] = useState("");
  const [angelApiKey, setAngelApiKey] = useState("");
  const [angelTotpSecret, setAngelTotpSecret] = useState("");
  const [rememberAngel, setRememberAngel] = useState(true);

  // Dhan form state
  const [dhanClientId, setDhanClientId] = useState("");
  const [dhanAccessToken, setDhanAccessToken] = useState("");
  const [rememberDhan, setRememberDhan] = useState(true);

  // CSV drag & drop state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvFileName, setCsvFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync & Preview State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewTrades, setPreviewTrades] = useState<SyncedTradePreview[]>([]);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Load saved credentials from localStorage on mount
  useEffect(() => {
    try {
      const savedAngel = localStorage.getItem("trading_os_angel_creds");
      if (savedAngel) {
        const parsed = JSON.parse(savedAngel);
        setAngelClientCode(parsed.clientCode || "");
        setAngelPassword(parsed.password || "");
        setAngelApiKey(parsed.apiKey || "");
        setAngelTotpSecret(parsed.totpSecret || "");
      }

      const savedDhan = localStorage.getItem("trading_os_dhan_creds");
      if (savedDhan) {
        const parsed = JSON.parse(savedDhan);
        setDhanClientId(parsed.clientId || "");
        setDhanAccessToken(parsed.accessToken || "");
      }
    } catch (e) {
      console.error("Error reading saved broker credentials:", e);
    }
  }, []);

  if (!isOpen) return null;

  // Handle Fetching Angel One Trades
  const handleSyncAngelOne = async () => {
    if (!angelClientCode || !angelPassword || !angelApiKey || !angelTotpSecret) {
      setErrorMessage("Please fill all 4 Angel One SmartAPI fields.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setPreviewTrades([]);

    try {
      if (rememberAngel) {
        localStorage.setItem(
          "trading_os_angel_creds",
          JSON.stringify({
            clientCode: angelClientCode,
            password: angelPassword,
            apiKey: angelApiKey,
            totpSecret: angelTotpSecret,
          })
        );
      }

      const res = await fetch("/api/broker/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broker: "ANGEL_ONE",
          credentials: {
            clientCode: angelClientCode,
            password: angelPassword,
            apiKey: angelApiKey,
            totpSecret: angelTotpSecret,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch trades from Angel One.");
      }

      if (data.trades.length === 0) {
        setErrorMessage("No completed buy/sell trades found in Angel One for today.");
      } else {
        setPreviewTrades(data.trades);
      }
    } catch (err: any) {
      console.error("Angel One Sync Error:", err);
      setErrorMessage(err.message || "Failed to connect to Angel One.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Fetching Dhan Trades
  const handleSyncDhan = async () => {
    if (!dhanClientId || !dhanAccessToken) {
      setErrorMessage("Please provide Dhan Client ID and Access Token.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setPreviewTrades([]);

    try {
      if (rememberDhan) {
        localStorage.setItem(
          "trading_os_dhan_creds",
          JSON.stringify({
            clientId: dhanClientId,
            accessToken: dhanAccessToken,
          })
        );
      }

      const res = await fetch("/api/broker/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broker: "DHAN",
          credentials: {
            clientId: dhanClientId,
            accessToken: dhanAccessToken,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch trades from Dhan.");
      }

      if (data.trades.length === 0) {
        setErrorMessage("No completed buy/sell trades found in Dhan for today.");
      } else {
        setPreviewTrades(data.trades);
      }
    } catch (err: any) {
      console.error("Dhan Sync Error:", err);
      setErrorMessage(err.message || "Failed to connect to Dhan.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Uploading & Parsing CSV Tradebook
  const handleParseCsv = async (file: File) => {
    setIsLoading(true);
    setErrorMessage("");
    setPreviewTrades([]);
    setCsvFileName(file.name);

    try {
      const text = await file.text();
      const res = await fetch("/api/broker/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broker: "CSV",
          csvContent: text,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse tradebook CSV.");
      }

      if (data.trades.length === 0) {
        setErrorMessage("No matching completed trades found in this CSV file.");
      } else {
        setPreviewTrades(data.trades);
      }
    } catch (err: any) {
      console.error("CSV Parse Error:", err);
      setErrorMessage(err.message || "Failed to parse tradebook file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelectTrade = (id: string) => {
    setPreviewTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  // Import Selected Trades into PostgreSQL Journal
  const handleCommitImport = async () => {
    const selected = previewTrades.filter((t) => t.selected !== false);
    if (selected.length === 0) {
      setErrorMessage("Please select at least 1 trade to import.");
      return;
    }

    setIsImporting(true);
    try {
      const res = await importBrokerTrades(selected);
      if (res.success) {
        setImportStatus(res.message || "Successfully imported trades!");
        if (onImportComplete) onImportComplete();
      } else {
        setErrorMessage(res.error || "Failed to import trades.");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Error importing trades.");
    } finally {
      setIsImporting(false);
    }
  };

  const totalPnl = previewTrades
    .filter((t) => t.selected !== false)
    .reduce((sum, t) => sum + (t.pnl || 0), 0);

  const selectedCount = previewTrades.filter((t) => t.selected !== false).length;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="card w-full max-w-2xl rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-card">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/40 flex items-center justify-between shrink-0 bg-surface/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-clean flex items-center gap-2">
                1-Click Broker Sync
                <span className="badge badge-accent text-[10px] font-mono">PRO</span>
              </h3>
              <p className="text-[11px] text-muted">
                Auto-fetch executed trades from your broker terminal directly into your journal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-surface hover:bg-elevated text-muted hover:text-clean flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Broker Tabs */}
        {previewTrades.length === 0 && !importStatus && (
          <div className="p-3 border-b border-border/30 bg-surface/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                setActiveTab("angel");
                setErrorMessage("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "angel"
                  ? "bg-accent text-white shadow-xs"
                  : "bg-surface text-soft hover:text-clean border border-border-solid"
              }`}
            >
              <span>⚡ Angel One (SmartAPI)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("dhan");
                setErrorMessage("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "dhan"
                  ? "bg-ai text-white shadow-xs"
                  : "bg-surface text-soft hover:text-clean border border-border-solid"
              }`}
            >
              <span>⚡ Dhan (DhanHQ)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("csv");
                setErrorMessage("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "csv"
                  ? "bg-profit text-white shadow-xs"
                  : "bg-surface text-soft hover:text-clean border border-border-solid"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Universal CSV / Excel</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("zerodha");
                setErrorMessage("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "zerodha"
                  ? "bg-card-accent text-clean border border-border"
                  : "bg-surface text-dim hover:text-soft border border-border-solid"
              }`}
            >
              <span>⏳ Zerodha Kite</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-loss/15 border border-loss/30 text-loss text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Import Success State */}
          {importStatus ? (
            <div className="text-center py-10 space-y-4 animate-in fade-in">
              <div className="h-14 w-14 rounded-2xl bg-profit/15 text-profit mx-auto flex items-center justify-center border border-profit/30 shadow-lg">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-clean">Trades Successfully Journaled!</h4>
                <p className="text-xs text-muted max-w-sm mx-auto">{importStatus}</p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Link
                  href="/trades"
                  onClick={onClose}
                  className="btn-primary px-4 py-2 text-xs rounded-xl cursor-pointer"
                >
                  View in Trade Journal
                </Link>
                <Link
                  href="/ai-coach"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-ai/15 hover:bg-ai/25 text-ai border border-ai/30 transition-all cursor-pointer"
                >
                  Audit with AI Coach →
                </Link>
              </div>
            </div>
          ) : previewTrades.length > 0 ? (
            /* Trades Preview List */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <div>
                  <h4 className="text-xs font-bold text-clean flex items-center gap-2">
                    Review Executed Trades ({selectedCount}/{previewTrades.length} selected)
                  </h4>
                  <p className="text-[10px] text-muted">
                    Uncheck any trades you don&apos;t want to record in your journal
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted font-mono block">Estimated Net P&L</span>
                  <span
                    className={`font-mono font-bold text-xs sm:text-sm ${
                      totalPnl >= 0 ? "text-profit" : "text-loss"
                    }`}
                  >
                    {totalPnl >= 0 ? `+₹${totalPnl.toFixed(2)}` : `-₹${Math.abs(totalPnl).toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {previewTrades.map((trade) => (
                  <div
                    key={trade.id}
                    onClick={() => handleToggleSelectTrade(trade.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      trade.selected !== false
                        ? "bg-surface/80 border-accent/40 shadow-xs"
                        : "bg-surface/30 border-border/40 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={trade.selected !== false}
                        onChange={() => handleToggleSelectTrade(trade.id)}
                        className="rounded border-border text-accent focus:ring-0 cursor-pointer h-4 w-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="truncate">
                        <div className="font-bold text-xs text-clean flex items-center gap-2 truncate">
                          <span className="truncate">{trade.instrument}</span>
                          <span
                            className={`badge text-[9px] font-bold ${
                              trade.outcome === "WIN"
                                ? "badge-profit"
                                : trade.outcome === "LOSS"
                                ? "badge-loss"
                                : "badge-neutral"
                            }`}
                          >
                            {trade.outcome}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted font-mono flex items-center gap-2 pt-0.5">
                          <span>Qty: {trade.positionSize}</span>
                          <span>•</span>
                          <span>Entry: ₹{trade.actualEntry}</span>
                          <span>•</span>
                          <span>Exit: ₹{trade.actualExit}</span>
                          <span>•</span>
                          <span className="text-dim">{trade.entryTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono font-bold text-xs block ${
                          trade.pnl >= 0 ? "text-profit" : "text-loss"
                        }`}
                      >
                        {trade.pnl >= 0 ? `+₹${trade.pnl}` : `-₹${Math.abs(trade.pnl)}`}
                      </span>
                      <span className="text-[10px] text-muted font-mono">
                        {trade.optionPoints >= 0 ? `+${trade.optionPoints} pts` : `${trade.optionPoints} pts`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Forms for Each Tab */
            <>
              {activeTab === "angel" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-xs text-soft space-y-1">
                    <div className="font-bold text-clean flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-accent" />
                      <span>Angel One SmartAPI Auto-Login (Free & Official)</span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Our system uses native RFC 6238 TOTP to generate your 2FA authentication dynamically. Your password and TOTP secret are processed securely and never shared.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-soft mb-1">
                        Client Code (User ID)
                      </label>
                      <input
                        value={angelClientCode}
                        onChange={(e) => setAngelClientCode(e.target.value.toUpperCase())}
                        placeholder="e.g. A123456"
                        className="input-field text-xs py-2 w-full font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-soft mb-1">
                        Password or 4-Digit PIN
                      </label>
                      <input
                        type="password"
                        value={angelPassword}
                        onChange={(e) => setAngelPassword(e.target.value)}
                        placeholder="••••"
                        className="input-field text-xs py-2 w-full font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-soft mb-1">
                        SmartAPI Key
                      </label>
                      <input
                        value={angelApiKey}
                        onChange={(e) => setAngelApiKey(e.target.value)}
                        placeholder="e.g. your_smartapi_key"
                        className="input-field text-xs py-2 w-full font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-soft mb-1 flex items-center justify-between">
                        <span>TOTP Secret Key</span>
                        <a
                          href="https://smartapi.angelbroking.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-accent hover:underline flex items-center gap-0.5"
                        >
                          SmartAPI Portal <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </label>
                      <input
                        type="password"
                        value={angelTotpSecret}
                        onChange={(e) => setAngelTotpSecret(e.target.value)}
                        placeholder="Base32 key from Authenticator"
                        className="input-field text-xs py-2 w-full font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <input
                      type="checkbox"
                      id="rememberAngel"
                      checked={rememberAngel}
                      onChange={(e) => setRememberAngel(e.target.checked)}
                      className="rounded border-border text-accent focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="rememberAngel" className="text-muted text-[11px] cursor-pointer">
                      Remember credentials on this browser (saved locally)
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "dhan" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-ai/10 border border-ai/20 text-xs text-soft space-y-1">
                    <div className="font-bold text-clean flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-ai" />
                      <span>DhanHQ API (Permanent Access Token)</span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Dhan provides permanent API access tokens with no daily OTP renewal needed. Generate your token in your Dhan web profile under Access Token.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-soft mb-1">
                        Dhan Client ID
                      </label>
                      <input
                        value={dhanClientId}
                        onChange={(e) => setDhanClientId(e.target.value)}
                        placeholder="e.g. 1100123456"
                        className="input-field text-xs py-2 w-full font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-soft mb-1 flex items-center justify-between">
                        <span>Access Token</span>
                        <a
                          href="https://dhan.co"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-ai hover:underline flex items-center gap-0.5"
                        >
                          Dhan Portal <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </label>
                      <textarea
                        value={dhanAccessToken}
                        onChange={(e) => setDhanAccessToken(e.target.value)}
                        placeholder="Paste your Dhan permanent access token here..."
                        rows={2}
                        className="input-field text-xs py-2 w-full font-mono resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <input
                      type="checkbox"
                      id="rememberDhan"
                      checked={rememberDhan}
                      onChange={(e) => setRememberDhan(e.target.checked)}
                      className="rounded border-border text-ai focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="rememberDhan" className="text-muted text-[11px] cursor-pointer">
                      Remember credentials on this browser
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "csv" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-profit/10 border border-profit/20 text-xs text-soft space-y-1">
                    <div className="font-bold text-clean flex items-center gap-1.5">
                      <FileSpreadsheet className="h-4 w-4 text-profit" />
                      <span>Universal 1-Click CSV/Excel Tradebook</span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Works for Angel One, Zerodha Console, Dhan, Groww, and Upstox tradebook exports. Zero API setup required!
                    </p>
                  </div>

                  {/* Drag & Drop Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 sm:p-8 rounded-2xl border-2 border-dashed border-border/60 hover:border-profit/60 bg-surface/40 hover:bg-surface/80 transition-all cursor-pointer text-center space-y-2 group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-surface mx-auto flex items-center justify-center text-muted group-hover:text-profit border border-border/40 transition-colors">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-clean">
                        {csvFileName ? `Selected: ${csvFileName}` : "Drop your Tradebook CSV here, or click to browse"}
                      </p>
                      <p className="text-[10px] text-muted">Supports .csv exports from any broker</p>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleParseCsv(file);
                    }}
                  />
                </div>
              )}

              {activeTab === "zerodha" && (
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-xl bg-card-accent border border-border/60 space-y-2 text-center">
                    <div className="h-10 w-10 rounded-xl bg-surface mx-auto flex items-center justify-center text-muted border border-border/40">
                      <Lock className="h-5 w-5 text-dim" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-clean">Zerodha Kite Direct API — Coming Soon</h4>
                    <p className="text-[11px] text-muted max-w-md mx-auto leading-relaxed">
                      Zerodha requires a ₹2,000/month retail Kite API developer fee and manual daily token approvals. Direct sync is coming in the next release.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab("csv")}
                        className="btn-primary px-4 py-2 text-xs rounded-xl cursor-pointer"
                      >
                        Use Free Zerodha CSV Importer Instead →
                      </button>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface/50 border border-border/30 text-[11px] text-muted space-y-1">
                    <p className="font-semibold text-clean">How to download from Zerodha (30 seconds):</p>
                    <p>1. Open Zerodha Console → Reports → Tradebook.</p>
                    <p>2. Select Today&apos;s date (or any date range) → Click Download CSV.</p>
                    <p>3. Drop the file in our Universal CSV tab to import all trades instantly!</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-surface/40 border-t border-border/30 flex items-center justify-between shrink-0">
          {previewTrades.length > 0 && !importStatus ? (
            <>
              <button
                onClick={() => setPreviewTrades([])}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-clean cursor-pointer transition-all"
              >
                ← Back to Credentials
              </button>
              <button
                onClick={handleCommitImport}
                disabled={isImporting || selectedCount === 0}
                className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Import {selectedCount} Trades into Journal</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-clean cursor-pointer transition-all"
              >
                Cancel
              </button>
              {activeTab === "angel" && !importStatus && (
                <button
                  onClick={handleSyncAngelOne}
                  disabled={isLoading}
                  className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Connecting SmartAPI...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>Sync Angel One Today</span>
                    </>
                  )}
                </button>
              )}
              {activeTab === "dhan" && !importStatus && (
                <button
                  onClick={handleSyncDhan}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-ai text-white hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Connecting Dhan...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>Sync Dhan Today</span>
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
