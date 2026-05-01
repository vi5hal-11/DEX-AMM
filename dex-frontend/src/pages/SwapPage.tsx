import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { TOKENS, ROUTER_ADDRESS } from "../lib/constants";
import { parse } from "../lib/utils";
import { useAmountsOut, useSwap } from "../hooks/useSwap";
import { useTokenApproval } from "../hooks/useTokenApproval";
import { usePairReserves } from "../hooks/usePairReserves";
import { TokenSelector } from "../components/TokenSelector";
import { AmountInput } from "../components/AmountInput";
import { PriceInfo } from "../components/PriceInfo";
import { TxStatus } from "../components/TxStatus";
import ERC20_ABI from "../contracts/abis/ERC20.json";

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        border: "1px solid var(--border)",
        borderTop: `2px solid ${accent ? "var(--cyan)" : "var(--border)"}`,
        background: "var(--surface)",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          color: "var(--text-dim)",
          letterSpacing: "0.2em",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "16px",
          fontWeight: 600,
          color: accent ? "var(--cyan)" : "var(--text-bright)",
          letterSpacing: "-0.02em",
        }}
        className={accent ? "shimmer-text" : ""}
      >
        {value}
      </div>
    </div>
  );
}

export function SwapPage() {
  const { address, isConnected } = useAccount();
  const [tokenIn, setTokenIn] = useState(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState(TOKENS[1]);
  const [amountInStr, setAmountInStr] = useState("");
  const [flipping, setFlipping] = useState(false);

  const amountIn = parse(amountInStr);
  const path: [`0x${string}`, `0x${string}`] = [tokenIn.address, tokenOut.address];

  const amountOut = useAmountsOut(amountIn, path);
  const { reserve0, reserve1, refetch: refetchReserves } = usePairReserves();

  const { data: balanceIn } = useReadContract({
    address: tokenIn.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });

  const approval = useTokenApproval(tokenIn.address, address, ROUTER_ADDRESS);
  const { swap, isPending, isConfirming, isSuccess, hash, error } = useSwap();

  useEffect(() => { if (approval.isSuccess) approval.refetch(); }, [approval.isSuccess]);
  useEffect(() => {
    if (isSuccess) { setAmountInStr(""); refetchReserves(); }
  }, [isSuccess]);

  const needsApproval = approval.allowance !== undefined && amountIn > 0n && approval.allowance < amountIn;

  function handleSwap() {
    if (!address || !amountOut) return;
    swap(amountIn, amountOut, [tokenIn.address, tokenOut.address], address);
  }

  function flipTokens() {
    setFlipping(true);
    setTimeout(() => {
      setTokenIn(tokenOut);
      setTokenOut(tokenIn);
      setAmountInStr("");
      setFlipping(false);
    }, 150);
  }

  const amountOutDisplay = amountOut ? (Number(amountOut) / 1e18).toFixed(6) : "";
  const price = reserve0 && reserve1 ? (Number(reserve1) / Number(reserve0)).toFixed(6) : "–";
  const tvl = reserve0 && reserve1
    ? "$" + ((Number(reserve0) + Number(reserve1)) / 1e18 * 1).toFixed(0)
    : "–";

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "40px 16px 60px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header */}
      <div className="animate-in" style={{ marginBottom: "8px" }}>
        <h1
          style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "28px",
            fontWeight: 900,
            color: "var(--text-bright)",
            letterSpacing: "0.1em",
          }}
        >
          SWAP <span style={{ color: "var(--cyan)" }}>TOKENS</span>
        </h1>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            color: "var(--text-dim)",
            letterSpacing: "0.1em",
            marginTop: "4px",
          }}
        >
          CONSTANT PRODUCT AMM · 0.3% FEE
        </p>
      </div>

      {/* Pool stats */}
      <div className="animate-in" style={{ display: "flex", gap: "1px" }}>
        <StatCard label="TALPHA/TBETA PRICE" value={price} accent />
        <StatCard label="POOL LIQUIDITY (est.)" value={tvl} />
        <StatCard
          label="RESERVE A"
          value={reserve0 ? (Number(reserve0) / 1e18).toFixed(2) : "–"}
        />
      </div>

      {/* Main swap card */}
      <div
        className="animate-in-delay corner-accent"
        style={{
          position: "relative",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Card label */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "24px",
            transform: "translateY(-50%)",
            background: "var(--surface)",
            padding: "0 8px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            color: "var(--text-dim)",
            letterSpacing: "0.2em",
          }}
        >
          TRADE_PANEL
        </div>

        {/* Token In */}
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <AmountInput
              label="YOU PAY"
              value={amountInStr}
              onChange={setAmountInStr}
              balance={balanceIn as bigint | undefined}
            />
          </div>
          <div style={{ minWidth: "120px" }}>
            <TokenSelector label="FROM" value={tokenIn} onChange={setTokenIn} exclude={tokenOut.address} />
          </div>
        </div>

        {/* Flip button */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={flipTokens}
            style={{
              width: "36px",
              height: "36px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--cyan)",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              transform: flipping ? "rotate(180deg)" : "rotate(0deg)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--cyan)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--cyan-glow)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            ⇅
          </button>
        </div>

        {/* Token Out */}
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <AmountInput
              label="YOU RECEIVE"
              value={amountOutDisplay}
              onChange={() => {}}
              readOnly
              highlight
            />
          </div>
          <div style={{ minWidth: "120px" }}>
            <TokenSelector label="TO" value={tokenOut} onChange={setTokenOut} exclude={tokenIn.address} />
          </div>
        </div>

        {/* Price info */}
        <PriceInfo
          amountIn={amountIn}
          amountOut={amountOut}
          symbolIn={tokenIn.symbol}
          symbolOut={tokenOut.symbol}
          reserve0={reserve0}
          reserve1={reserve1}
        />

        {/* Action */}
        {!isConnected ? (
          <div
            style={{
              textAlign: "center",
              padding: "14px",
              border: "1px solid var(--border)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: "var(--text-dim)",
              letterSpacing: "0.15em",
            }}
          >
            ◈ CONNECT WALLET TO TRADE
          </div>
        ) : needsApproval ? (
          <ActionButton
            onClick={() => approval.approve(amountIn)}
            disabled={approval.isPending || approval.isConfirming}
            loading={approval.isPending || approval.isConfirming}
            label={`APPROVE ${tokenIn.symbol}`}
            loadingLabel="APPROVING..."
            variant="secondary"
          />
        ) : (
          <ActionButton
            onClick={handleSwap}
            disabled={isPending || isConfirming || amountIn === 0n || !amountOut}
            loading={isPending || isConfirming}
            label="EXECUTE SWAP"
            loadingLabel={isPending ? "CONFIRM IN WALLET..." : "BROADCASTING..."}
            variant="primary"
          />
        )}

        <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} error={error} hash={hash} />
      </div>

      {/* Reserves panel */}
      <div
        className="animate-in-delay-2"
        style={{
          border: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            color: "var(--text-dim)",
            letterSpacing: "0.2em",
            marginBottom: "4px",
          }}
        >
          LIQUIDITY_POOL · LIVE RESERVES
        </div>
        {[
          { label: "TALPHA", value: reserve0 },
          { label: "TBETA", value: reserve1 },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  border: "1px solid var(--border)",
                  background: "var(--cyan-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "8px",
                  color: "var(--cyan)",
                  fontWeight: 700,
                }}
              >
                {label[0]}
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                  color: "var(--text)",
                  letterSpacing: "0.1em",
                }}
              >
                {label}
              </span>
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "14px",
                color: "var(--text-bright)",
                fontWeight: 500,
              }}
            >
              {value !== undefined ? (Number(value) / 1e18).toFixed(4) : "···"}
            </span>
          </div>
        ))}
        <div
          style={{
            height: "1px",
            background: `linear-gradient(90deg, var(--cyan), var(--purple), transparent)`,
            opacity: 0.3,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px",
              color: "var(--text-dim)",
              letterSpacing: "0.15em",
            }}
          >
            K INVARIANT
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              color: "var(--amber)",
            }}
          >
            {reserve0 && reserve1
              ? (Number(reserve0) / 1e18 * Number(reserve1) / 1e18).toExponential(4)
              : "···"}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  label: string;
  loadingLabel: string;
  variant: "primary" | "secondary";
}

function ActionButton({ onClick, disabled, loading, label, loadingLabel, variant }: ActionButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "16px",
        background: disabled
          ? "var(--surface-2)"
          : isPrimary
          ? "transparent"
          : "var(--purple-dim)",
        border: disabled
          ? "1px solid var(--border)"
          : isPrimary
          ? "1px solid var(--cyan)"
          : "1px solid var(--purple)",
        color: disabled
          ? "var(--text-dim)"
          : isPrimary
          ? "var(--cyan)"
          : "#c084fc",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "13px",
        fontWeight: 700,
        letterSpacing: "0.2em",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        animation: loading ? "pulseRing 2s infinite" : "none",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        const btn = e.currentTarget;
        btn.style.background = isPrimary ? "var(--cyan-dim)" : "var(--purple-dim)";
        btn.style.boxShadow = isPrimary ? "var(--cyan-glow)" : "0 0 20px rgba(123,47,255,0.4)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        const btn = e.currentTarget;
        btn.style.background = isPrimary ? "transparent" : "var(--purple-dim)";
        btn.style.boxShadow = "none";
      }}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
