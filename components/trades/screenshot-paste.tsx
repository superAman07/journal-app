"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Clipboard, Camera, FolderOpen } from "lucide-react";

type Screenshot = {
  id: string;
  dataUrl: string;
  stage: string;
};

const BASE_STAGES = [
  { value: "BEFORE_ENTRY", label: "Setup / Before Entry", desc: "Chart markup, levels, zones" },
  { value: "DURING_TRADE", label: "During Trade", desc: "Price action while position is live" },
  { value: "AFTER_EXIT", label: "After Exit", desc: "Final result and review" },
];

const OPTIONS_STAGES = [
  { value: "BEFORE_ENTRY", label: "Setup / Before Entry", desc: "Chart markup, levels, zones" },
  { value: "STRIKE_SELECTION", label: "Strike Price Level", desc: "OI data, strike chart, premium levels" },
  { value: "OPTION_CHAIN", label: "Option Chain", desc: "Option chain snapshot at entry" },
  { value: "DURING_TRADE", label: "During Trade", desc: "Premium movement while live" },
  { value: "AFTER_EXIT", label: "After Exit", desc: "Final P&L and review" },
];

function compressImageFile(file: File, maxWidth = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        resolve("");
        return;
      }
      if (!src.startsWith("data:image/")) {
        resolve(src);
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(src);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed || src);
        } catch {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export function ScreenshotPaste({
  screenshots,
  onAdd,
  onRemove,
  isOptions = false,
}: {
  screenshots: Screenshot[];
  onAdd: (screenshot: Screenshot) => void;
  onRemove: (id: string) => void;
  isOptions?: boolean;
}) {
  const stages = isOptions ? OPTIONS_STAGES : BASE_STAGES;
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeStage, setActiveStage] = useState(stages[0].value);
  const pasteRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lastPastedRef = useRef<{ time: number; size: number }>({ time: 0, size: 0 });

  const processFile = useCallback(
    async (file: File) => {
      if (!file) return;

      // Prevent duplicate processing of the same file within 1.5 seconds
      const now = Date.now();
      if (now - lastPastedRef.current.time < 1500 && lastPastedRef.current.size === file.size) {
        return;
      }
      lastPastedRef.current = { time: now, size: file.size };

      setIsProcessing(true);
      try {
        const compressed = await compressImageFile(file);
        if (compressed && compressed.startsWith("data:image/")) {
          onAdd({
            id: `ss-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            dataUrl: compressed,
            stage: activeStage,
          });
        }
      } catch (err) {
        console.error("Failed to process image:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [activeStage, onAdd]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.includes("image")) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
            return;
          }
        }
      }
    },
    [processFile]
  );

  // Global paste handler so pressing Ctrl+V anywhere on the page/modal adds the screenshot
  useEffect(() => {
    const onWindowPaste = (e: ClipboardEvent) => {
      // If the event target is inside pasteRef, let handlePaste handle it
      if (pasteRef.current && (pasteRef.current === e.target || pasteRef.current.contains(e.target as Node))) {
        return;
      }

      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === "INPUT" && (activeEl as HTMLInputElement).type !== "file";
      const isTextarea = activeEl?.tagName === "TEXTAREA";
      if (isInput || isTextarea) return;

      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.includes("image")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            return;
          }
        }
      }
    };

    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [processFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer?.files;
      if (!files) return;
      for (const file of Array.from(files)) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleClipboardButtonClick = async () => {
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imgType = item.types.find((t) => t.startsWith("image/"));
          if (imgType) {
            const blob = await item.getType(imgType);
            const file = new File([blob], "clipboard-screenshot.png", { type: imgType });
            await processFile(file);
            return;
          }
        }
      }
    } catch {
      // Permission rejected or unsupported
    }
    // Fallback: focus the paste box so user can press Ctrl+V
    pasteRef.current?.focus();
  };

  const currentStage = stages.find((s) => s.value === activeStage);
  const stageScreenshots = (stage: string) => screenshots.filter((s) => s.stage === stage);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-accent" />
          <span className="text-xs font-bold text-clean uppercase tracking-wider">
            Chart Screenshots
          </span>
        </div>
        {screenshots.length > 0 && (
          <span className="text-[10px] text-accent font-semibold bg-accent-muted px-2 py-0.5 rounded-full">
            {screenshots.length} attached
          </span>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {stages.map((s) => {
          const count = stageScreenshots(s.value).length;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setActiveStage(s.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border cursor-pointer flex items-center gap-1.5 ${
                activeStage === s.value
                  ? "bg-accent-muted text-accent border-accent/30"
                  : "bg-surface text-dim border-transparent hover:bg-elevated"
              }`}
            >
              {s.label}
              {count > 0 && (
                <span className="h-4 w-4 rounded-full bg-accent/20 text-accent text-[9px] font-bold flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (!files) return;
          for (const f of Array.from(files)) {
            processFile(f);
          }
          e.target.value = "";
        }}
      />

      {/* Main Paste & Drop Box (Clicking focuses it, does NOT trigger file picker) */}
      <div
        ref={pasteRef}
        tabIndex={0}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => pasteRef.current?.focus()}
        className={`relative rounded-xl border-2 border-dashed p-4 transition-all cursor-pointer outline-none ${
          isFocused || isDragOver
            ? "border-accent bg-accent/10 ring-2 ring-accent/20"
            : "border-border/40 hover:border-border-hover/60 bg-surface/60"
        }`}
      >
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
              isFocused ? "bg-accent text-white" : "bg-elevated text-dim"
            }`}
          >
            <Clipboard className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-bold text-clean">
              {isProcessing
                ? "Optimizing and attaching screenshot..."
                : isFocused
                ? "Paste ready! Press Ctrl + V now"
                : "Click here and press Ctrl + V to paste"}
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              Adding to: <span className="text-accent font-semibold">{currentStage?.label}</span> · or drag & drop image
            </p>
          </div>

          {/* Action buttons: Explicit Paste button + Explicit Browse button */}
          <div className="flex items-center gap-2 mt-1 pt-2 border-t border-border/20 flex-wrap justify-center">
            <button
              type="button"
              onClick={handleClipboardButtonClick}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Clipboard className="h-3.5 w-3.5" />
              <span>Paste from Clipboard</span>
            </button>

            <span className="text-[11px] text-dim font-bold">OR</span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg bg-elevated hover:bg-surface text-soft hover:text-clean border border-border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <FolderOpen className="h-3.5 w-3.5 text-accent" />
              <span>Upload from Computer</span>
            </button>
          </div>
        </div>
      </div>

      {screenshots.length > 0 && (
        <div className="space-y-3 pt-1">
          {stages.map((stage) => {
            const stageItems = stageScreenshots(stage.value);
            if (stageItems.length === 0) return null;
            return (
              <div key={stage.value} className="space-y-1.5">
                <span className="text-[10px] font-bold text-dim uppercase tracking-wider">
                  {stage.label} ({stageItems.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {stageItems.map((ss) => (
                    <div
                      key={ss.id}
                      className="relative group rounded-xl overflow-hidden border border-border bg-surface shadow-xs"
                    >
                      <img
                        src={ss.dataUrl}
                        alt={stage.label}
                        className="w-full h-24 object-cover"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-1.5">
                        <span className="text-[9px] text-white font-mono bg-black/60 px-1.5 py-0.5 rounded">
                          {stage.label.split("/")[0].trim()}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemove(ss.id)}
                          className="h-6 w-6 rounded-full bg-loss text-white flex items-center justify-center hover:bg-loss/90 transition-colors cursor-pointer shadow-sm"
                          title="Remove screenshot"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
