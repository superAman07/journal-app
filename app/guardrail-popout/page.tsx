"use client";

import { TraderGuardrail } from "@/components/guardrail/trader-guardrail";

export default function GuardrailPopoutPage() {
  return (
    <div className="h-screen w-screen bg-background text-clean p-2 flex flex-col overflow-hidden select-none">
      <TraderGuardrail isPipMode={true} />
    </div>
  );
}
