// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CarPayToken.sol";

contract RentalAgreement {
    enum AgreementStatus { Pending, Active, Completed, Cancelled }

    address public owner;          // Chủ xe
    address public user;         // Người thuê
    address public factory;        // Địa chỉ factory đã tạo contract
    uint256 public vehicleId;      // ID xe
    uint256 public rentAmount;     // Tiền thuê mỗi kỳ
    uint256 public depositAmount;  // Tiền đặt cọc
    uint256 public startDate;      // Ngày bắt đầu
    uint256 public endDate;        // Ngày kết thúc
    string public ipfsHash;        // Lưu hash hợp đồng / file thông tin
    AgreementStatus public status; // Trạng thái hợp đồng

    CarPayToken public token;      // Token thanh toán

    // ===== Events =====
    event AgreementActivated(address indexed renter, uint256 startDate, uint256 endDate);
    event PaymentMade(address indexed renter, uint256 amount, uint256 date);
    event AgreementCompleted(address indexed owner, uint256 date);
    event AgreementCancelled(address indexed initiator, uint256 date);
    event ContractFileHashSet(string ipfsHash);

    // ===== Modifiers =====
    modifier onlyOwner() {
        require(msg.sender == owner, "Not vehicle owner");
        _;
    }

    modifier onlyRenter() {
        require(msg.sender == renter, "Not renter");
        _;
    }

    modifier onlyParticipants() {
        require(msg.sender == owner || msg.sender == renter, "Not participant");
        _;
    }

    // ===== Constructor =====
    constructor(
        address _owner,
        address _renter,
        uint256 _vehicleId,
        uint256 _rentAmount,
        uint256 _depositAmount,
        address _tokenAddress
    ) {
        require(_owner != address(0) && _renter != address(0), "Invalid address");
        owner = _owner;
        renter = _renter;
        vehicleId = _vehicleId;
        rentAmount = _rentAmount;
        depositAmount = _depositAmount;
        token = CarPayToken(_tokenAddress);
        factory = msg.sender;
        status = AgreementStatus.Pending;
    }

    // ===== Functions =====

    /// @notice Renter kích hoạt hợp đồng, chuyển tiền cọc
    function activateAgreement(uint256 _durationDays) external onlyRenter {
        require(status == AgreementStatus.Pending, "Already active");
        require(_durationDays > 0, "Invalid duration");

        startDate = block.timestamp;
        endDate = block.timestamp + (_durationDays * 1 days);

        // Người thuê chuyển tiền cọc vào hợp đồng
        require(token.transferFrom(renter, address(this), depositAmount), "Deposit failed");

        status = AgreementStatus.Active;
        emit AgreementActivated(renter, startDate, endDate);
    }

    /// @notice Thanh toán định kỳ tiền thuê
    function makePayment() external onlyRenter {
        require(status == AgreementStatus.Active, "Not active");
        require(block.timestamp <= endDate, "Contract expired");
        require(token.transferFrom(renter, owner, rentAmount), "Payment failed");

        emit PaymentMade(renter, rentAmount, block.timestamp);
    }

    /// @notice Hoàn tất hợp đồng (do chủ xe xác nhận)
    function completeAgreement() external onlyOwner {
        require(status == AgreementStatus.Active, "Not active");
        status = AgreementStatus.Completed;

        // Hoàn lại tiền cọc cho người thuê
        require(token.transfer(renter, depositAmount), "Refund failed");

        emit AgreementCompleted(owner, block.timestamp);
    }

    /// @notice Hủy hợp đồng (bất kỳ bên nào cũng có thể)
    function cancelAgreement() external onlyParticipants {
        require(status == AgreementStatus.Pending || status == AgreementStatus.Active, "Cannot cancel");
        status = AgreementStatus.Cancelled;

        // Nếu đang active thì chủ xe giữ lại cọc
        if (status == AgreementStatus.Active) {
            require(token.transfer(owner, depositAmount), "Deposit transfer failed");
        }

        emit AgreementCancelled(msg.sender, block.timestamp);
    }

    /// @notice Lưu hash IPFS file hợp đồng (off-chain)
    function setContractFileHash(string memory _ipfsHash) external onlyOwner {
        require(bytes(_ipfsHash).length > 0, "Empty hash");
        ipfsHash = _ipfsHash;
        emit ContractFileHashSet(_ipfsHash);
    }

    /// @notice Lấy thông tin tổng quát của hợp đồng
    function getAgreementInfo()
        external
        view
        returns (
            address _owner,
            address _renter,
            uint256 _vehicleId,
            uint256 _rentAmount,
            uint256 _depositAmount,
            uint256 _startDate,
            uint256 _endDate,
            AgreementStatus _status,
            string memory _ipfsHash
        )
    {
        return (
            owner,
            renter,
            vehicleId,
            rentAmount,
            depositAmount,
            startDate,
            endDate,
            status,
            ipfsHash
        );
    }
}
