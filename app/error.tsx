"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[Trading OS Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <div className="h-16 w-16 rounded-2xl bg-loss-muted flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-loss" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold text-clean">Something went wrong</h2>
        <p className="text-sm text-muted leading-relaxed">
          An unexpected error occurred. This has been logged for review.
        </p>
        {error.digest && (
          <p className="text-[10px] text-dim font-mono mt-2">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => unstable_retry()} className="btn-primary">
          <RotateCcw className="h-4 w-4" /> Try Again
        </button>
        <Link href="/" className="btn-secondary">
          <Home className="h-4 w-4" /> Dashboard
        </Link>
      </div>
    </div>
  );
}
