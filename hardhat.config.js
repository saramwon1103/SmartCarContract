import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 31337
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: [
        // private key deployer (từ Ganache)
        "0xa3d06d50c7bf74d60c7d1f99c855cf97c91cd9a649bcf47057712bd1774666dc"
      ]
    }
  }
};
