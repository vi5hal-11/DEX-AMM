import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import ROUTER_ABI from "../contracts/abis/Router.json";
import { ROUTER_ADDRESS, DEFAULT_SLIPPAGE } from "../lib/constants";
import { applySlippage } from "../lib/utils";

export function useAddLiquidity() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function addLiquidity(
    tokenA: `0x${string}`,
    tokenB: `0x${string}`,
    amountADesired: bigint,
    amountBDesired: bigint,
    to: `0x${string}`
  ) {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
    writeContract({
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: "addLiquidity",
      args: [
        tokenA, tokenB,
        amountADesired, amountBDesired,
        applySlippage(amountADesired, DEFAULT_SLIPPAGE),
        applySlippage(amountBDesired, DEFAULT_SLIPPAGE),
        to,
        deadline,
      ],
    });
  }

  return { addLiquidity, isPending, isConfirming, isSuccess, error };
}

export function useRemoveLiquidity() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function removeLiquidity(
    tokenA: `0x${string}`,
    tokenB: `0x${string}`,
    liquidity: bigint,
    to: `0x${string}`
  ) {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
    writeContract({
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: "removeLiquidity",
      args: [tokenA, tokenB, liquidity, 0n, 0n, to, deadline],
    });
  }

  return { removeLiquidity, isPending, isConfirming, isSuccess, error };
}
