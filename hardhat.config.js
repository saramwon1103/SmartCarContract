import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: "0.8.20",
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545",
      accounts: [
        "0xa3d06d50c7bf74d60c7d1f99c855cf97c91cd9a649bcf47057712bd1774666dc",
        "0x4f521a6c08ea9a08417d259e7c8394d4e51a45fefccbda91070369f58bfcf050",
        "0x0fddd884c2760954d871b856196434c27c6edce4a37400245afd6c713053a9ed"
      ],
    },
  },
};
