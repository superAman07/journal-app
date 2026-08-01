"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteTrade } from "@/lib/actions/trade-actions";

export function DeleteTradeButton({ tradeId }: { tradeId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteTrade(tradeId);
    setDeleting(false);
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-2 py-1 rounded-lg bg-loss/15 text-loss text-[10px] font-bold border border-loss/30 hover:bg-loss/25 transition-all cursor-pointer"
        >
          {deleting ? "..." : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-1 rounded-lg bg-elevated text-dim text-[10px] font-bold hover:bg-surface transition-all cursor-pointer"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="h-7 w-7 rounded-lg flex items-center justify-center text-dim hover:text-loss hover:bg-loss/10 transition-all cursor-pointer"
      title="Delete trade"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
