const { ethers, artifacts } = require("hardhat");
const fs = require("fs");
const path = require("path");

const FRONTEND_CONTRACTS_DIR = path.join(__dirname, "../dex-frontend/src/contracts");
const ABI_DIR = path.join(FRONTEND_CONTRACTS_DIR, "abis");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ── Contracts ────────────────────────────────────────────────────────────

  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  console.log("Factory:  ", await factory.getAddress());

  const Router = await ethers.getContractFactory("Router");
  const router = await Router.deploy(await factory.getAddress());
  await router.waitForDeployment();
  console.log("Router:   ", await router.getAddress());

  const Token = await ethers.getContractFactory("TestToken");
  const tokenA = await Token.deploy("Token Alpha", "TALPHA", ethers.parseEther("1000000"));
  await tokenA.waitForDeployment();
  console.log("TokenA:   ", await tokenA.getAddress());

  const tokenB = await Token.deploy("Token Beta", "TBETA", ethers.parseEther("1000000"));
  await tokenB.waitForDeployment();
  console.log("TokenB:   ", await tokenB.getAddress());

  // ── Seed initial liquidity pool ──────────────────────────────────────────

  const amtA = ethers.parseEther("10000");
  const amtB = ethers.parseEther("10000");
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  await tokenA.approve(await router.getAddress(), amtA);
  await tokenB.approve(await router.getAddress(), amtB);
  await router.addLiquidity(
    await tokenA.getAddress(),
    await tokenB.getAddress(),
    amtA, amtB, 0n, 0n,
    deployer.address,
    deadline
  );

  const pairAddr = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
  console.log("\nPair:     ", pairAddr);
  console.log("Pool seeded with 10,000 TALPHA + 10,000 TBETA");

  // ── Write addresses + ABIs to frontend ──────────────────────────────────

  fs.mkdirSync(ABI_DIR, { recursive: true });

  const addresses = {
    factory: await factory.getAddress(),
    router: await router.getAddress(),
    tokenA: await tokenA.getAddress(),
    tokenB: await tokenB.getAddress(),
    pair: pairAddr,
  };
  fs.writeFileSync(
    path.join(FRONTEND_CONTRACTS_DIR, "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );

  for (const name of ["Factory", "Pair", "Router", "TestToken"]) {
    const artifact = await artifacts.readArtifact(name);
    fs.writeFileSync(path.join(ABI_DIR, `${name}.json`), JSON.stringify(artifact.abi, null, 2));
  }

  const erc20Abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  ];
  fs.writeFileSync(path.join(ABI_DIR, "ERC20.json"), JSON.stringify(erc20Abi, null, 2));

  console.log("\nAddresses → dex-frontend/src/contracts/addresses.json");
  console.log("ABIs      → dex-frontend/src/contracts/abis/");
}

main().catch((err) => { console.error(err); process.exit(1); });
