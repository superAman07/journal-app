"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Download, Maximize2 } from "lucide-react";

export interface LightboxImage {
  id: string;
  url: string;
  stage?: string;
  caption?: string | null;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  onClose,
}: {
  images: LightboxImage[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentImage = images[currentIndex];

  const handleNext = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 4));
  const zoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Keyboard navigation & zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "+" || e.key === "=") zoomIn();
      else if (e.key === "-") zoomOut();
      else if (e.key === "0") resetZoom();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  // Mouse drag / pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  if (!currentImage) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onWheel={handleWheel}
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {currentImage.stage && (
            <span className="px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-bold uppercase tracking-wider">
              {currentImage.stage.replace(/_/g, " ")}
            </span>
          )}
          {images.length > 1 && (
            <span className="text-xs font-mono font-medium text-white/70">
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-black/50 border border-white/20 rounded-xl p-1 backdrop-blur-md">
          <button
            onClick={zoomOut}
            disabled={zoom <= 1}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono font-bold text-white px-1.5">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={zoom >= 4}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          {zoom > 1 && (
            <button
              onClick={resetZoom}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Reset Zoom (0)"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="h-9 w-9 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer"
          title="Close (Esc)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Image Container */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden p-4 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={currentImage.url}
          alt={currentImage.stage || "Chart Screenshot"}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transition: isDragging ? "none" : "transform 0.15s ease-out",
            maxHeight: "85vh",
            maxWidth: "92vw",
          }}
          className="object-contain rounded-lg shadow-2xl pointer-events-auto"
          draggable={false}
        />

        {/* Prev / Next Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/80 hover:scale-105 transition-all cursor-pointer shadow-lg"
              title="Previous Screenshot (Left Arrow)"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/80 hover:scale-105 transition-all cursor-pointer shadow-lg"
              title="Next Screenshot (Right Arrow)"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Caption Bar */}
      <div
        className="p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-xs text-white/80 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <span>
          {currentImage.caption || "Use mouse wheel or zoom buttons to inspect chart levels."}
        </span>
        <a
          href={currentImage.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all font-medium"
        >
          <Maximize2 className="h-3.5 w-3.5" /> Full Resolution
        </a>
      </div>
    </div>
  );
}
