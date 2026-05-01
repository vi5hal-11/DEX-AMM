import { useReadContract } from "wagmi";
import PAIR_ABI from "../contracts/abis/Pair.json";
import { PAIR_ADDRESS } from "../lib/constants";

export function usePairReserves() {
  const { data, refetch } = useReadContract({
    address: PAIR_ADDRESS,
    abi: PAIR_ABI,
    functionName: "getReserves",
  });

  const reserves = data as [bigint, bigint, number] | undefined;

  return {
    reserve0: reserves?.[0],
    reserve1: reserves?.[1],
    refetch,
  };
}
