"use client";

import React from "react";

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
      const isNegative = code.toLowerCase().includes("broken") || code.toLowerCase().includes("loss");
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

export function FormattedMessage({ content }: { content: string }) {
  const paragraphs = content.split(/\n\s*\n/);

  return (
    <div className="space-y-3 leading-relaxed text-left text-xs sm:text-[13.5px]">
      {paragraphs.map((para, pIdx) => {
        const rawLines = para.split("\n").map((l) => l.trim()).filter(Boolean);

        const isList = rawLines.every((l) => l.startsWith("- ") || l.startsWith("* ") || /^\d+[\.)]\s/.test(l));

        if (isList) {
          return (
            <div key={pIdx} className="space-y-1.5 my-1 pl-1">
              {rawLines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[-*]\s+|\d+[\.)]\s+/, "");
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 text-soft">
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
                  <div key={lIdx} className="font-bold text-clean text-sm sm:text-base pt-1 pb-0.5">
                    {parseInlineTokens(headingText)}
                  </div>
                );
              }

              if (line.startsWith("> ")) {
                const quoteText = line.replace(/^>\s*/, "");
                return (
                  <blockquote key={lIdx} className="border-l-2 border-accent/60 pl-3 italic text-dim my-1.5">
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
