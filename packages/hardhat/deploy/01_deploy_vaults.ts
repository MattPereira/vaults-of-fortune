import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/** Deploys all vault contracts using the GoldToken contract address
 * @param hre HardhatRuntimeEnvironment object.
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

  await deploy("MediumRiskVault", {
    from: deployer,
    args: [GoldToken.address],
    log: true,
  });

  await deploy("HighRiskVault", {
    from: deployer,
    args: [GoldToken.address],
    log: true,
  });
};

export default deployVaults;

deployVaults.tags = ["vaults"];
