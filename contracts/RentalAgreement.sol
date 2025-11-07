// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CarPayToken.sol";

contract RentalAgreement {
    enum AgreementStatus { Pending, Active, Completed, Cancelled }

    address public admin;       // Admin hệ thống
    address public owner;       // Chủ xe
    address public user;        // Người thuê
    uint256 public vehicleId;
    uint256 public rentAmount;
    uint256 public depositAmount;
    uint256 public startDate;
    uint256 public endDate;
    uint256 public paymentIntervalDays; // số ngày mỗi kỳ thanh toán
    uint256 public nextPaymentDue;
    string public ipfsHash;
    AgreementStatus public status;
    CarPayToken public token;

    bool public ownerSigned;
    bool public userSigned;

    struct Payment {
        uint256 amount;
        uint256 timestamp;
    }

    Payment[] public payments;

    // ===== Events =====
    event AgreementSigned(address indexed signer, string role);
    event AgreementActivated(address indexed user, uint256 startDate, uint256 endDate);
    event PaymentMade(address indexed user, uint256 amount, uint256 date);
    event AgreementCompleted(address indexed owner, uint256 date);
    event AgreementCancelled(address indexed initiator, uint256 date);
    event ContractFileHashSet(string ipfsHash);

    // ===== Modifiers =====
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyUser() {
        require(msg.sender == user, "Not user");
        _;
    }

    modifier onlyParticipants() {
        require(msg.sender == owner || msg.sender == user, "Not participant");
        _;
    }

    // ===== Constructor =====
    constructor(
        address _admin,
        address _owner,
        address _user,
        uint256 _vehicleId,
        uint256 _rentAmount,
        uint256 _depositAmount,
        address _tokenAddress
    ) {
        require(_admin != address(0) && _owner != address(0) && _user != address(0), "Invalid address");

        admin = _admin;
        owner = _owner;
        user = _user;
        vehicleId = _vehicleId;
        rentAmount = _rentAmount;
        depositAmount = _depositAmount;
        token = CarPayToken(_tokenAddress);
        status = AgreementStatus.Pending;
    }

    // ====== Ký hợp đồng ======
    function signAgreementAsOwner() external onlyOwner {
        require(status == AgreementStatus.Pending, "Already processed");
        require(!ownerSigned, "Owner already signed");
        ownerSigned = true;
        emit AgreementSigned(msg.sender, "Owner");
        _tryActivateAgreement();
    }

    function signAgreementAsUser(uint256 _durationDays, uint256 _intervalDays) external onlyUser {
        require(status == AgreementStatus.Pending, "Already processed");
        require(!userSigned, "User already signed");
        require(_durationDays > 0, "Invalid duration");

        userSigned = true;
        paymentIntervalDays = _intervalDays > 0 ? _intervalDays : 30; // mặc định 30 ngày
        emit AgreementSigned(msg.sender, "User");
        _tryActivateAgreement();
    }

    // Kích hoạt khi cả hai bên đã ký
    function _tryActivateAgreement() internal {
        if (ownerSigned && userSigned) {
            startDate = block.timestamp;
            endDate = block.timestamp + (paymentIntervalDays * 1 days * 3); // ví dụ: tổng hợp đồng 3 kỳ
            nextPaymentDue = block.timestamp + (paymentIntervalDays * 1 days);

            // Người thuê gửi cọc
            require(token.transferFrom(user, address(this), depositAmount), "Deposit failed");

            status = AgreementStatus.Active;
            emit AgreementActivated(user, startDate, endDate);
        }
    }

    // ===== Thanh toán =====
    function makePayment() external onlyUser {
        require(status == AgreementStatus.Active, "Not active");
        require(block.timestamp <= endDate, "Contract expired");
        require(block.timestamp >= nextPaymentDue, "Too early for payment");

        require(token.transferFrom(user, owner, rentAmount), "Payment failed");

        payments.push(Payment(rentAmount, block.timestamp));
        nextPaymentDue = block.timestamp + (paymentIntervalDays * 1 days);

        emit PaymentMade(user, rentAmount, block.timestamp);
    }

    // ===== Hoàn tất hợp đồng =====
    function completeAgreement() external onlyOwner {
        require(status == AgreementStatus.Active, "Not active");
        status = AgreementStatus.Completed;

        // Hoàn cọc lại cho người thuê
        require(token.transfer(user, depositAmount), "Refund failed");
        emit AgreementCompleted(owner, block.timestamp);
    }

    // ===== Hủy hợp đồng =====
    function cancelAgreement() external onlyParticipants {
        require(status == AgreementStatus.Pending || status == AgreementStatus.Active, "Cannot cancel");

        if (status == AgreementStatus.Active) {
            // Nếu đang active thì chủ xe giữ lại cọc
            require(token.transfer(owner, depositAmount), "Deposit transferred to owner");
        }

        status = AgreementStatus.Cancelled;
        emit AgreementCancelled(msg.sender, block.timestamp);
    }

    // ===== Thêm file hash IPFS =====
    function setContractFileHash(string memory _ipfsHash) external onlyOwner {
        require(bytes(_ipfsHash).length > 0, "Empty hash");
        ipfsHash = _ipfsHash;
        emit ContractFileHashSet(_ipfsHash);
    }

    // ===== Xem thông tin =====
    function getAgreementInfo()
        external
        view
        returns (
            address _admin,
            address _owner,
            address _user,
            uint256 _vehicleId,
            uint256 _rentAmount,
            uint256 _depositAmount,
            uint256 _startDate,
            uint256 _endDate,
            AgreementStatus _status,
            string memory _ipfsHash,
            bool _ownerSigned,
            bool _userSigned
        )
    {
        return (
            admin,
            owner,
            user,
            vehicleId,
            rentAmount,
            depositAmount,
            startDate,
            endDate,
            status,
            ipfsHash,
            ownerSigned,
            userSigned
        );
    }

    function getPayments() external view returns (Payment[] memory) {
        return payments;
    }
}
