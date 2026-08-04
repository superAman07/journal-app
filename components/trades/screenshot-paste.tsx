"use client";

import { useState, useRef, useCallback } from "react";
import { X, Clipboard, Camera } from "lucide-react";

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
  const [activeStage, setActiveStage] = useState(stages[0].value);
  const pasteRef = useRef<HTMLDivElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onAdd({
          id: `ss-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dataUrl,
          stage: activeStage,
        });
      };
      reader.readAsDataURL(file);
    },
    [activeStage, onAdd]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) processFile(file);
        }
      }
    },
    [processFile]
  );

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

  const currentStage = stages.find((s) => s.value === activeStage);
  const stageScreenshots = (stage: string) => screenshots.filter((s) => s.stage === stage);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-accent" />
        <span className="text-xs font-bold text-clean uppercase tracking-wider">
          Chart Screenshots
        </span>
        {screenshots.length > 0 && (
          <span className="text-[10px] text-accent font-semibold bg-accent-muted px-2 py-0.5 rounded-full ml-auto">
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

      <div
        ref={pasteRef}
        tabIndex={0}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer outline-none focus:border-accent/50 ${
          isDragOver
            ? "border-accent/60 bg-accent-muted/30"
            : "border-border/30 hover:border-border-hover/50 bg-surface/50"
        }`}
        onClick={() => pasteRef.current?.focus()}
      >
        <div className="flex flex-col items-center justify-center py-5 gap-1.5">
          <div className="h-9 w-9 rounded-xl bg-elevated flex items-center justify-center">
            <Clipboard className="h-4 w-4 text-dim" />
          </div>
          <p className="text-xs font-semibold text-soft">
            Ctrl+V to paste screenshot
          </p>
          <p className="text-[10px] text-dim">
            {currentStage?.desc} · or drag & drop
          </p>
        </div>
      </div>

      {screenshots.length > 0 && (
        <div className="space-y-3">
          {stages.map((stage) => {
            const stageItems = stageScreenshots(stage.value);
            if (stageItems.length === 0) return null;
            return (
              <div key={stage.value} className="space-y-1.5">
                <span className="text-[10px] font-bold text-dim uppercase tracking-wider">
                  {stage.label}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {stageItems.map((ss) => (
                    <div
                      key={ss.id}
                      className="relative group rounded-xl overflow-hidden border border-border/20 bg-surface"
                    >
                      <img
                        src={ss.dataUrl}
                        alt={stage.label}
                        className="w-full h-24 object-cover"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        type="button"
                        onClick={() => onRemove(ss.id)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-loss/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
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
