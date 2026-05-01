import { formatUnits, parseUnits } from "viem";

export function fmt(value: bigint | undefined, decimals = 18, precision = 6): string {
  if (value === undefined) return "–";
  const s = formatUnits(value, decimals);
  const num = parseFloat(s);
  if (isNaN(num)) return "–";
  return num.toLocaleString("en-US", { maximumFractionDigits: precision });
}

export function parse(value: string, decimals = 18): bigint {
  if (!value || value === ".") return 0n;
  try { return parseUnits(value, decimals); } catch { return 0n; }
}

export function applySlippage(amount: bigint, bps: bigint): bigint {
  return (amount * (10000n - bps)) / 10000n;
}
