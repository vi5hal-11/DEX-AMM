interface Props {
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
  hash?: `0x${string}`;
}

export function TxStatus({ isPending, isConfirming, isSuccess, error, hash }: Props) {
  if (!isPending && !isConfirming && !isSuccess && !error) return null;

  const explorerUrl = hash ? `https://sepolia.etherscan.io/tx/${hash}` : undefined;

  const state = isSuccess ? "success" : error ? "error" : "pending";

  const config = {
    pending: {
      border: "var(--purple)",
      bg: "var(--purple-dim)",
      color: "#c084fc",
      icon: "◈",
      spin: true,
    },
    success: {
      border: "var(--green)",
      bg: "rgba(0,255,135,0.06)",
      color: "var(--green)",
      icon: "✓",
      spin: false,
    },
    error: {
      border: "var(--red)",
      bg: "rgba(255,69,69,0.06)",
      color: "var(--red)",
      icon: "✗",
      spin: false,
    },
  }[state];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "12px 16px",
        border: `1px solid ${config.border}`,
        borderLeft: `2px solid ${config.border}`,
        background: config.bg,
      }}
      className="animate-in"
    >
      <span
        style={{
          color: config.color,
          fontSize: "16px",
          lineHeight: 1,
          animation: config.spin ? "blink 1s step-end infinite" : "none",
        }}
      >
        {config.icon}
      </span>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            color: config.color,
            letterSpacing: "0.05em",
          }}
        >
          {isPending && "AWAITING WALLET SIGNATURE..."}
          {isConfirming && "BROADCASTING TO NETWORK..."}
          {isSuccess && (
            <>
              TRANSACTION CONFIRMED{" "}
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--cyan)", textDecoration: "underline" }}
                >
                  → VIEW ON ETHERSCAN
                </a>
              )}
            </>
          )}
          {error && `ERROR: ${(error as any).shortMessage ?? error.message}`}
        </p>
        {hash && (
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px",
              color: "var(--text-dim)",
              marginTop: "4px",
              letterSpacing: "0.05em",
            }}
          >
            {hash.slice(0, 20)}...{hash.slice(-10)}
          </p>
        )}
      </div>
    </div>
  );
}
