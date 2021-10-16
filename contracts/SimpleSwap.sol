// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SimpleSwap is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    uint16 public rate;
    uint16 public feePercent;
    IERC20 public tokenA;
    IERC20 public tokenB;

    enum OwnerActions {Withdraw, ChangeFee, ChangeTokenA, ChangeTokenB}

    event LogOwnerAction(OwnerActions action, uint256 value);
    event LogSwap(address user, uint256 tokenA, uint256 tokenB);
    
    /**
    * @notice Simple Swap one way only. User purchase token A in order to get token B.
    * @dev both {_tokenA} and {_tokenB} are addresses to the ERC20 tokens.
    * @param _tokenA user sending token address
    * @param _tokenB user receiving token address
    * @param _rate how many tokenB will be provided for tokenA in Milli (0.001)
    * @param _feePercent fee for swapping; mesuring in deci percent (0.1%) or just Milli (0.1% ~ 0.001)
    */
    constructor(IERC20 _tokenA, IERC20 _tokenB, uint16 _rate, uint16 _feePercent) {
        tokenA = _tokenA;
        tokenB = _tokenB;
        rate = _rate;
        feePercent = _feePercent;
    }

    /**
    * @notice Withdrawing token from SimpleSwap contract
    * @dev Only contract owner can call this function. 
    * @param _token address of the token
    * @param _amount of token to withraw
    */
    function withdraw(IERC20 _token, uint256 _amount) external onlyOwner {
        _token.transfer(msg.sender, _amount);
        emit LogOwnerAction(OwnerActions(0), _amount);
    }

    /**
    * @notice Setting Fee percentage.
    * @dev Only contract owner can call this function. 
    * @param _percent number between 1 and 100
    */
    function setFeePercent(uint16 _percent) external onlyOwner {
        feePercent = _percent;
        emit LogOwnerAction(OwnerActions(1), uint256(_percent));
    }

    /**
    * @notice Setting token A address.
    * @dev Only contract owner can call this function. 
    * @param _token address
    */
    function setTokenA(IERC20 _token) external onlyOwner {
        tokenA = _token;
    }

    /**
    * @notice Setting token B address.
    * @dev Only contract owner can call this function. 
    * @param _token address
    */
    function setTokenB(IERC20 _token) external onlyOwner {
        tokenB = _token;
    }

    /**
    * @notice Setting exchange rate.
    * @dev Only contract owner can call this function. 
    * @param _rate how many tokenB will be provided for tokenA
    */
    function setRate(uint16 _rate) external onlyOwner {
        rate = _rate;
    }

    /**
    * @notice Allows to swap token A to token B
    * @dev Swap holding some fee in every exchange operations. It can be withdrawn by the owner 
    * of this contrac.
    * @param _tokenAmount token A amount
    */
    function swap(uint256 _tokenAmount) external nonReentrant {
        uint256 transferTokenAmount = _tokenAmount * (1000 - feePercent) * rate / 1000000;

        require(transferTokenAmount <= tokenB.balanceOf(address(this)), "Not enough token in our contract");
        
        tokenA.transferFrom(msg.sender, address(this), _tokenAmount);
        tokenB.transfer(msg.sender, transferTokenAmount);
        emit LogSwap(msg.sender, _tokenAmount, transferTokenAmount);   
    }

}