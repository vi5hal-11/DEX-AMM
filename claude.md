# DEX AMM — Architecture Document

## 1. PROJECT OVERVIEW

A production-grade Uniswap V2–style Decentralized Exchange (DEX) with an Automated Market Maker (AMM).

**Core Features**
- Create liquidity pairs for any two ERC20 tokens
- Add / remove liquidity and receive LP tokens proportional to share
- Swap tokens using the constant product formula with 0.3% fee
- On-chain price discovery via reserve ratios
- Slippage protection and deadline enforcement

---

## 2. ARCHITECTURE

### Smart Contracts

```
Factory.sol
  └─ createPair(tokenA, tokenB) → Pair
  └─ getPair[tokenA][tokenB] mapping
  └─ allPairs[] array

Pair.sol  (IS-A ERC20 — LP token)
  └─ token0, token1, reserve0, reserve1
  └─ mint(to)   → issue LP shares
  └─ burn(to)   → redeem LP shares
  └─ swap(amount0Out, amount1Out, to)

Router.sol
  └─ addLiquidity(...)
  └─ removeLiquidity(...)
  └─ swapExactTokensForTokens(...)
  └─ getAmountsOut(amountIn, path[])
```

### Frontend (Vite + React + TypeScript)

```
Pages
  /swap       — SwapPage
  /liquidity  — LiquidityPage

Components
  Navbar
  ConnectButton
  TokenSelector
  AmountInput
  PriceInfo
  TxStatus

State (Wagmi hooks)
  useSwap
  useLiquidity
  useTokenApproval
  usePairReserves
```

---

## 3. CORE LOGIC

### Constant Product Formula
```
x * y = k
```
Reserve product `k` must remain constant after every swap (excluding fees).

### Swap Flow
1. User specifies `amountIn` of token A
2. Router calls `getAmountsOut` → computes `amountOut` with 0.3% fee:
   ```
   amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
   ```
3. Router transfers `amountIn` to Pair, calls `pair.swap(0, amountOut, user)`
4. Pair verifies post-swap k-invariant

### Add Liquidity Flow
1. First deposit: LP = sqrt(amountA * amountB) − MINIMUM_LIQUIDITY (locked forever)
2. Subsequent: LP = min(amountA/reserveA, amountB/reserveB) * totalSupply
3. LP tokens minted to provider

### Remove Liquidity Flow
1. Provider transfers LP tokens to Pair
2. Pair burns LP, sends proportional token0 + token1 back
3. Reserves updated via `_update()`

### LP Token Logic
- Pair contract IS an ERC20 (LP token)
- `MINIMUM_LIQUIDITY = 1000` locked to address(0) on first mint (prevents price manipulation)
- LP share = user_LP / totalSupply

---

## 4. DATA FLOW

```
User action (e.g. swap)
  → Frontend reads getAmountsOut (view call, no gas)
  → User approves Router to spend tokenIn (ERC20.approve)
  → Frontend calls Router.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline)
  → Router pulls tokenIn from user → sends to Pair
  → Pair executes swap → sends tokenOut to user
  → Pair emits Swap event → frontend updates reserves display
```

---

## 5. SECURITY CONSIDERATIONS

| Risk | Mitigation |
|------|-----------|
| Reentrancy | `ReentrancyGuard` on `mint`, `burn`, `swap` |
| Slippage | `amountOutMin` / `amountAMin` / `amountBMin` params; revert if not met |
| Front-running | Slippage tolerance (default 0.5%); deadline param |
| Flash loan manipulation | k-invariant checked AFTER balances update |
| Integer overflow | Solidity 0.8 built-in checked arithmetic |
| Zero-value inputs | Custom errors revert early |
| Unauthorized LP mint/burn | Only Pair itself calls mint/burn (internal flow) |
| MINIMUM_LIQUIDITY | 1000 wei LP locked to address(0) on first deposit |

---

## 6. DEVELOPMENT PLAN

| Step | Task |
|------|------|
| 1 | Project setup: Hardhat root + Vite+TS frontend, install deps |
| 2 | Write contracts: Factory → Pair → Router |
| 3 | Write Hardhat tests: Factory, Pair, Router (full coverage) |
| 4 | Deploy script: deploy all contracts, seed pool, write addresses + ABIs to frontend |
| 5 | Build frontend: pages, components, hooks with Wagmi |
| 6 | Integrate: wire hooks to contract ABIs + addresses |
| 7 | Final test: `npx hardhat test`, manual end-to-end on Sepolia |
