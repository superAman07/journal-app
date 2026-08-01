"use client";

import { useState, useRef, useCallback } from "react";
import { ImageIcon, X, Clipboard, Camera } from "lucide-react";

type Screenshot = {
  id: string;
  dataUrl: string;
  stage: string;
};

const STAGES = [
  { value: "BEFORE_ENTRY", label: "Before Entry" },
  { value: "DURING_TRADE", label: "During Trade" },
  { value: "AFTER_EXIT", label: "After Exit" },
];

export function ScreenshotPaste({
  screenshots,
  onAdd,
  onRemove,
}: {
  screenshots: Screenshot[];
  onAdd: (screenshot: Screenshot) => void;
  onRemove: (id: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeStage, setActiveStage] = useState("BEFORE_ENTRY");
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-accent" />
        <span className="text-xs font-bold text-clean uppercase tracking-wider">
          Chart Screenshots
        </span>
        <span className="text-[10px] text-dim ml-auto">
          {screenshots.length} attached
        </span>
      </div>

      <div className="flex gap-1.5">
        {STAGES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setActiveStage(s.value)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border cursor-pointer ${
              activeStage === s.value
                ? "bg-accent-muted text-accent border-accent/30"
                : "bg-surface text-dim border-transparent hover:bg-elevated"
            }`}
          >
            {s.label}
          </button>
        ))}
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
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <div className="h-10 w-10 rounded-xl bg-elevated flex items-center justify-center">
            <Clipboard className="h-5 w-5 text-dim" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-soft">
              Ctrl+V to paste screenshot
            </p>
            <p className="text-[10px] text-dim mt-0.5">
              or drag & drop chart images here
            </p>
          </div>
        </div>
      </div>

      {screenshots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {screenshots.map((ss) => (
            <div
              key={ss.id}
              className="relative group rounded-xl overflow-hidden border border-border/20 bg-surface"
            >
              <img
                src={ss.dataUrl}
                alt="Chart screenshot"
                className="w-full h-24 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white/80 uppercase tracking-wider">
                {STAGES.find((s) => s.value === ss.stage)?.label}
              </span>
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
      )}
    </div>
  );
}
