"use client";

import { useState } from "react";
import { Sparkles, Bot, Send, RefreshCw, Cpu } from "lucide-react";

export default function AICoachPage() {
  const [provider, setProvider] = useState<"Ollama" | "OpenAI" | "Gemini">("Ollama");
  const [model, setModel] = useState("llama3:8b");
  const [userQuery, setUserQuery] = useState("");
  const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hello Trader! I've analyzed your last 42 trades. Your Gold NY Session execution is exceptional (+2.9R avg), but BankNifty Options trades suffer from 75% FOMO entry rate. How can I help today?" }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSend = () => {
    if (!userQuery.trim()) return;
    const query = userQuery;
    setMessages((p) => [...p, { sender: "user", text: query }]);
    setUserQuery("");
    setIsGenerating(true);
    setTimeout(() => {
      setMessages((p) => [...p, { sender: "ai", text: `[${provider}/${model}] Analyzing "${query}"... Your highest probability improvement is setting limit orders instead of market orders during news spikes.` }]);
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-7rem)] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ai" /> AI Coach
          </h1>
          <p className="text-xs text-muted mt-0.5">Automated trade reviews and pattern detection.</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl text-xs">
          <Cpu className="h-3.5 w-3.5 text-ai ml-2" />
          {(["Ollama", "OpenAI", "Gemini"] as const).map((p) => (
            <button key={p} onClick={() => { setProvider(p); setModel(p === "Ollama" ? "llama3:8b" : p === "OpenAI" ? "gpt-4o" : "gemini-1.5-pro"); }}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${provider === p ? "bg-ai text-white" : "text-muted hover:text-soft"}`}
            >{p}</button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="card flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                msg.sender === "user" ? "bg-elevated text-soft" : "bg-ai-muted text-ai"
              }`}>
                {msg.sender === "user" ? "You" : <Bot className="h-4 w-4" />}
              </div>
              <div className={`p-3.5 rounded-2xl max-w-[85%] sm:max-w-xl text-xs leading-relaxed ${
                msg.sender === "user" ? "bg-accent/10 border border-accent/20 text-accent-hover" : "bg-elevated border border-border text-soft"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-ai" /> Generating...
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-border flex items-center gap-2 shrink-0">
          <input
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Ask via ${provider}...`}
            className="input-field flex-1"
          />
          <button onClick={handleSend} className="btn-primary !rounded-xl shrink-0">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
