import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import ROUTER_ABI from "../contracts/abis/Router.json";
import { ROUTER_ADDRESS, DEFAULT_SLIPPAGE } from "../lib/constants";
import { applySlippage } from "../lib/utils";

export function useAmountsOut(amountIn: bigint, path: [`0x${string}`, `0x${string}`] | undefined) {
  const { data } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: "getAmountsOut",
    args: [amountIn, path!],
    query: { enabled: !!path && amountIn > 0n },
  });
  return (data as bigint[] | undefined)?.[1];
}

export function useSwap() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function swap(amountIn: bigint, amountOut: bigint, path: `0x${string}`[], to: `0x${string}`) {
    const amountOutMin = applySlippage(amountOut, DEFAULT_SLIPPAGE);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
    writeContract({
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: "swapExactTokensForTokens",
      args: [amountIn, amountOutMin, path, to, deadline],
    });
  }

  return { swap, isPending, isConfirming, isSuccess, hash, error };
}
