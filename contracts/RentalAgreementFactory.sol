// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./RentalAgreement.sol";

contract RentalAgreementFactory {
    address public admin;  // quản trị hệ thống
    RentalAgreement[] public allAgreements;

    event AgreementCreated(address indexed agreement, address indexed owner, address indexed user);

    constructor() {
        admin = msg.sender; // admin là người deploy factory
    }

    // ✅ Owner tạo hợp đồng mới với User
    function createAgreement(
        address _user,
        address _token,
        uint256 _vehicleId,
        uint256 _rentAmount,
        uint256 _depositAmount
    ) external returns (address) {
        address _owner = msg.sender; // owner là người gọi hàm

        require(_user != address(0), "Invalid user address");
        require(_token != address(0), "Invalid token address");

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

    // Lấy tất cả hợp đồng
    function getAllAgreements() external view returns (RentalAgreement[] memory) {
        return allAgreements;
    }
}
