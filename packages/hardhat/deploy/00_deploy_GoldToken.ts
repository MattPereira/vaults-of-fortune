import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/** Deploys GoldToken contract that will be used for vaults of fortune game
 * @param hre HardhatRuntimeEnvironment object.
 */

const deployGoldToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("GoldToken", {
    from: deployer,
    // Contract constructor arguments
    args: [],
    log: true,
  });
};

export default deployGoldToken;

deployGoldToken.tags = ["token"];
