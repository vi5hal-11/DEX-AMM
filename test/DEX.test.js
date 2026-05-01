const { expect } = require("chai");
const { ethers } = require("hardhat");

const MINIMUM_LIQUIDITY = 1000n;

async function deploy() {
  const [owner, alice, bob] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("TestToken");
  const tokenA = await Token.deploy("Token A", "TKA", ethers.parseEther("1000000"));
  const tokenB = await Token.deploy("Token B", "TKB", ethers.parseEther("1000000"));

  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();

  const Router = await ethers.getContractFactory("Router");
  const router = await Router.deploy(await factory.getAddress());

  return { owner, alice, bob, tokenA, tokenB, factory, router };
}

async function addLiquidity(router, tokenA, tokenB, amtA, amtB, to) {
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  await tokenA.approve(await router.getAddress(), amtA);
  await tokenB.approve(await router.getAddress(), amtB);
  return router.addLiquidity(
    await tokenA.getAddress(),
    await tokenB.getAddress(),
    amtA, amtB, 0n, 0n, to, deadline
  );
}

// ─── Factory ─────────────────────────────────────────────────────────────────

describe("Factory", () => {
  it("creates a pair and emits PairCreated", async () => {
    const { factory, tokenA, tokenB } = await deploy();
    const tx = await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());
    const receipt = await tx.wait();
    const event = receipt.logs.find(l => l.fragment?.name === "PairCreated");
    expect(event).to.exist;
    expect(await factory.allPairsLength()).to.equal(1n);
  });

  it("stores pair symmetrically", async () => {
    const { factory, tokenA, tokenB } = await deploy();
    await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());
    const p1 = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
    const p2 = await factory.getPair(await tokenB.getAddress(), await tokenA.getAddress());
    expect(p1).to.equal(p2);
    expect(p1).to.not.equal(ethers.ZeroAddress);
  });

  it("reverts on identical token addresses", async () => {
    const { factory, tokenA } = await deploy();
    await expect(
      factory.createPair(await tokenA.getAddress(), await tokenA.getAddress())
    ).to.be.revertedWithCustomError(factory, "IdenticalAddresses");
  });

  it("reverts on zero address", async () => {
    const { factory, tokenA } = await deploy();
    await expect(
      factory.createPair(ethers.ZeroAddress, await tokenA.getAddress())
    ).to.be.revertedWithCustomError(factory, "ZeroAddress");
  });

  it("reverts on duplicate pair", async () => {
    const { factory, tokenA, tokenB } = await deploy();
    await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());
    await expect(
      factory.createPair(await tokenA.getAddress(), await tokenB.getAddress())
    ).to.be.revertedWithCustomError(factory, "PairExists");
  });
});

// ─── Pair ─────────────────────────────────────────────────────────────────────

