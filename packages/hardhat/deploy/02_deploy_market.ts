import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { networkConfig } from "../hardhat-helper-config";

/** Deploys the market contract and fills it with gold
 * @param hre HardhatRuntimeEnvironment object.
 */

const deployMarket: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const goldToken = await hre.ethers.getContract("GoldToken", deployer);
  const lowRiskVault = await hre.ethers.getContract("LowRiskVault", deployer);
  const mediumRiskVault = await hre.ethers.getContract("MediumRiskVault", deployer);
  const highRiskVault = await hre.ethers.getContract("HighRiskVault", deployer);

  // 1. Deploy the market
  const chainId = await hre.ethers.provider.getNetwork().then(network => network.chainId);

  const { vrfCoordinatorAddress, keyHash, subscriptionId, requestConfirmations, callbackGasLimit } =
    networkConfig[chainId];

  await deploy("Market", {
    from: deployer,
    args: [
      goldToken.address,
      lowRiskVault.address,
      mediumRiskVault.address,
      highRiskVault.address,
      vrfCoordinatorAddress,
      keyHash,
      subscriptionId,
      requestConfirmations,
      callbackGasLimit,
    ],
    log: true,
  });

  const market = await hre.ethers.getContract("Market", deployer);

  // 2. Transfer ownership of the vaults to the market
  await lowRiskVault.transferOwnership(market.address);
  await mediumRiskVault.transferOwnership(market.address);
  await highRiskVault.transferOwnership(market.address);

  // 3. Send all the gold to the market
  await goldToken.transfer(market.address, await goldToken.balanceOf(deployer));

  // 4. add market contract to VRF subscription
  try {
    const signer = await hre.ethers.provider.getSigner(deployer);
    const vrfCoordinator = await hre.ethers.getContractAt(
      [
        {
          inputs: [
            {
              internalType: "uint64",
              name: "subId",
              type: "uint64",
            },
            {
              internalType: "address",
              name: "consumer",
              type: "address",
            },
          ],
          name: "addConsumer",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      vrfCoordinatorAddress,
      signer,
    );
    await vrfCoordinator.addConsumer(subscriptionId, market.address);
    console.log("Added market contract to VRF subscription");
  } catch (e) {
    console.log("Failed to add market contract to VRF subscription.");
    console.log(e);
  }
};

export default deployMarket;

deployMarket.tags = ["market"];
