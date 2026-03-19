// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LPToken.sol";

contract AMM {

    IERC20 public tokenA;
    IERC20 public tokenB;

    uint256 public reserveA;
    uint256 public reserveB;

    LPToken public lpToken;

    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);

        lpToken = new LPToken();
    }

    function _updateReserves() private {
        reserveA = tokenA.balanceOf(address(this));
        reserveB = tokenB.balanceOf(address(this));
    }

    // ADD LIQUIDITY
    function addLiquidity(uint256 amountA, uint256 amountB) public {

        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        uint256 liquidity = amountA + amountB;

        lpToken.mint(msg.sender, liquidity);

        _updateReserves();
    }

    // REMOVE LIQUIDITY
    function removeLiquidity(uint256 liquidity) public {

        uint256 totalSupply = lpToken.totalSupply();

        uint256 amountA = (liquidity * reserveA) / totalSupply;
        uint256 amountB = (liquidity * reserveB) / totalSupply;

        lpToken.burn(msg.sender, liquidity);

        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);

        _updateReserves();
    }

    // AMM FORMULA
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    )
        public
        pure
        returns (uint256)
    {
        uint256 amountInWithFee = amountIn * 997;

        uint256 numerator = amountInWithFee * reserveOut;

        uint256 denominator = (reserveIn * 1000) + amountInWithFee;

        return numerator / denominator;
    }

    // SWAP TOKEN A → TOKEN B
    function swapAforB(uint256 amountAIn) public {

        require(amountAIn > 0, "Invalid amount");

        uint256 amountBOut = getAmountOut(amountAIn, reserveA, reserveB);

        tokenA.transferFrom(msg.sender, address(this), amountAIn);

        tokenB.transfer(msg.sender, amountBOut);

        _updateReserves();
    }

    // SWAP TOKEN B → TOKEN A
    function swapBforA(uint256 amountBIn) public {

        require(amountBIn > 0, "Invalid amount");

        uint256 amountAOut = getAmountOut(amountBIn, reserveB, reserveA);

        tokenB.transferFrom(msg.sender, address(this), amountBIn);

        tokenA.transfer(msg.sender, amountAOut);

        _updateReserves();
    }
}