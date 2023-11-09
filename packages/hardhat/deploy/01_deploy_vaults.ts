import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/** Deploys all 3 vault contracts and the market contract
 * @param hre HardhatRuntimeEnvironment object.
 *
 * @notice also transfers ownership of the vaults to the market
 */
const deployVaults: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const GoldToken = await hre.ethers.getContract("GoldToken", deployer);

  // 1. Deploy the vaults
  await deploy("LowRiskVault", {
    from: deployer,
    args: [GoldToken.address],
    log: true,
  });
  const lowRiskVault = await hre.ethers.getContract("LowRiskVault", deployer);

  await deploy("MediumRiskVault", {
    from: deployer,
    args: [GoldToken.address],
    log: true,
  });
  const mediumRiskVault = await hre.ethers.getContract("MediumRiskVault", deployer);

  await deploy("HighRiskVault", {
    from: deployer,
    args: [GoldToken.address],
    log: true,
  });
  const highRiskVault = await hre.ethers.getContract("HighRiskVault", deployer);

  // 2. Deploy the market
  await deploy("Market", {
    from: deployer,
    args: [GoldToken.address, lowRiskVault.address, mediumRiskVault.address, highRiskVault.address],
  });
  const market = await hre.ethers.getContract("Market", deployer);

  // 3. Transfer ownership of the vaults to the market
  await lowRiskVault.transferOwnership(market.address);
  await mediumRiskVault.transferOwnership(market.address);
  await highRiskVault.transferOwnership(market.address);
};

export default deployVaults;

deployVaults.tags = ["vaults"];
