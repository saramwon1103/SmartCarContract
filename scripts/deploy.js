import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [admin, owner, user] = await ethers.getSigners();

  console.log("👤 Admin:", admin.address);
  console.log("👤 Owner:", owner.address);
  console.log("👤 User:", user.address);

  // 1️⃣ Deploy token (provide initial supply)
  const Token = await ethers.getContractFactory("CarPayToken");
  const initialSupply = ethers.parseUnits("1000000", 18); // 1,000,000 CPT with 18 decimals
  const token = await Token.deploy(initialSupply);
  await token.waitForDeployment();
  console.log("✅ Token deployed at:", await token.getAddress());

  // 2️⃣ Deploy factory
  const Factory = await ethers.getContractFactory("RentalAgreementFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  console.log("🏗️ Factory deployed at:", await factory.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
