// blockchain.js - Blockchain interaction utilities
import { ethers } from 'ethers';

// Contract ABIs - extract from compiled contracts
const RENTAL_AGREEMENT_FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_user", "type": "address"},
      {"internalType": "address", "name": "_token", "type": "address"},
      {"internalType": "uint256", "name": "_vehicleId", "type": "uint256"},
      {"internalType": "uint256", "name": "_rentAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "_depositAmount", "type": "uint256"}
    ],
    "name": "createAgreement",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "agreement", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "AgreementCreated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getAllAgreements",
    "outputs": [{"internalType": "contract RentalAgreement[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const CPT_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "balance", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_to", "type": "address"},
      {"internalType": "uint256", "name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_from", "type": "address"},
      {"internalType": "address", "name": "_to", "type": "address"},
      {"internalType": "uint256", "name": "_value", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_spender", "type": "address"},
      {"internalType": "uint256", "name": "_value", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buyTokens",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const RENTAL_AGREEMENT_ABI = [
  {
    "inputs": [],
    "name": "getAgreementInfo",
    "outputs": [
      {"internalType": "address", "name": "_admin", "type": "address"},
      {"internalType": "address", "name": "_owner", "type": "address"},
      {"internalType": "address", "name": "_user", "type": "address"},
      {"internalType": "uint256", "name": "_vehicleId", "type": "uint256"},
      {"internalType": "uint256", "name": "_rentAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "_depositAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "_startDate", "type": "uint256"},
      {"internalType": "uint256", "name": "_endDate", "type": "uint256"},
      {"internalType": "uint8", "name": "_status", "type": "uint8"},
      {"internalType": "string", "name": "_ipfsHash", "type": "string"},
      {"internalType": "bool", "name": "_ownerSigned", "type": "bool"},
      {"internalType": "bool", "name": "_userSigned", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "signAgreement",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}],
    "name": "makePayment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Configuration
const BLOCKCHAIN_CONFIG = {
  // Hardhat local network
  HARDHAT_RPC: "http://127.0.0.1:8545",
  // Ganache network (if using)
  GANACHE_RPC: "http://127.0.0.1:7545",
  
  // Contract addresses - these should be updated after deployment
  CONTRACT_ADDRESSES: {
    CPT_TOKEN: process.env.CPT_TOKEN_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Will be updated after deploy
    FACTORY: process.env.FACTORY_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" // Will be updated after deploy
  },
  
  // Admin private key for backend transactions
  ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
};

class BlockchainService {
  constructor() {
    // Initialize provider based on environment
    const rpcUrl = process.env.NODE_ENV === 'production' ? 
      process.env.MAINNET_RPC_URL : BLOCKCHAIN_CONFIG.HARDHAT_RPC;
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.isBlockchainAvailable = false;
    this.lastConnectionCheck = 0;
    this.CONNECTION_CHECK_INTERVAL = 30000; // Check every 30 seconds
    
    // Admin wallet for backend operations
    this.adminWallet = new ethers.Wallet(BLOCKCHAIN_CONFIG.ADMIN_PRIVATE_KEY, this.provider);
    
    // Contract instances
    this.factoryContract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.CONTRACT_ADDRESSES.FACTORY,
      RENTAL_AGREEMENT_FACTORY_ABI,
      this.adminWallet
    );
    
    this.cptTokenContract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.CONTRACT_ADDRESSES.CPT_TOKEN,
      CPT_TOKEN_ABI,
      this.adminWallet
    );
  }

  // Check if blockchain is available
  async checkBlockchainAvailability() {
    const now = Date.now();
    if (now - this.lastConnectionCheck < this.CONNECTION_CHECK_INTERVAL) {
      return this.isBlockchainAvailable;
    }

    try {
      await this.provider.getBlockNumber();
      if (!this.isBlockchainAvailable) {
        console.log('✅ Blockchain connection restored');
      }
      this.isBlockchainAvailable = true;
    } catch (error) {
      if (this.isBlockchainAvailable) {
        console.warn('⚠️ Blockchain node unavailable (Hardhat node not running)');
      }
      this.isBlockchainAvailable = false;
    }

    this.lastConnectionCheck = now;
    return this.isBlockchainAvailable;
  }

  // Create rental agreement on blockchain
  async createRentalAgreement(params) {
    try {
      const {
        userAddress,
        ownerAddress,
        vehicleId,
        rentAmountCPT,
        depositAmountCPT,
        carData
      } = params;

      // Validate addresses
      if (!ethers.isAddress(userAddress) || !ethers.isAddress(ownerAddress)) {
        throw new Error('Invalid wallet address format');
      }

      // Convert CPT amounts to wei (assuming 18 decimals)
      const rentAmountWei = ethers.parseUnits(rentAmountCPT.toString(), 18);
      const depositAmountWei = ethers.parseUnits(depositAmountCPT.toString(), 18);

      console.log('Creating agreement with params:', {
        userAddress,
        ownerAddress,
        vehicleId,
        rentAmountWei: rentAmountWei.toString(),
        depositAmountWei: depositAmountWei.toString()
      });

      // Create contract using owner's signature would be ideal,
      // but for demo purposes, admin creates it
      const tx = await this.factoryContract.createAgreement(
        userAddress,
        BLOCKCHAIN_CONFIG.CONTRACT_ADDRESSES.CPT_TOKEN,
        vehicleId,
        rentAmountWei,
        depositAmountWei
      );

      console.log('Transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      // Extract agreement address from events
      const agreementCreatedEvent = receipt.logs.find(log => {
        try {
          const decoded = this.factoryContract.interface.parseLog(log);
          return decoded.name === 'AgreementCreated';
        } catch (e) {
          return false;
        }
      });

      let agreementAddress = null;
      if (agreementCreatedEvent) {
        const decoded = this.factoryContract.interface.parseLog(agreementCreatedEvent);
        agreementAddress = decoded.args[0];
        console.log('Agreement contract deployed at:', agreementAddress);
      }

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        agreementAddress,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('Blockchain error:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  // Get CPT token balance
  async getCPTBalance(userAddress) {
    try {
      // Check blockchain availability first
      const isAvailable = await this.checkBlockchainAvailability();
      if (!isAvailable) {
        return '0'; // Return 0 silently if blockchain unavailable
      }

      if (!ethers.isAddress(userAddress)) {
        throw new Error('Invalid address format');
      }

      const cptTokenAddress = BLOCKCHAIN_CONFIG.CONTRACT_ADDRESSES.CPT_TOKEN;
      
      // Check if contract is deployed
      const code = await this.provider.getCode(cptTokenAddress);
      if (code === '0x') {
        console.warn('CPT Token contract not deployed at:', cptTokenAddress);
        return '0';
      }

      const balance = await this.cptTokenContract.balanceOf(userAddress);
      return ethers.formatUnits(balance, 18);
      
    } catch (error) {
      // Only log if blockchain should be available
      if (this.isBlockchainAvailable) {
        console.error('Error getting CPT balance for', userAddress, ':', error.message);
      }
      // Return 0 instead of throwing error to prevent API crashes
      return '0';
    }
  }

  // Get token price from CarPayToken contract
  async getTokenPrice() {
    try {
      const isAvailable = await this.checkBlockchainAvailability();
      if (!isAvailable) {
        return null;
      }

      const tokenPrice = await this.cptTokenContract.tokenPrice();
      return tokenPrice;
    } catch (error) {
      console.error('Error getting token price:', error);
      return null;
    }
  }

  // Get transaction receipt
  async getTransactionReceipt(txHash) {
    try {
      const isAvailable = await this.checkBlockchainAvailability();
      if (!isAvailable) {
        return null;
      }

      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      return null;
    }
  }

  // Get agreement info from contract
  async getAgreementInfo(agreementAddress) {
    try {
      const agreementContract = new ethers.Contract(
        agreementAddress,
        RENTAL_AGREEMENT_ABI,
        this.provider
      );

      const info = await agreementContract.getAgreementInfo();
      
      return {
        admin: info[0],
        owner: info[1],
        user: info[2],
        vehicleId: info[3].toString(),
        rentAmount: ethers.formatUnits(info[4], 18),
        depositAmount: ethers.formatUnits(info[5], 18),
        startDate: info[6].toString(),
        endDate: info[7].toString(),
        status: info[8], // enum value
        ipfsHash: info[9],
        ownerSigned: info[10],
        userSigned: info[11]
      };
    } catch (error) {
      console.error('Error getting agreement info:', error);
      throw error;
    }
  }

  // Validate transaction hash
  async getTransactionReceipt(txHash) {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      return null;
    }
  }

  // ===== PAYMENT METHODS =====

  // Make periodic payment
  async makePayment(agreementAddress, userAddress) {
    try {
      console.log(`Making payment for agreement: ${agreementAddress}`);
      
      // Get user signer
      const userSigner = this.getUserSigner(userAddress);
      const agreementContract = new ethers.Contract(
        agreementAddress,
        this.rentalAgreementABI,
        userSigner
      );

      // Call makePayment function
      const tx = await agreementContract.makePayment({
        gasLimit: 200000
      });
      
      console.log('Payment transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Payment transaction confirmed:', receipt.hash);

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: 'confirmed'
      };
      
    } catch (error) {
      console.error('Error making payment:', error);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  // Complete rental agreement (owner only)
  async completeAgreement(agreementAddress, ownerAddress) {
    try {
      console.log(`Completing agreement: ${agreementAddress}`);
      
      // Get owner signer  
      const ownerSigner = this.getOwnerSigner(ownerAddress);
      const agreementContract = new ethers.Contract(
        agreementAddress,
        this.rentalAgreementABI,
        ownerSigner
      );

      // Call completeAgreement function
      const tx = await agreementContract.completeAgreement({
        gasLimit: 150000
      });
      
      console.log('Complete agreement transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Complete agreement confirmed:', receipt.hash);

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: 'confirmed'
      };
      
    } catch (error) {
      console.error('Error completing agreement:', error);
      throw new Error(`Complete agreement failed: ${error.message}`);
    }
  }

  // Cancel rental agreement
  async cancelAgreement(agreementAddress, initiatorAddress) {
    try {
      console.log(`Cancelling agreement: ${agreementAddress}`);
      
      // Get appropriate signer
      const signer = this.getUserSigner(initiatorAddress);
      const agreementContract = new ethers.Contract(
        agreementAddress,
        this.rentalAgreementABI,
        signer
      );

      // Call cancelAgreement function
      const tx = await agreementContract.cancelAgreement({
        gasLimit: 150000
      });
      
      console.log('Cancel agreement transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Cancel agreement confirmed:', receipt.hash);

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: 'confirmed'
      };
      
    } catch (error) {
      console.error('Error cancelling agreement:', error);
      throw new Error(`Cancel agreement failed: ${error.message}`);
    }
  }

  // Get payment history from blockchain
  async getPaymentHistory(agreementAddress) {
    try {
      const agreementContract = new ethers.Contract(
        agreementAddress,
        this.rentalAgreementABI,
        this.provider
      );

      // Get PaymentMade events
      const filter = agreementContract.filters.PaymentMade();
      const events = await agreementContract.queryFilter(filter);
      
      const payments = events.map(event => ({
        user: event.args.user,
        amount: ethers.formatUnits(event.args.amount, 18),
        timestamp: new Date(Number(event.args.date) * 1000).toISOString(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      }));

      return {
        success: true,
        payments
      };
      
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw new Error(`Failed to get payment history: ${error.message}`);
    }
  }

  // Check if payment is due
  async checkPaymentStatus(agreementAddress) {
    try {
      const agreementContract = new ethers.Contract(
        agreementAddress,
        this.rentalAgreementABI,
        this.provider
      );

      const nextPaymentDue = await agreementContract.nextPaymentDue();
      const currentTime = Math.floor(Date.now() / 1000);
      
      const isPaymentDue = currentTime >= Number(nextPaymentDue);
      const daysUntilDue = Math.ceil((Number(nextPaymentDue) - currentTime) / (24 * 60 * 60));
      
      return {
        success: true,
        isPaymentDue,
        nextPaymentDue: new Date(Number(nextPaymentDue) * 1000).toISOString(),
        daysUntilDue,
        currentTime: new Date(currentTime * 1000).toISOString()
      };
      
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw new Error(`Failed to check payment status: ${error.message}`);
    }
  }

  // Get current gas price
  async getGasPrice() {
    try {
      const gasPrice = await this.provider.getFeeData();
      return {
        gasPrice: gasPrice.gasPrice.toString(),
        maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString()
      };
    } catch (error) {
      console.error('Error getting gas price:', error);
      return null;
    }
  }

  // Sign agreement as owner (for testing)
  async signAgreementAsOwner(contractAddress) {
    try {
      console.log(`🖊️ Signing agreement as owner: ${contractAddress}`);

      // Create contract instance
      const agreementContract = new ethers.Contract(
        contractAddress,
        RENTAL_AGREEMENT_ABI,
        this.wallet
      );

      // Check current status
      const [ownerSigned, userSigned, status] = await Promise.all([
        agreementContract.ownerSigned(),
        agreementContract.userSigned(),
        agreementContract.status()
      ]);

      console.log('Agreement status before owner sign:', {
        ownerSigned,
        userSigned, 
        status
      });

      if (ownerSigned) {
        throw new Error('Owner has already signed this agreement');
      }

      // Sign as owner
      const tx = await agreementContract.signAgreementAsOwner();
      console.log(`Owner signature transaction submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`Owner signature confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        message: 'Owner signature completed successfully'
      };

    } catch (error) {
      console.error('Error signing as owner:', error);
      throw error;
    }
  }

  // Get agreement information
  async getAgreementInfo(contractAddress) {
    try {
      const agreementContract = new ethers.Contract(
        contractAddress,
        RENTAL_AGREEMENT_ABI,
        this.provider
      );

      const [
        admin,
        owner, 
        user,
        vehicleId,
        rentAmount,
        depositAmount,
        ownerSigned,
        userSigned,
        status
      ] = await Promise.all([
        agreementContract.admin(),
        agreementContract.owner(),
        agreementContract.user(),
        agreementContract.vehicleId(),
        agreementContract.rentAmount(),
        agreementContract.depositAmount(),
        agreementContract.ownerSigned(),
        agreementContract.userSigned(),
        agreementContract.status()
      ]);

      return {
        address: contractAddress,
        admin,
        owner,
        user,
        vehicleId: vehicleId.toString(),
        rentAmount: ethers.formatUnits(rentAmount, 18),
        depositAmount: ethers.formatUnits(depositAmount, 18),
        ownerSigned,
        userSigned,
        status: ['Pending', 'Active', 'Completed', 'Cancelled'][Number(status)]
      };

    } catch (error) {
      console.error('Error getting agreement info:', error);
      throw error;
    }
  }
}

export default BlockchainService;
export { BLOCKCHAIN_CONFIG };