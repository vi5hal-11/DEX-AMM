import { formatUnits } from "viem";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label: string;
  balance?: bigint;
  readOnly?: boolean;
  highlight?: boolean;
}

export function AmountInput({ value, onChange, label, balance, readOnly, highlight }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            color: "var(--text-dim)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        {balance !== undefined && (
          <button
            type="button"
            onClick={() => onChange(formatUnits(balance, 18))}
            style={{
              background: "none",
              border: "none",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              color: "var(--cyan)",
              cursor: "pointer",
              letterSpacing: "0.05em",
              padding: "2px 6px",
              borderBottom: "1px solid var(--border-hi)",
              transition: "all 0.2s",
            }}
          >
            BAL: {parseFloat(formatUnits(balance, 18)).toFixed(4)}
          </button>
        )}
      </div>
      <div style={{ position: "relative" }}>
        <input
          type="number"
          min="0"
          placeholder="0.000000"
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: readOnly ? "rgba(0,212,255,0.03)" : "var(--surface-2)",
            border: "1px solid var(--border)",
            borderLeft: highlight ? "2px solid var(--purple)" : "2px solid var(--cyan)",
            color: readOnly ? "var(--cyan)" : "var(--text-bright)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "22px",
            fontWeight: 300,
            outline: "none",
            transition: "all 0.2s",
            letterSpacing: "-0.02em",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--cyan)";
            e.target.style.boxShadow = "0 0 0 1px var(--border-hi)";
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = "none";
          }}
        />
        {readOnly && value && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: "linear-gradient(90deg, var(--cyan), var(--purple))",
              animation: "scanline 2s linear infinite",
              opacity: 0.6,
            }}
          />
        )}
      </div>
    </div>
  );
}
