import hre from "hardhat";
import fs from 'fs';
import path from 'path';

async function main() {
  const [admin, owner, user] = await hre.ethers.getSigners();

  console.log("👤 Admin:", admin.address);
  console.log("👤 Owner:", owner.address);
  console.log("👤 User:", user.address);

  // 1. Deploy CarPayToken with proper initial supply
  const Token = await hre.ethers.getContractFactory("CarPayToken");
  const initialSupply = hre.ethers.parseUnits("1000000", 18); // 1,000,000 CPT with 18 decimals
  const token = await Token.deploy(initialSupply);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ CarPayToken deployed to:", tokenAddress);

  // 2. Deploy RentalAgreementFactory
  const Factory = await hre.ethers.getContractFactory("RentalAgreementFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("🏗️ RentalAgreementFactory deployed to:", factoryAddress);

  // 3. Update .env file with deployed addresses
  updateEnvFile(tokenAddress, factoryAddress);
  
  // 4. Update frontend addresses
  updateFrontendAddresses(tokenAddress, factoryAddress);
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📝 Contract addresses have been updated in .env and frontend files");
}

function updateEnvFile(tokenAddress, factoryAddress) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.log('📝 Creating new .env file...');
  }
  
  // Update or add contract addresses
  envContent = envContent.replace(
    /CPT_TOKEN_ADDRESS=.*/g, 
    `CPT_TOKEN_ADDRESS=${tokenAddress}`
  );
  envContent = envContent.replace(
    /FACTORY_ADDRESS=.*/g, 
    `FACTORY_ADDRESS=${factoryAddress}`
  );
  
  // If addresses weren't found in file, add them
  if (!envContent.includes('CPT_TOKEN_ADDRESS=')) {
    envContent += `\nCPT_TOKEN_ADDRESS=${tokenAddress}`;
  }
  if (!envContent.includes('FACTORY_ADDRESS=')) {
    envContent += `\nFACTORY_ADDRESS=${factoryAddress}`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env file with new contract addresses');
}

function updateFrontendAddresses(tokenAddress, factoryAddress) {
  const rentalFormPath = path.join(process.cwd(), 'frontend', 'html', 'rental_form.html');
  
  try {
    let content = fs.readFileSync(rentalFormPath, 'utf8');
    
    // Update CONTRACT_ADDRESSES object
    content = content.replace(
      /CPT_TOKEN:\s*['"][^'"]*['"]/g,
      `CPT_TOKEN: '${tokenAddress}'`
    );
    content = content.replace(
      /FACTORY:\s*['"][^'"]*['"]/g,
      `FACTORY: '${factoryAddress}'`
    );
    
    fs.writeFileSync(rentalFormPath, content);
    console.log('✅ Updated frontend contract addresses');
  } catch (error) {
    console.warn('⚠️ Could not update frontend addresses:', error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
