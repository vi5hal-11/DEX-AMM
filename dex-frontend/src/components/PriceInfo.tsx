import { fmt } from "../lib/utils";

interface Props {
  amountIn: bigint;
  amountOut: bigint | undefined;
  symbolIn: string;
  symbolOut: string;
  reserve0: bigint | undefined;
  reserve1: bigint | undefined;
}

export function PriceInfo({ amountIn, amountOut, symbolIn, symbolOut, reserve0, reserve1 }: Props) {
  if (!amountOut || amountIn === 0n) return null;

  const rate = amountOut > 0n ? Number(amountOut) / Number(amountIn) : 0;
  const priceImpactNum =
    reserve0 && reserve1
      ? (Number(amountIn) / (Number(reserve0) + Number(amountIn))) * 100
      : 0;
  const priceImpact = priceImpactNum.toFixed(2);
  const impactColor =
    priceImpactNum > 5 ? "var(--red)" : priceImpactNum > 2 ? "var(--amber)" : "var(--green)";

  const rows = [
    { label: "EXCHANGE RATE", value: `1 ${symbolIn} = ${rate.toFixed(6)} ${symbolOut}`, color: "var(--text-bright)" },
    { label: "PRICE IMPACT", value: `~${priceImpact}%`, color: impactColor },
    { label: "MIN RECEIVED (0.5%)", value: `${fmt((amountOut * 9950n) / 10000n)} ${symbolOut}`, color: "var(--cyan)" },
  ];

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderLeft: "2px solid var(--cyan)",
        background: "var(--cyan-dim)",
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
      className="animate-in-delay"
    >
      {rows.map(({ label, value, color }) => (
        <div
          key={label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px",
              color: "var(--text-dim)",
              letterSpacing: "0.15em",
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              color,
              fontWeight: 500,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
