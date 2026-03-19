const { ethers } = require("hardhat");

async function main() {
  const Token = await ethers.getContractFactory("TestToken");

  const tokenA = await Token.deploy(
    "TokenA",
    "TKA",
    ethers.parseEther("100000"),
  );
  await tokenA.waitForDeployment();

  const tokenB = await Token.deploy(
    "TokenB",
    "TKB",
    ethers.parseEther("100000"),
  );
  await tokenB.waitForDeployment();

  console.log("TokenA:", await tokenA.getAddress());
  console.log("TokenB:", await tokenB.getAddress());

  const AMM = await ethers.getContractFactory("AMM");

  const amm = await AMM.deploy(
    await tokenA.getAddress(),
    await tokenB.getAddress(),
  );

  await amm.waitForDeployment();

  console.log("AMM:", await amm.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