describe("Pair", () => {
  async function deployWithPair() {
    const ctx = await deploy();
    const { factory, tokenA, tokenB, owner } = ctx;
    await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());
    const pairAddr = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
    const pair = await ethers.getContractAt("Pair", pairAddr);
    return { ...ctx, pair };
  }

  it("initial mint: LP = sqrt(x*y) - MINIMUM_LIQUIDITY", async () => {
    const { pair, tokenA, tokenB, owner } = await deployWithPair();
    const amtA = ethers.parseEther("100");
    const amtB = ethers.parseEther("400");

    await tokenA.transfer(await pair.getAddress(), amtA);
    await tokenB.transfer(await pair.getAddress(), amtB);
    await pair.mint(owner.address);

    const expected = BigInt(Math.floor(Math.sqrt(Number(amtA) * Number(amtB)))) - MINIMUM_LIQUIDITY;
    const lp = await pair.balanceOf(owner.address);
    // Allow ±1 for integer sqrt rounding
    expect(lp).to.be.closeTo(expected, 1n);
  });

  it("subsequent mint: proportional LP", async () => {
    const { pair, tokenA, tokenB, owner, alice } = await deployWithPair();
    const amt = ethers.parseEther("100");

    await tokenA.transfer(await pair.getAddress(), amt);
    await tokenB.transfer(await pair.getAddress(), amt);
    await pair.mint(owner.address);

    const lp1 = await pair.balanceOf(owner.address);

    await tokenA.transfer(await pair.getAddress(), amt);
    await tokenB.transfer(await pair.getAddress(), amt);
    await pair.mint(alice.address);

    const lp2 = await pair.balanceOf(alice.address);
    // second deposit same ratio → ~same LP (first deposit loses MINIMUM_LIQUIDITY to dead address)
    expect(lp2).to.be.closeTo(lp1, MINIMUM_LIQUIDITY + 1n);
  });

  it("burn returns proportional tokens", async () => {
    const { pair, tokenA, tokenB, owner } = await deployWithPair();
    const amt = ethers.parseEther("100");

    await tokenA.transfer(await pair.getAddress(), amt);
    await tokenB.transfer(await pair.getAddress(), amt);
    await pair.mint(owner.address);

    const lp = await pair.balanceOf(owner.address);
    await pair.transfer(await pair.getAddress(), lp);
    const [a0, a1] = await pair.burn.staticCall(owner.address);

    expect(a0).to.be.gt(0n);
    expect(a1).to.be.gt(0n);
    expect(a0).to.be.closeTo(amt, ethers.parseEther("0.001"));
  });

  it("swap maintains k-invariant", async () => {
    const { pair, tokenA, tokenB, owner } = await deployWithPair();
    const amt = ethers.parseEther("1000");

    await tokenA.transfer(await pair.getAddress(), amt);
    await tokenB.transfer(await pair.getAddress(), amt);
    await pair.mint(owner.address);

    const [r0before, r1before] = await pair.getReserves();

    const amtIn = ethers.parseEther("10");
    await tokenA.transfer(await pair.getAddress(), amtIn);
    await pair.swap(0n, ethers.parseEther("9"), owner.address);

    const [r0after, r1after] = await pair.getReserves();
    // k after should be >= k before (fees accumulate)
    expect(r0after * r1after).to.be.gte(r0before * r1before);
  });

  it("swap reverts when k would decrease", async () => {
    const { pair, tokenA, tokenB, owner } = await deployWithPair();
    const amt = ethers.parseEther("1000");

    await tokenA.transfer(await pair.getAddress(), amt);
    await tokenB.transfer(await pair.getAddress(), amt);
    await pair.mint(owner.address);

    // Try to take more out than the math allows
    await tokenA.transfer(await pair.getAddress(), ethers.parseEther("1"));
    // 999 < reserve of 1000, passes the liquidity check but fails k-invariant
    await expect(
      pair.swap(0n, ethers.parseEther("999"), owner.address)
    ).to.be.revertedWithCustomError(pair, "InvalidK");
  });

  it("swap reverts with zero output", async () => {
    const { pair } = await deployWithPair();
    await expect(pair.swap(0n, 0n, ethers.ZeroAddress))
      .to.be.revertedWithCustomError(pair, "InsufficientOutputAmount");
  });
});

// ─── Router ───────────────────────────────────────────────────────────────────

