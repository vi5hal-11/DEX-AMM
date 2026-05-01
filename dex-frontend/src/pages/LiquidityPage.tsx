import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { TOKENS, ROUTER_ADDRESS, PAIR_ADDRESS } from "../lib/constants";
import { parse } from "../lib/utils";
import { useAddLiquidity, useRemoveLiquidity } from "../hooks/useLiquidity";
import { useTokenApproval } from "../hooks/useTokenApproval";
import { usePairReserves } from "../hooks/usePairReserves";
import { AmountInput } from "../components/AmountInput";
import { TxStatus } from "../components/TxStatus";
import ERC20_ABI from "../contracts/abis/ERC20.json";
import PAIR_ABI from "../contracts/abis/Pair.json";

export function LiquidityPage() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<"add" | "remove">("add");

  const tokenA = TOKENS[0];
  const tokenB = TOKENS[1];

  const [amtAStr, setAmtAStr] = useState("");
  const [amtBStr, setAmtBStr] = useState("");
  const [lpStr, setLpStr] = useState("");

  const amtA = parse(amtAStr);
  const amtB = parse(amtBStr);
  const lpAmount = parse(lpStr);

  const { reserve0, reserve1, refetch: refetchReserves } = usePairReserves();

  const { data: balA } = useReadContract({ address: tokenA.address, abi: ERC20_ABI, functionName: "balanceOf", args: [address!], query: { enabled: !!address } });
  const { data: balB } = useReadContract({ address: tokenB.address, abi: ERC20_ABI, functionName: "balanceOf", args: [address!], query: { enabled: !!address } });
  const { data: lpBalance } = useReadContract({ address: PAIR_ADDRESS, abi: PAIR_ABI, functionName: "balanceOf", args: [address!], query: { enabled: !!address } });
  const { data: lpTotal } = useReadContract({ address: PAIR_ADDRESS, abi: PAIR_ABI, functionName: "totalSupply", query: { enabled: true } });

  const approvalA = useTokenApproval(tokenA.address, address, ROUTER_ADDRESS);
  const approvalB = useTokenApproval(tokenB.address, address, ROUTER_ADDRESS);
  const approvalLP = useTokenApproval(PAIR_ADDRESS, address, ROUTER_ADDRESS);

  const { addLiquidity: _addLiquidity, isPending: addPending, isConfirming: addConfirming, isSuccess: addSuccess, error: addError } = useAddLiquidity();
  const { removeLiquidity: _removeLiquidity, isPending: remPending, isConfirming: remConfirming, isSuccess: remSuccess, error: remError } = useRemoveLiquidity();

  useEffect(() => {
    if (addSuccess || remSuccess) { setAmtAStr(""); setAmtBStr(""); setLpStr(""); refetchReserves(); }
  }, [addSuccess, remSuccess]);

  function handleAmtAChange(v: string) {
    setAmtAStr(v);
    if (reserve0 && reserve1 && reserve0 > 0n) {
      const a = parse(v);
      if (a > 0n) setAmtBStr(formatUnits((a * reserve1) / reserve0, 18));
    }
  }

  const needsApprovalA = approvalA.allowance !== undefined && amtA > 0n && approvalA.allowance < amtA;
  const needsApprovalB = approvalB.allowance !== undefined && amtB > 0n && approvalB.allowance < amtB;
  const needsApprovalLP = approvalLP.allowance !== undefined && lpAmount > 0n && approvalLP.allowance < lpAmount;

  const lpBal = lpBalance as bigint | undefined;
  const lpTot = lpTotal as bigint | undefined;
  const sharePercent = lpBal && lpTot && lpTot > 0n
    ? ((Number(lpBal) / Number(lpTot)) * 100).toFixed(4)
    : "0.0000";

  const estA = lpBal && lpTot && reserve0 && lpAmount > 0n && lpTot > 0n
    ? (lpAmount * reserve0) / lpTot : undefined;
  const estB = lpBal && lpTot && reserve1 && lpAmount > 0n && lpTot > 0n
    ? (lpAmount * reserve1) / lpTot : undefined;

  return (
    <div
      style={{
        maxWidth: "520px",
        margin: "0 auto",
        padding: "40px 16px 60px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header */}
      <div className="animate-in">
        <h1
          style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "28px",
            fontWeight: 900,
            color: "var(--text-bright)",
            letterSpacing: "0.1em",
          }}
        >
          LIQUIDITY <span style={{ color: "var(--purple)" }}>POOL</span>
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
          PROVIDE LIQUIDITY · EARN 0.3% SWAP FEES
        </p>
      </div>

      {/* Position summary */}
      <div
        className="animate-in"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "1px",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {[
          { label: "YOUR LP TOKENS", value: lpBal ? (Number(lpBal) / 1e18).toFixed(6) : "0.000000", accent: true },
          { label: "POOL SHARE", value: `${sharePercent}%`, accent: false },
          { label: "TOTAL LP SUPPLY", value: lpTot ? (Number(lpTot) / 1e18).toFixed(2) : "–", accent: false },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            style={{
              padding: "14px 16px",
              background: "var(--surface)",
              borderTop: `2px solid ${accent ? "#7b2fff" : "var(--border)"}`,
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.2em", marginBottom: "6px" }}>
              {label}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "14px",
                fontWeight: 600,
                color: accent ? "#c084fc" : "var(--text-bright)",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div
        className="animate-in-delay"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {(["add", "remove"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "12px",
              background: tab === t ? (t === "add" ? "var(--purple-dim)" : "rgba(255,69,69,0.08)") : "var(--surface)",
              border: "none",
              borderBottom: `2px solid ${tab === t ? (t === "add" ? "var(--purple)" : "var(--red)") : "transparent"}`,
              color: tab === t ? (t === "add" ? "#c084fc" : "var(--red)") : "var(--text-dim)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t === "add" ? "+ ADD LIQUIDITY" : "− REMOVE LIQUIDITY"}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div
        className="animate-in-delay corner-accent"
        style={{
          position: "relative",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderTop: `2px solid ${tab === "add" ? "var(--purple)" : "var(--red)"}`,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
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
          {tab === "add" ? "DEPOSIT_PANEL" : "WITHDRAW_PANEL"}
        </div>

        {tab === "add" ? (
          <>
            <AmountInput
              label={`${tokenA.symbol} AMOUNT`}
              value={amtAStr}
              onChange={handleAmtAChange}
              balance={balA as bigint | undefined}
            />
            <AmountInput
              label={`${tokenB.symbol} AMOUNT`}
              value={amtBStr}
              onChange={setAmtBStr}
              balance={balB as bigint | undefined}
              highlight
            />

            {/* Ratio indicator */}
            {reserve0 && reserve1 && reserve0 > 0n && (
              <div
                style={{
                  padding: "10px 14px",
                  border: "1px solid var(--border)",
                  borderLeft: "2px solid var(--purple)",
                  background: "var(--purple-dim)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "#c084fc",
                  letterSpacing: "0.05em",
                }}
              >
                POOL RATIO: 1 {tokenA.symbol} = {(Number(reserve1) / Number(reserve0)).toFixed(6)} {tokenB.symbol}
              </div>
            )}

            {!isConnected ? (
              <NotConnected />
            ) : needsApprovalA ? (
              <LiqButton onClick={() => approvalA.approve(amtA)} loading={approvalA.isPending || approvalA.isConfirming} label={`APPROVE ${tokenA.symbol}`} color="var(--purple)" />
            ) : needsApprovalB ? (
              <LiqButton onClick={() => approvalB.approve(amtB)} loading={approvalB.isPending || approvalB.isConfirming} label={`APPROVE ${tokenB.symbol}`} color="var(--purple)" />
            ) : (
              <LiqButton
                onClick={() => { if (address) _addLiquidity(tokenA.address, tokenB.address, amtA, amtB, address); }}
                loading={addPending || addConfirming}
                label="DEPOSIT LIQUIDITY"
                disabled={addPending || addConfirming || amtA === 0n || amtB === 0n}
                color="var(--purple)"
              />
            )}
            <TxStatus isPending={addPending} isConfirming={addConfirming} isSuccess={addSuccess} error={addError} />
          </>
        ) : (
          <>
            <AmountInput
              label="LP TOKEN AMOUNT"
              value={lpStr}
              onChange={setLpStr}
              balance={lpBal}
            />

            {/* Estimated output */}
            {estA !== undefined && estB !== undefined && (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderLeft: "2px solid var(--red)",
                  background: "rgba(255,69,69,0.04)",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
                className="animate-in"
              >
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.2em" }}>
                  ESTIMATED WITHDRAWAL
                </div>
                {[
                  { label: tokenA.symbol, value: estA },
                  { label: tokenB.symbol, value: estB },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--text-dim)" }}>{label}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "var(--red)", fontWeight: 600 }}>
                      {(Number(value) / 1e18).toFixed(6)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!isConnected ? (
              <NotConnected />
            ) : needsApprovalLP ? (
              <LiqButton onClick={() => approvalLP.approve(lpAmount)} loading={approvalLP.isPending || approvalLP.isConfirming} label="APPROVE LP TOKEN" color="var(--red)" />
            ) : (
              <LiqButton
                onClick={() => { if (address) _removeLiquidity(tokenA.address, tokenB.address, lpAmount, address); }}
                loading={remPending || remConfirming}
                label="WITHDRAW LIQUIDITY"
                disabled={remPending || remConfirming || lpAmount === 0n || !address}
                color="var(--red)"
              />
            )}
            <TxStatus isPending={remPending} isConfirming={remConfirming} isSuccess={remSuccess} error={remError} />
          </>
        )}
      </div>

      {/* Pool reserves */}
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
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.2em" }}>
          POOL_STATE · LIVE DATA
        </div>
        {[
          { label: "TALPHA RESERVE", value: reserve0 },
          { label: "TBETA RESERVE", value: reserve1 },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.1em" }}>{label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  height: "4px",
                  width: `${value ? Math.min(60, Math.round(Number(value) / 1e20)) : 0}px`,
                  background: "linear-gradient(90deg, var(--cyan), var(--purple))",
                  transition: "width 0.5s ease",
                }}
              />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "var(--text-bright)", fontWeight: 500 }}>
                {value !== undefined ? (Number(value) / 1e18).toFixed(4) : "···"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotConnected() {
  return (
    <div style={{
      textAlign: "center",
      padding: "14px",
      border: "1px solid var(--border)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "11px",
      color: "var(--text-dim)",
      letterSpacing: "0.15em",
    }}>
      ◈ CONNECT WALLET TO CONTINUE
    </div>
  );
}

interface LiqButtonProps {
  onClick: () => void;
  loading: boolean;
  label: string;
  disabled?: boolean;
  color: string;
}

function LiqButton({ onClick, loading, label, disabled = false, color }: LiqButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        width: "100%",
        padding: "16px",
        background: isDisabled ? "var(--surface-2)" : "transparent",
        border: `1px solid ${isDisabled ? "var(--border)" : color}`,
        color: isDisabled ? "var(--text-dim)" : color,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "13px",
        fontWeight: 700,
        letterSpacing: "0.2em",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (isDisabled) return;
        (e.currentTarget as HTMLButtonElement).style.background = `${color}15`;
        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${color}40`;
      }}
      onMouseLeave={(e) => {
        if (isDisabled) return;
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      {loading ? "PROCESSING..." : label}
    </button>
  );
}
