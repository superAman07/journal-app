"use client";

import React from "react";
import {
  AIVisualChart,
  AIVisualSetup,
  AIVisualFlowchart,
  AIVisualGauge,
} from "./ai-visuals";

function parseInlineTokens(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    const raw = match[0];
    if (raw.startsWith("**") && raw.endsWith("**")) {
      tokens.push(
        <strong key={key++} className="font-semibold text-clean">
          {raw.slice(2, -2)}
        </strong>
      );
    } else if (raw.startsWith("*") && raw.endsWith("*")) {
      tokens.push(
        <span key={key++} className="italic text-soft font-normal">
          {raw.slice(1, -1)}
        </span>
      );
    } else if (raw.startsWith("`") && raw.endsWith("`")) {
      const code = raw.slice(1, -1);
      const isNegative =
        code.toLowerCase().includes("broken") ||
        code.toLowerCase().includes("loss");
      tokens.push(
        <span
          key={key++}
          className={`font-mono text-[11px] px-1.5 py-0.5 rounded border inline-block my-0.5 ${
            isNegative
              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
              : "bg-elevated text-soft border-border/40"
          }`}
        >
          {code}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

function renderVisualBlock(tag: string, jsonStr: string, key: number) {
  try {
    const data = JSON.parse(jsonStr.trim());

    if (tag === "visual:chart") {
      return <AIVisualChart key={key} {...data} />;
    }
    if (tag === "visual:setup") {
      return <AIVisualSetup key={key} {...data} />;
    }
    if (tag === "visual:flowchart") {
      return <AIVisualFlowchart key={key} {...data} />;
    }
    if (tag === "visual:gauge") {
      return <AIVisualGauge key={key} {...data} />;
    }
  } catch {
    // If JSON is malformed or still streaming, return as a clean styled block
    return (
      <pre
        key={key}
        className="p-3 my-2 rounded-xl bg-card border border-border/40 font-mono text-[11px] text-muted overflow-x-auto"
      >
        {jsonStr}
      </pre>
    );
  }

  return null;
}

export function FormattedMessage({
  content,
  isTyping = false,
}: {
  content: string;
  isTyping?: boolean;
}) {
  // First, extract any ```visual:... codeblocks
  const codeBlockRegex = /```(visual:[a-zA-Z0-9_-]+|[\w-]*)\n([\s\S]*?)```/g;
  const sections: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let sectionKey = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      sections.push(renderTextParagraphs(textBefore, sectionKey++));
    }

    const lang = match[1]?.trim() || "";
    const codeContent = match[2] || "";

    if (lang.startsWith("visual:")) {
      sections.push(renderVisualBlock(lang, codeContent, sectionKey++));
    } else {
      sections.push(
        <pre
          key={sectionKey++}
          className="p-3.5 my-2.5 rounded-xl bg-surface/90 border border-border/40 font-mono text-[11px] text-clean overflow-x-auto shadow-xs"
        >
          {lang && (
            <div className="text-[9px] uppercase tracking-wider text-dim border-b border-border/30 pb-1 mb-1.5 font-bold">
              {lang}
            </div>
          )}
          <code>{codeContent}</code>
        </pre>
      );
    }

    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    sections.push(renderTextParagraphs(remainingText, sectionKey++));
  }

  return (
    <div className="space-y-3 leading-relaxed text-left text-xs sm:text-[13.5px]">
      {sections.length > 0 ? sections : renderTextParagraphs(content, 0)}
      {isTyping && (
        <span className="inline-block w-1.5 h-3.5 ml-1 bg-ai animate-pulse align-middle rounded-xs" />
      )}
    </div>
  );
}

function renderTextParagraphs(text: string, baseKey: number): React.ReactNode {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <div key={baseKey} className="space-y-2.5">
      {paragraphs.map((para, pIdx) => {
        const rawLines = para
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        const isList = rawLines.every(
          (l) =>
            l.startsWith("- ") ||
            l.startsWith("* ") ||
            /^\d+[\.)]\s/.test(l)
        );

        if (isList) {
          return (
            <div key={pIdx} className="space-y-1.5 my-1 pl-1">
              {rawLines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[-*]\s+|\d+[\.)]\s+/, "");
                return (
                  <div
                    key={lIdx}
                    className="flex items-start gap-2.5 text-soft"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/80 mt-2 shrink-0" />
                    <div className="flex-1 leading-relaxed">
                      {parseInlineTokens(cleanLine)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <div key={pIdx} className="text-soft leading-relaxed space-y-1">
            {rawLines.map((line, lIdx) => {
              if (line.startsWith("### ") || line.startsWith("## ")) {
                const headingText = line.replace(/^#{2,3}\s+/, "");
                return (
                  <div
                    key={lIdx}
                    className="font-bold text-clean text-sm sm:text-base pt-1 pb-0.5"
                  >
                    {parseInlineTokens(headingText)}
                  </div>
                );
              }

              if (line.startsWith("> ")) {
                const quoteText = line.replace(/^>\s*/, "");
                return (
                  <blockquote
                    key={lIdx}
                    className="border-l-2 border-accent/60 pl-3 italic text-dim my-1.5"
                  >
                    {parseInlineTokens(quoteText)}
                  </blockquote>
                );
              }

              return (
                <div key={lIdx} className="leading-relaxed">
                  {parseInlineTokens(line)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
