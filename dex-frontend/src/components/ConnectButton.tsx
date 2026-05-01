import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            border: "1px solid var(--border-hi)",
            background: "var(--cyan-dim)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            color: "var(--cyan)",
            letterSpacing: "0.05em",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--green)",
              boxShadow: "0 0 8px var(--green)",
              animation: "pulseRing 2s infinite",
              display: "inline-block",
            }}
          />
          {address.slice(0, 6)}…{address.slice(-4)}
        </div>
        <button
          onClick={() => disconnect()}
          style={{
            padding: "6px 14px",
            border: "1px solid var(--border)",
            background: "transparent",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            color: "var(--text-dim)",
            cursor: "pointer",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = "var(--red)";
            (e.target as HTMLButtonElement).style.color = "var(--red)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = "var(--border)";
            (e.target as HTMLButtonElement).style.color = "var(--text-dim)";
          }}
        >
          DISCONNECT
        </button>
      </div>
    );
  }

  const connector =
    connectors.find((c) => c.id === "injected") ?? connectors[0];

  if (!connector) return null;

  return (
    <button
      onClick={() => connect({ connector })}
      style={{
        padding: "8px 20px",
        background: "transparent",
        border: "1px solid var(--cyan)",
        color: "var(--cyan)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        const btn = e.currentTarget;
        btn.style.background = "var(--cyan-dim)";
        btn.style.boxShadow = "var(--cyan-glow)";
      }}
      onMouseLeave={(e) => {
        const btn = e.currentTarget;
        btn.style.background = "transparent";
        btn.style.boxShadow = "none";
      }}
    >
      CONNECT WALLET
    </button>
  );
}
