import { Link, useLocation } from "react-router-dom";
import { ConnectButton } from "./ConnectButton";

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        height: "64px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(5,7,10,0.8)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "2px solid var(--cyan)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "var(--cyan-glow)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L14 8L8 14L2 8L8 2Z" stroke="#00d4ff" strokeWidth="1.5" fill="none"/>
            <circle cx="8" cy="8" r="2" fill="#00d4ff"/>
          </svg>
        </div>
        <div>
          <span
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: "18px",
              fontWeight: 900,
              color: "var(--text-bright)",
              letterSpacing: "0.15em",
            }}
          >
            Q<span style={{ color: "var(--cyan)" }}>DEX</span>
          </span>
        </div>
        <span
          style={{
            padding: "2px 8px",
            border: "1px solid var(--border)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            color: "var(--text-dim)",
            letterSpacing: "0.2em",
          }}
        >
          TESTNET
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", gap: "4px" }}>
        {[
          { to: "/swap", label: "SWAP" },
          { to: "/liquidity", label: "LIQUIDITY" },
        ].map(({ to, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              style={{
                padding: "6px 20px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.2em",
                color: active ? "var(--cyan)" : "var(--text-dim)",
                textDecoration: "none",
                border: active ? "1px solid var(--border-hi)" : "1px solid transparent",
                background: active ? "var(--cyan-dim)" : "transparent",
                transition: "all 0.2s",
                position: "relative",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <ConnectButton />
    </nav>
  );
}
