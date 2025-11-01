// Chi tiết hợp đồng con 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RentalAgreement {
    address public owner;
    address public renter;
    IERC20 public token;
    uint256 public rentAmount;
    uint256 public deposit;
    bool public isSignedByOwner;
    bool public isSignedByRenter;
    bool public isActive;
    string public ipfsHash; // lưu hợp đồng bản PDF hoặc metadata IPFS

    constructor(
        address _owner,
        address _renter,
        address _token,
        uint256 _rentAmount,
        uint256 _deposit,
        string memory _ipfsHash
    ) {
        owner = _owner;
        renter = _renter;
        token = IERC20(_token);
        rentAmount = _rentAmount;
        deposit = _deposit;
        ipfsHash = _ipfsHash;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyRenter() {
        require(msg.sender == renter, "Only renter");
        _;
    }

    function signAsOwner() external onlyOwner {
        isSignedByOwner = true;
    }

    function signAsRenter() external onlyRenter {
        isSignedByRenter = true;
    }

    function activateContract() external {
        require(isSignedByOwner && isSignedByRenter, "Both must sign");
        isActive = true;
    }

    function payRent() external onlyRenter {
        require(isActive, "Not active");
        token.transferFrom(renter, owner, rentAmount);
    }

    function cancelContract() external {
        require(msg.sender == owner || msg.sender == renter, "Unauthorized");
        isActive = false;
    }

    function completeContract() external onlyOwner {
        isActive = false;
        token.transfer(renter, deposit);
    }
}
