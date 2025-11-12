// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CarPayToken {
    string public name = "CarPay Token";
    string public symbol = "CPT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    uint256 public tokenPrice; // Giá 1 token bằng bao nhiêu wei (ETH)

    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event TokensPurchased(address indexed buyer, uint256 ethSpent, uint256 tokensReceived);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        tokenPrice = 287000000000000; // 0.000287 ETH = ~1 USD
        totalSupply = _initialSupply * 10 ** uint256(decimals);
        balanceOf[owner] = totalSupply;
        emit Transfer(address(0), owner, totalSupply);
    }

    // -------------------
    // ERC20 cơ bản
    // -------------------
    function transfer(address _to, uint256 _amount) external returns (bool) {
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
        require(_to != address(0), "Invalid address");

        balanceOf[msg.sender] -= _amount;
        balanceOf[_to] += _amount;
        emit Transfer(msg.sender, _to, _amount);
        return true;
    }

    function approve(address _spender, uint256 _amount) external returns (bool) {
        require(_spender != address(0), "Invalid spender");

        allowance[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _amount) external returns (bool) {
        require(balanceOf[_from] >= _amount, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _amount, "Allowance exceeded");
        require(_to != address(0), "Invalid address");

        balanceOf[_from] -= _amount;
        balanceOf[_to] += _amount;
        allowance[_from][msg.sender] -= _amount;

        emit Transfer(_from, _to, _amount);
        return true;
    }

    // -------------------
    // Mint / Burn
    // -------------------
    function mint(address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Invalid address");
        uint256 tokens = _amount * 10 ** uint256(decimals);
        totalSupply += tokens;
        balanceOf[_to] += tokens;
        emit Transfer(address(0), _to, tokens);
    }

    function burn(uint256 _amount) external {
        uint256 tokens = _amount * 10 ** uint256(decimals);
        require(balanceOf[msg.sender] >= tokens, "Insufficient balance");
        balanceOf[msg.sender] -= tokens;
        totalSupply -= tokens;
        emit Transfer(msg.sender, address(0), tokens);
    }

    // -------------------
    // Mua token bằng ETH
    // -------------------
    function buyTokens() external payable {
        require(msg.value > 0, "Send ETH to buy tokens");

        uint256 tokensToBuy = (msg.value * (10 ** uint256(decimals))) / tokenPrice;
        require(balanceOf[owner] >= tokensToBuy, "Not enough tokens in contract");

        balanceOf[owner] -= tokensToBuy;
        balanceOf[msg.sender] += tokensToBuy;

        emit Transfer(owner, msg.sender, tokensToBuy);
        emit TokensPurchased(msg.sender, msg.value, tokensToBuy);
    }

    // Rút ETH của contract (chủ sở hữu)
    function withdrawETH(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient ETH balance");
        payable(owner).transfer(_amount);
    }

    // Thay đổi giá token (chỉ owner)
    function setTokenPrice(uint256 _newPrice) external onlyOwner {
        tokenPrice = _newPrice;
    }

    // Hàm nhận ETH trực tiếp
    receive() external payable {
        buyTokens();
    }
}
