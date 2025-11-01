// Tạo hợp đồng mới 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./RentalAgreement.sol";

contract RentalAgreementFactory {
    RentalAgreement[] public allAgreements;

    event AgreementCreated(address indexed agreement, address indexed owner, address indexed user);

    function createAgreement(
        address _user,
        address _token,
        uint256 _rentAmount,
        uint256 _deposit,
        string memory _ipfsHash
    ) external {
        RentalAgreement agreement = new RentalAgreement(
            msg.sender,
            _renter,
            _token,
            _rentAmount,
            _deposit,
            _ipfsHash
        );

        allAgreements.push(agreement);
        emit AgreementCreated(address(agreement), msg.sender, _renter);
    }

    function getAllAgreements() external view returns (RentalAgreement[] memory) {
        return allAgreements;
    }
}
