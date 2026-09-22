"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Brain,
  Bot,
  X,
} from "lucide-react";
import { FormattedMessage } from "./formatted-message";

interface TradeOption {
  id: string;
  instrument: string;
  date: string;
  outcome: string;
  pnl: number;
  setup: string;
  actualRR: number;
  screenshots?: { url: string }[];
}

interface AIChatInterfaceProps {
  initialTrades?: TradeOption[];
  rulesCount?: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  modelUsed?: string;
  timestamp: string;
}

export function AIChatInterface({ initialTrades = [], rulesCount = 0 }: AIChatInterfaceProps) {
  const searchParams = useSearchParams();
  const preSelectedTradeId = searchParams.get("tradeId");

  const [selectedTradeId, setSelectedTradeId] = useState<string>(preSelectedTradeId || (initialTrades[0]?.id ?? ""));
  const [provider, setProvider] = useState<"Auto" | "NVIDIA NIM" | "Google Gemini">("Auto");
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<{ [key: number]: boolean }>({});
  const [chartUrl, setChartUrl] = useState<string>("");

  const selectedTrade = initialTrades.find((t) => t.id === selectedTradeId);

  useEffect(() => {
    if (selectedTrade?.screenshots && selectedTrade.screenshots.length > 0) {
      setChartUrl(selectedTrade.screenshots[0].url);
    } else {
      setChartUrl("");
    }
  }, [selectedTrade]);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Welcome to your Trading Psychology & Performance Desk. I am your AI Performance Coach — connected directly to your trading database.\n\nI automatically pick the best available AI model for you. No manual setup needed.\n\nI can see your recent trades, setups, stop-losses, and rules. When you take a loss or get stopped out by a wick, you are not alone.\n\nHow are you feeling right now? Use the quick buttons above, or just type.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput("");
    setIsLoading(true);

    try {
      const filteredHistory = messages
        .filter((m) => !m.content.startsWith("💡"))
        .slice(-6);

      const apiMessages = [...filteredHistory, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          tradeId: selectedTradeId || undefined,
          imageUrl: chartUrl || undefined,
          provider,
          model: model || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reach AI mentor");
      }

      const aiMsg: Message = {
        role: "assistant",
        content: data.message,
        reasoning: data.reasoning || undefined,
        modelUsed: data.modelUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("AI Coach Error:", err);
      const rawMsg = err.message || "Connection issue";
      let friendlyMsg = "The AI is temporarily unavailable. Try switching providers using the toggle above, or retry in a moment.";

      if (rawMsg.includes("429") || rawMsg.includes("rate limit") || rawMsg.includes("quota")) {
        friendlyMsg = "The AI quota reached a temporary cooldown. Swapping to backup model...";
      } else if (rawMsg.includes("401") || rawMsg.includes("Unauthorized")) {
        friendlyMsg = "Session expired. Please refresh the page and sign in again.";
      } else if (rawMsg.includes("API key") || rawMsg.includes("not configured")) {
        friendlyMsg = "API key is not configured yet. Check your .env file.";
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `💡 **Quick Note:** ${friendlyMsg}\n\n*Remember: Capital preservation is rule #1. No revenge trade. Tomorrow is a fresh market.*`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReasoning = (idx: number) => {
    setExpandedReasoning((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const quickPrompts = [
    {
      label: "🛑 Stopped out by a wick",
      prompt: selectedTrade
        ? `I just got wicked out on ${selectedTrade.instrument} with a ${selectedTrade.outcome} (${selectedTrade.pnl}). It reversed right after hitting my SL. Talk me down before I revenge trade.`
        : "I just got stopped out by a single tick wick at the bottom and the market exploded in my direction. I feel sick and want to enter again. Talk me down.",
    },
    {
      label: "📉 Losing streak review",
      prompt: "I am currently in a losing streak. Examine my recent trade history from the DB and give me an honest, objective diagnosis: Is my setup failing, or is this standard market friction?",
    },
    {
      label: "⚔️ Daily discipline challenge",
      prompt: "Give me a tough discipline challenge for today to make sure I don't touch the broker terminal and preserve my mental capital for tomorrow.",
    },
    {
      label: "🎯 Risk:Reward critique",
      prompt: selectedTrade
        ? `Critique my execution on trade ${selectedTrade.instrument} (${selectedTrade.setup}). Planned vs actual RR. Where can I improve?`
        : "Analyze my recent risk-to-reward ratios and tell me if I'm letting winners run or cutting them too early.",
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] sm:h-[calc(100vh-8.5rem)] space-y-2 sm:space-y-3">
      <div className="card p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 sm:h-9 w-7 sm:w-9 rounded-lg sm:rounded-xl bg-ai-muted text-ai flex items-center justify-center font-bold shrink-0">
            <Brain className="h-4 sm:h-5 w-4 sm:w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-xs sm:text-sm font-bold text-clean truncate">AI Trading Coach</h1>
              <span className="badge badge-ai text-[9px] sm:text-[10px] hidden xs:inline-flex">DB Connected</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted truncate">
              Live Database · Prop Desk Methodology
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {initialTrades.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-dim text-[10px] sm:text-[11px] hidden sm:inline">Focus:</span>
              <select
                value={selectedTradeId}
                onChange={(e) => setSelectedTradeId(e.target.value)}
                className="input-field py-1 text-[10px] sm:text-xs max-w-32 sm:max-w-45 truncate font-mono"
              >
                <option value="">All Trades</option>
                {initialTrades.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.instrument} ({t.outcome} ₹{t.pnl})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 bg-card-accent rounded-lg sm:rounded-xl text-[10px] sm:text-xs border border-border/40">
            <button
              onClick={() => {
                setProvider("Auto");
                setModel("");
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                provider === "Auto" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-clean"
              }`}
            >
              ⚡ Auto
            </button>
            <button
              onClick={() => {
                setProvider("Google Gemini");
                setModel("gemini-3.6-flash");
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                provider === "Google Gemini" ? "bg-ai text-white shadow-sm" : "text-muted hover:text-clean"
              }`}
            >
              Gemini
            </button>
            <button
              onClick={() => {
                setProvider("NVIDIA NIM");
                setModel("nvidia/nemotron-3-ultra-550b-a55b");
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                provider === "NVIDIA NIM" ? "bg-ai text-white shadow-sm" : "text-muted hover:text-clean"
              }`}
            >
              NVIDIA
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none -mx-1 px-1">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp.prompt)}
            disabled={isLoading}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-card-accent/80 hover:bg-ai/15 hover:border-ai/40 border border-border/40 text-[10px] sm:text-xs font-semibold text-soft hover:text-clean transition-all cursor-pointer whitespace-nowrap"
          >
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      <div className="card flex-1 flex flex-col min-h-0 overflow-hidden rounded-2xl border border-border/40">
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div key={idx} className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    isUser ? "bg-accent text-white" : "bg-ai-muted text-ai border border-ai/30"
                  }`}
                >
                  {isUser ? "You" : <Bot className="h-4 w-4" />}
                </div>

                <div className={`space-y-2 max-w-[85%] sm:max-w-2xl ${isUser ? "items-end text-right" : ""}`}>
                  {msg.reasoning && (
                    <div className="rounded-xl bg-elevated/70 border border-ai/20 p-2.5 text-left text-xs space-y-1">
                      <button
                        onClick={() => toggleReasoning(idx)}
                        className="flex items-center justify-between w-full text-dim hover:text-soft text-[11px] font-semibold cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 text-ai">
                          <Brain className="h-3 w-3" /> Coach Chain of Thought
                        </span>
                        {expandedReasoning[idx] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                      {expandedReasoning[idx] && (
                        <div className="pt-2 text-[11px] text-muted font-mono leading-relaxed border-t border-border/20 max-h-48 overflow-y-auto">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-[13px] leading-relaxed text-left ${
                      isUser
                        ? "bg-accent/15 text-clean border border-accent/30 font-medium whitespace-pre-wrap"
                        : "bg-card-accent text-soft border border-border/40 shadow-sm"
                    }`}
                  >
                    {isUser ? msg.content : <FormattedMessage content={msg.content} />}
                  </div>

                  <div className={`flex items-center gap-2 text-[10px] text-dim px-1 ${isUser ? "justify-end" : "justify-start"}`}>
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <span className="font-mono bg-elevated px-1.5 py-0.5 rounded text-[9px] text-ai">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-ai-muted text-ai flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-card-accent border border-border/40 text-xs text-muted flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-ai" />
                <span>Coach is analyzing your trade context and calculating response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 sm:p-4 bg-card border-t border-border/30 space-y-2 shrink-0">
          {chartUrl && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-ai/10 border border-ai/20 text-xs text-ai">
              <span className="flex items-center gap-2 truncate">
                <ImageIcon className="h-3.5 w-3.5" /> Chart attached: {chartUrl.slice(0, 40)}...
              </span>
              <button onClick={() => setChartUrl("")} className="hover:text-loss cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask your Coach (e.g. I took a loss today, review my trade execution...)"
              className="input-field flex-1 text-xs sm:text-sm py-2.5"
              disabled={isLoading}
            />

            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="btn-primary rounded-xl! px-4! py-2.5! cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