describe("Router", () => {
  it("addLiquidity creates pair and mints LP to user", async () => {
    const { router, tokenA, tokenB, factory, owner } = await deploy();
    await addLiquidity(router, tokenA, tokenB, ethers.parseEther("100"), ethers.parseEther("200"), owner.address);

    const pairAddr = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
    const pair = await ethers.getContractAt("Pair", pairAddr);
    expect(await pair.balanceOf(owner.address)).to.be.gt(0n);
  });

  it("addLiquidity subsequent deposit respects ratio", async () => {
    const { router, tokenA, tokenB, factory, owner, alice } = await deploy();
    await addLiquidity(router, tokenA, tokenB, ethers.parseEther("100"), ethers.parseEther("100"), owner.address);

    // Alice provides double in correct ratio
    await tokenA.transfer(alice.address, ethers.parseEther("200"));
    await tokenB.transfer(alice.address, ethers.parseEther("200"));
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    await tokenA.connect(alice).approve(await router.getAddress(), ethers.parseEther("200"));
    await tokenB.connect(alice).approve(await router.getAddress(), ethers.parseEther("200"));
    await router.connect(alice).addLiquidity(
      await tokenA.getAddress(), await tokenB.getAddress(),
      ethers.parseEther("200"), ethers.parseEther("200"), 0n, 0n, alice.address, deadline
    );

    const pairAddr = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
    const pair = await ethers.getContractAt("Pair", pairAddr);
    expect(await pair.balanceOf(alice.address)).to.be.gt(0n);
  });

  it("removeLiquidity returns tokens to user", async () => {
    const { router, tokenA, tokenB, factory, owner } = await deploy();
    await addLiquidity(router, tokenA, tokenB, ethers.parseEther("100"), ethers.parseEther("100"), owner.address);

    const pairAddr = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
    const pair = await ethers.getContractAt("Pair", pairAddr);
    const lp = await pair.balanceOf(owner.address);

    const deadline = Math.floor(Date.now() / 1000) + 3600;
    await pair.approve(await router.getAddress(), lp);
    const balBefore = await tokenA.balanceOf(owner.address);
    await router.removeLiquidity(
      await tokenA.getAddress(), await tokenB.getAddress(),
      lp, 0n, 0n, owner.address, deadline
    );
    const balAfter = await tokenA.balanceOf(owner.address);
    expect(balAfter).to.be.gt(balBefore);
  });

  it("swapExactTokensForTokens executes correctly", async () => {
    const { router, tokenA, tokenB, owner } = await deploy();
    await addLiquidity(router, tokenA, tokenB, ethers.parseEther("1000"), ethers.parseEther("1000"), owner.address);

    const amtIn = ethers.parseEther("10");
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    await tokenA.approve(await router.getAddress(), amtIn);

    const balBefore = await tokenB.balanceOf(owner.address);
    await router.swapExactTokensForTokens(
      amtIn, 0n,
      [await tokenA.getAddress(), await tokenB.getAddress()],
      owner.address, deadline
    );
    const balAfter = await tokenB.balanceOf(owner.address);
    expect(balAfter).to.be.gt(balBefore);
  });

  it("swap reverts when amountOutMin not met", async () => {
    const { router, tokenA, tokenB, owner } = await deploy();
    await addLiquidity(router, tokenA, tokenB, ethers.parseEther("1000"), ethers.parseEther("1000"), owner.address);

    const amtIn = ethers.parseEther("10");
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    await tokenA.approve(await router.getAddress(), amtIn);

    await expect(
      router.swapExactTokensForTokens(
        amtIn, ethers.parseEther("100"), // impossibly high min out
        [await tokenA.getAddress(), await tokenB.getAddress()],
        owner.address, deadline
      )
    ).to.be.revertedWithCustomError(router, "InsufficientOutputAmount");
  });

  it("swap reverts after deadline", async () => {
    const { router, tokenA, tokenB, owner } = await deploy();
    await addLiquidity(router, tokenA, tokenB, ethers.parseEther("100"), ethers.parseEther("100"), owner.address);

    const amtIn = ethers.parseEther("1");
    const pastDeadline = Math.floor(Date.now() / 1000) - 1;
    await tokenA.approve(await router.getAddress(), amtIn);

    await expect(
      router.swapExactTokensForTokens(
        amtIn, 0n,
        [await tokenA.getAddress(), await tokenB.getAddress()],
        owner.address, pastDeadline
      )
    ).to.be.revertedWithCustomError(router, "Expired");
  });

  it("getAmountsOut returns correct multi-hop amounts", async () => {
    const { router, tokenA, tokenB, owner } = await deploy();
    await addLiquidity(router, tokenA, tokenB, ethers.parseEther("1000"), ethers.parseEther("1000"), owner.address);

    const amtIn = ethers.parseEther("10");
    const amounts = await router.getAmountsOut(amtIn, [await tokenA.getAddress(), await tokenB.getAddress()]);
    expect(amounts[0]).to.equal(amtIn);
    expect(amounts[1]).to.be.gt(0n);
    expect(amounts[1]).to.be.lt(amtIn); // fee means output < input for equal pool
  });
});
