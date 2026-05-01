import { TOKENS } from "../lib/constants";

interface Props {
  value: (typeof TOKENS)[number];
  onChange: (t: (typeof TOKENS)[number]) => void;
  exclude?: string;
  label: string;
}

export function TokenSelector({ value, onChange, exclude, label }: Props) {
  const options = TOKENS.filter((t) => t.address !== exclude);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
      <div style={{ position: "relative" }}>
        <select
          value={value.address}
          onChange={(e) => {
            const t = TOKENS.find((tk) => tk.address === e.target.value);
            if (t) onChange(t);
          }}
          style={{
            width: "100%",
            padding: "10px 36px 10px 14px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderLeft: "2px solid var(--cyan)",
            color: "var(--cyan)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            cursor: "pointer",
            outline: "none",
            transition: "all 0.2s",
          }}
        >
          {options.map((t) => (
            <option
              key={t.address}
              value={t.address}
              style={{ background: "var(--surface)", color: "var(--text)" }}
            >
              {t.symbol}
            </option>
          ))}
        </select>
        {/* Custom arrow */}
        <div
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--cyan)",
            fontSize: "10px",
          }}
        >
          ▼
        </div>
      </div>
    </div>
  );
}
