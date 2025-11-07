// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./RentalAgreement.sol";

contract RentalAgreementFactory {
    address public admin;
    RentalAgreement[] public allAgreements;

    event AgreementCreated(address indexed agreement, address indexed owner, address indexed user);

    constructor() {
        admin = msg.sender; // Người deploy là Admin
    }

    function createAgreement(
        address _owner,
        address _user,
        address _token,
        uint256 _vehicleId,
        uint256 _rentAmount,
        uint256 _depositAmount
    ) external returns (address) {
        require(msg.sender == admin, "Only admin can create");

        RentalAgreement agreement = new RentalAgreement(
            admin,
            _owner,
            _user,
            _vehicleId,
            _rentAmount,
            _depositAmount,
            _token
        );

        allAgreements.push(agreement);
        emit AgreementCreated(address(agreement), _owner, _user);

        return address(agreement);
    }

    function getAllAgreements() external view returns (RentalAgreement[] memory) {
        return allAgreements;
    }
}
