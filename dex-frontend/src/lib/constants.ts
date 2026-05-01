import addresses from "../contracts/addresses.json";

export const TOKENS = [
  { symbol: "TALPHA", address: addresses.tokenA as `0x${string}` },
  { symbol: "TBETA",  address: addresses.tokenB as `0x${string}` },
];

export const ROUTER_ADDRESS = addresses.router as `0x${string}`;
export const FACTORY_ADDRESS = addresses.factory as `0x${string}`;
export const PAIR_ADDRESS = addresses.pair as `0x${string}`;

export const MINIMUM_LIQUIDITY = 1000n;
export const DEFAULT_SLIPPAGE = 50n; // 0.5% in basis points (50/10000)
