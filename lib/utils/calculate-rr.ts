export function calculateRR(entry: number, sl: number, exit: number, outcome: string): number {
  if (isNaN(entry) || isNaN(sl) || isNaN(exit) || entry === sl) return 0;
  const risk = Math.abs(entry - sl);
  if (risk === 0) return 0;

  if (outcome === "LOSS") {
    const loss = Math.abs(entry - exit);
    return parseFloat((-Math.max(loss, risk) / risk).toFixed(2));
  }
  if (outcome === "BREAKEVEN") return 0;

  const reward = Math.abs(exit - entry);
  return parseFloat((reward / risk).toFixed(2));
}
