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
  FileText,
  MessageSquare,
  ArrowDown,
  Square,
  Sparkles,
  Database,
} from "lucide-react";
import { FormattedMessage } from "./formatted-message";
import { ReportCard } from "./report-card";

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
  isTyping?: boolean;
}

export function AIChatInterface({ initialTrades = [], rulesCount = 0 }: AIChatInterfaceProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "report">("chat");
  const searchParams = useSearchParams();
  const preSelectedTradeId = searchParams.get("tradeId");

  const [selectedTradeId, setSelectedTradeId] = useState<string>(
    preSelectedTradeId || ""
  );
  const [provider, setProvider] = useState<"Auto" | "NVIDIA NIM" | "Google Gemini">("Auto");
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<{ [key: number]: boolean }>({});
  const [chartUrl, setChartUrl] = useState<string>("");

  const selectedTrade = initialTrades.find((t) => t.id === selectedTradeId);

  useEffect(() => {
    if (selectedTradeId && selectedTrade?.screenshots && selectedTrade.screenshots.length > 0) {
      setChartUrl(selectedTrade.screenshots[0].url);
    } else {
      setChartUrl("");
    }
  }, [selectedTradeId, selectedTrade]);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Welcome to your Trading Psychology & Performance Desk. I am your AI Performance Coach — connected directly to your trading database.\n\nI automatically pick the best available AI model for you. No manual setup needed.\n\nI can see your recent trades, setups, stop-losses, and rules. When you take a loss or get stopped out by a wick, you are not alone.\n\nHow are you feeling right now? Use the quick buttons above, or just type.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const abortTypewriterRef = useRef<boolean>(false);
  const typewriterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stageTimerRef = useRef<NodeJS.Timeout[]>([]);

  const [aiStage, setAiStage] = useState<{
    text: string;
    icon: "db" | "sparkles" | "brain" | "bot";
  }>({
    text: "Retrieving trade records & discipline history...",
    icon: "db",
  });

  const isGenerating = isLoading || messages.some((m) => m.isTyping);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // User is considered scrolled up if more than 70px from the bottom
    const scrolledUp = distanceFromBottom > 70;
    if (scrolledUp !== isUserScrolledUpRef.current) {
      isUserScrolledUpRef.current = scrolledUp;
      setIsUserScrolledUp(scrolledUp);
    }
  };

  const scrollToBottom = (force = false, smooth = false) => {
    if (!force && isUserScrolledUpRef.current) return;
    const el = messagesContainerRef.current;
    if (!el) return;
    if (smooth) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom(false, false);
  }, [messages, isLoading]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    abortTypewriterRef.current = true;
    if (typewriterTimerRef.current) {
      clearTimeout(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }

    stageTimerRef.current.forEach(clearTimeout);
    stageTimerRef.current = [];

    setIsLoading(false);

    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last && last.role === "assistant" && last.isTyping) {
        last.isTyping = false;
        if (!last.content.trim()) {
          last.content = "_Response stopped._";
        }
      }
      return updated;
    });
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isGenerating) return;

    abortTypewriterRef.current = false;
    stageTimerRef.current.forEach(clearTimeout);
    stageTimerRef.current = [];

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAiStage({ text: "Retrieving trade records & discipline history...", icon: "db" });
    const t1 = setTimeout(() => {
      setAiStage({ text: "Analyzing risk-to-reward & execution psychology...", icon: "sparkles" });
    }, 1300);
    const t2 = setTimeout(() => {
      setAiStage({ text: "Synthesizing psychology coach response...", icon: "brain" });
    }, 2800);
    stageTimerRef.current.push(t1, t2);

    const userMsg: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const sentChartUrl = chartUrl;
    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput("");
    setChartUrl(""); // Clear screenshot so future messages are clean
    setIsLoading(true);
    isUserScrolledUpRef.current = false;
    setIsUserScrolledUp(false);
    setTimeout(() => {
      scrollToBottom(true, true);
    }, 20);

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
          imageUrl: sentChartUrl || undefined,
          provider,
          model: model || undefined,
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reach AI mentor");
      }

      stageTimerRef.current.forEach(clearTimeout);
      stageTimerRef.current = [];
      setIsLoading(false);

      if (abortTypewriterRef.current) return;

      const fullContent: string = data.message || "";
      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const aiMsg: Message = {
        role: "assistant",
        content: "",
        reasoning: data.reasoning || undefined,
        modelUsed: data.modelUsed,
        timestamp,
        isTyping: true,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Natural ChatGPT-like typewriter animation with punctuation pacing
      await new Promise<void>((resolve) => {
        let currentLen = 0;
        const total = fullContent.length;

        const typeNext = () => {
          if (abortTypewriterRef.current || currentLen >= total) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === "assistant") {
                if (!abortTypewriterRef.current) {
                  last.content = fullContent;
                }
                last.isTyping = false;
              }
              return updated;
            });
            resolve();
            return;
          }

          // Check if we are inside a code/visual block
          const isInsideCode =
            fullContent.slice(0, currentLen).split("```").length % 2 === 0;

          let step = 1;
          let delay = 22; // Natural ChatGPT reading cadence (~45 chars/sec)

          if (isInsideCode) {
            // Speed up through raw visual JSON so charts render smoothly
            step = 8;
            delay = 12;
          } else {
            const nextChar = fullContent[currentLen];
            if (nextChar === "." || nextChar === "!" || nextChar === "?") {
              delay = 65; // Natural pause at end of sentence
            } else if (nextChar === "\n") {
              delay = 45; // Subtle pause at line breaks
            } else if (nextChar === ",") {
              delay = 35; // Micro pause at commas
            }
          }

          currentLen = Math.min(total, currentLen + step);

          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              last.content = fullContent.slice(0, currentLen);
            }
            return updated;
          });

          typewriterTimerRef.current = setTimeout(typeNext, delay);
        };

        typeNext();
      });
    } catch (err: any) {
      if (err.name === "AbortError" || abortTypewriterRef.current) {
        setIsLoading(false);
        return;
      }

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
      abortControllerRef.current = null;
      stageTimerRef.current.forEach(clearTimeout);
      stageTimerRef.current = [];
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
    <div className="flex flex-col h-[calc(100vh-4.6rem)] sm:h-[calc(100vh-5.2rem)] space-y-2 min-h-0">
      {/* Unified Sleek Top Bar */}
      <div className="card p-2 sm:p-2.5 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 border border-border/40 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 p-0.5 bg-surface border border-border-solid rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "chat"
                  ? "bg-accent text-white shadow-xs"
                  : "text-muted hover:text-clean"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Chat Coach
            </button>
            <button
              onClick={() => setActiveTab("report")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "report"
                  ? "bg-accent text-white shadow-xs"
                  : "text-muted hover:text-clean"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Report Card
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border/40">
            <div className="h-6 w-6 rounded-lg bg-ai-muted text-ai flex items-center justify-center font-bold shrink-0">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <span className="badge badge-ai text-[9px]">DB Live</span>
            <span className="text-[11px] text-muted truncate">Prop Desk Methodology</span>
          </div>
        </div>

        {activeTab === "chat" && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {initialTrades.length > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-dim text-[10px] hidden lg:inline">Focus:</span>
                <select
                  value={selectedTradeId}
                  onChange={(e) => setSelectedTradeId(e.target.value)}
                  className="input-field py-1 text-[10px] sm:text-xs max-w-36 sm:max-w-48 truncate font-mono"
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

            <div className="flex items-center gap-0.5 p-0.5 bg-card-accent rounded-lg text-[10px] sm:text-xs border border-border/40 shrink-0">
              <button
                onClick={() => {
                  setProvider("Auto");
                  setModel("");
                }}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  provider === "Auto"
                    ? "bg-accent text-white shadow-xs"
                    : "text-muted hover:text-clean"
                }`}
              >
                ⚡ Auto
              </button>
              <button
                onClick={() => {
                  setProvider("Google Gemini");
                  setModel("gemini-flash-lite-latest");
                }}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  provider === "Google Gemini"
                    ? "bg-ai text-white shadow-xs"
                    : "text-muted hover:text-clean"
                }`}
              >
                Gemini
              </button>
              <button
                onClick={() => {
                  setProvider("NVIDIA NIM");
                  setModel("nvidia/nemotron-3-ultra-550b-a55b");
                }}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  provider === "NVIDIA NIM"
                    ? "bg-ai text-white shadow-xs"
                    : "text-muted hover:text-clean"
                }`}
              >
                NVIDIA
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTab === "report" ? (
        <div className="flex-1 overflow-y-auto">
          <ReportCard />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 shrink-0 scrollbar-none -mx-1 px-1">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp.prompt)}
                disabled={isGenerating}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card-accent/80 hover:bg-ai/15 hover:border-ai/40 border border-border/40 text-[10px] sm:text-[11px] font-semibold text-soft hover:text-clean transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{qp.label}</span>
              </button>
            ))}
          </div>

          <div className="card flex-1 flex flex-col min-h-0 overflow-hidden rounded-2xl border border-border/40 shadow-sm relative">
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
            >
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
                    {isUser ? (
                      msg.content
                    ) : (
                      <FormattedMessage
                        content={msg.content}
                        isTyping={msg.isTyping}
                      />
                    )}
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
              <div className="h-8 w-8 rounded-xl bg-ai-muted text-ai flex items-center justify-center shrink-0 animate-pulse border border-ai/20">
                {aiStage.icon === "db" && <Database className="h-4 w-4 text-ai" />}
                {aiStage.icon === "sparkles" && <Sparkles className="h-4 w-4 text-ai" />}
                {aiStage.icon === "brain" && <Brain className="h-4 w-4 text-ai" />}
                {aiStage.icon === "bot" && <Bot className="h-4 w-4 text-ai" />}
              </div>
              <div className="p-3 sm:p-3.5 rounded-2xl bg-card-accent border border-border/40 text-xs text-soft flex items-center gap-2.5 shadow-xs">
                <div className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ai opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-ai" />
                </div>
                <span className="font-medium text-clean transition-all duration-300">
                  {aiStage.text}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Stop Button (Centered in the middle) */}
        {isGenerating && (
          <button
            type="button"
            onClick={handleStop}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface/95 backdrop-blur-md border border-border/80 hover:border-loss/60 shadow-lg text-xs font-semibold text-soft hover:text-loss transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2 group"
          >
            <Square className="h-3 w-3 fill-current text-loss group-hover:scale-110 transition-transform" />
            <span>Stop generating</span>
          </button>
        )}

        {/* Floating Jump to Latest Button (Right side) */}
        {isUserScrolledUp && (
          <button
            type="button"
            onClick={() => {
              isUserScrolledUpRef.current = false;
              setIsUserScrolledUp(false);
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className="absolute bottom-20 right-5 sm:right-7 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface/95 backdrop-blur-md border border-border/80 shadow-lg text-xs font-semibold text-soft hover:text-clean hover:border-accent hover:shadow-accent/20 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2"
          >
            <ArrowDown className="h-3.5 w-3.5 text-accent animate-bounce" />
            <span>{isGenerating ? "Generating below..." : "Jump to latest"}</span>
          </button>
        )}

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
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && !isGenerating && handleSend()}
              placeholder={isGenerating ? "AI Coach is generating response..." : "Ask your Coach (e.g. I took a loss today, review my trade execution...)"}
              className="input-field flex-1 text-xs sm:text-sm py-2.5"
              disabled={isGenerating}
            />

            {isGenerating ? (
              <button
                type="button"
                onClick={handleStop}
                title="Stop generating"
                className="h-9 px-3.5 rounded-xl bg-loss/15 hover:bg-loss/25 border border-loss/30 text-loss flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-all shrink-0"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="btn-primary rounded-xl! px-4! py-2.5! cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
