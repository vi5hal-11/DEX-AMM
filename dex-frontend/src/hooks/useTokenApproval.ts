import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import ERC20_ABI from "../contracts/abis/ERC20.json";

export function useTokenApproval(token: `0x${string}` | undefined, owner: `0x${string}` | undefined, spender: `0x${string}`) {
  const { data: allowance, refetch } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [owner!, spender],
    query: { enabled: !!token && !!owner },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function approve(amount: bigint) {
    if (!token) return;
    writeContract({ address: token, abi: ERC20_ABI, functionName: "approve", args: [spender, amount] });
  }

  return { allowance: allowance as bigint | undefined, approve, isPending, isConfirming, isSuccess, refetch };
}
